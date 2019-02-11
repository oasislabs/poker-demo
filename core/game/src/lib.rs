#![feature(int_to_from_bytes)]

#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate quick_error;

extern crate rand;

extern crate game_engine;
extern crate game_engine_derive;

use serde_json::Value;
use std::error::Error;
use game_engine::{*, Game as InnerGame};
use game_engine_derive::{flow, moves};
use rand::{Rng, SeedableRng, ChaChaRng};

const NUM_DECK_SUITS: usize = 4;
const NUM_DECK_VALUES: usize = 13;

const NUM_PLAYERS: u16 = 2;

/// Error types.
quick_error! {
    #[derive(Debug)]
    pub enum Errors {
        InvalidMove {
            description("invalid move")
            display("This move cannot be made.")
        }
    }
}

/// Define the state shape.
/// State type: X if held by player X, -1 if still in deck.
pub type CardDeck = [[u16; NUM_DECK_VALUES]; NUM_DECK_SUITS];

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Card {
    pub suit: u8,
    pub rank: u8
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct State {
    pub cards: CardDeck,
    pub still_playing: Vec<bool>,
    pub hands: Vec<Vec<Card>>,
    pub rand_seed: [u8; 32]
}

impl Default for State {

    // All cards are hidden in deck
    fn default() -> Self {
        
        /* // Initialize two empty hands
        let mut initial_hands = HashMap::new();
        initial_hands.insert(1, Vec::new());
        initial_hands.insert(2, Vec::new()); */
        
        State {
            cards: [[0; NUM_DECK_VALUES]; NUM_DECK_SUITS],
            still_playing: vec![true; NUM_PLAYERS as usize],
            hands: vec![Vec::new(), Vec::new()],
            rand_seed: [0 as u8; 32]
        }
    }
}

// Returns a 0-51 idx of the card drawn
fn draw_card(deck: &CardDeck, rng: &mut ChaChaRng) -> (usize, usize) {
    
    let card_drawn: bool = false;

    while !card_drawn {
        
        let suit = rng.gen_range(0, NUM_DECK_SUITS);
        let value = rng.gen_range(0, NUM_DECK_VALUES);
    
        if deck[suit][value] == 0 {
            return (suit, value);
        }
    }

    // TODO: Error Checking
    return (0, 0);
} 

// Returns a vector of hand scores
fn get_player_score(hand: &Vec<Card>) -> u8 {

    let mut score : u8 = 0;
    let mut aces : u8 = 0;

    // We let 1 = Ace.... 13 = King.
    for card in hand {
        
        // All indices from 10-K are worth 10
        if card.rank > 10 {
            score += 10;
        } else if card.rank == 1 {
            score += 11;
            aces += 1;
        } else {
            score += card.rank
        }

        // We treat aces as 11 by default. 
        // If the score is over 21, convert from 11 to 1. 
        while score > 21 {
            if aces < 1 {
                break;
            } else {
                score -= 10;
                aces -= 1;
            } 
        }

    }
    
    score
}

/// Define your moves as methods in this trait.
#[moves]
trait Moves {

    fn blackjack_move(state: &mut UserState<State>, args: &Option<Value>)
                -> Result<(), Box<Error>> {

        if let Some(value) = args {
            let action: u64 = value.as_array()
                .and_then(|arr| arr.get(0))
                .and_then(|click| click.as_u64())
                .ok_or(Box::new(Errors::InvalidMove))?;

            // Hit
            if action == 0 {

                let mut rng = ChaChaRng::from_seed(state.g.rand_seed);

                let (card_suit, card_value): (usize, usize) = draw_card(&state.g.cards, &mut rng);
                state.g.cards[card_suit][card_value] = state.ctx.current_player;
                
                let player_hand = &mut state.g.hands[state.ctx.current_player as usize - 1];

                player_hand.push(Card {
                            suit: card_suit as u8,
                            rank: (card_value as u8) + 1
                        });

                // BUST or stop
                if get_player_score(player_hand) >= 21 {
                    state.g.still_playing[state.ctx.current_player as usize - 1] = false;
                }

            // Stay and stop
            } else if action == 1 {
                state.g.still_playing[state.ctx.current_player as usize - 1] = false;
            
            } else {
                return Err(Box::new(Errors::InvalidMove))
            }

        }

        Ok(())
    }
}

/// Define the game flow.
#[flow]
trait Flow {
    fn initial_state(&self) -> State {    
        
        let seed = self.seed.unwrap();
        let mut seed_arr = [0 as u8; 32];
        for (i, byte) in seed.to_le_bytes().iter().enumerate() {
            seed_arr[i] = *byte
        };

        let mut all_hands = Vec::new();
        let mut initial_deck = [[0; NUM_DECK_VALUES]; NUM_DECK_SUITS];
        let mut rng = ChaChaRng::from_seed(seed_arr);

        // Create initial hand of 2 for all players
        for player in 0..NUM_PLAYERS {

            let mut player_hand = Vec::new(); 

            for _i in 0..2 {

                let (card_suit, card_value): (usize, usize) = draw_card(&initial_deck, &mut rng);
                initial_deck[card_suit][card_value] = player + 1;

                player_hand.push(Card {
                        suit: card_suit as u8,
                        rank: (card_value as u8) + 1
                    });
            
            }

            all_hands.push(player_hand);
        }

        State {
            cards: initial_deck,
            still_playing: vec![true; NUM_PLAYERS as usize],
            hands: all_hands,
            rand_seed: seed_arr
        }
    }

    fn end_turn_if(&self, state : &UserState<State>) -> bool {
        // End the turn once the current player has asked to stay.
        !state.g.still_playing[state.ctx.current_player as usize - 1]
    }

    fn end_game_if(&self, state: &UserState<State>) -> Option<(Option<Score>, Value)> {
        
        let mut game_over = true;

        // All players have stayed
        for (_, is_playing) in state.g.still_playing.iter().enumerate() {
            if *is_playing {
                game_over = false;
            }
        }

        if game_over {

            let mut best_score = 0;
            let mut player_score;     

            // Use the max player idx + 1 to indicate a draw    
            let mut winner = NUM_PLAYERS; 
            let mut scores = Vec::new();

            for player in 0..NUM_PLAYERS {
                player_score = get_player_score(&state.g.hands[player as usize]);
                scores.push(player_score);
                if player_score <= 21 && player_score > best_score {
                    best_score = player_score;
                    winner = player;
                } else if player_score == best_score {
                    winner = NUM_PLAYERS // best score is a draw, for now
                }
            }

            // Everyone bust or top score is a tie
            if winner == NUM_PLAYERS {
                return Some((Some(Score::Draw), json!({
                    "draw": true,
                    "scores": scores
                })));    
            }

            return Some((Some(Score::Win(winner)), json!({
                "winner": winner + 1,
                "scores": scores
            })));
        }
        None
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
