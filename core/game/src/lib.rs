mod resolver;

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

const NUM_PLAYERS: usize = 2;
const STANDARD_BET_SIZE: u16 = 2;

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
/// State type: false if not in deck, true if still in deck.
pub type CardDeck = [[bool; NUM_DECK_VALUES]; NUM_DECK_SUITS];

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Card {
    pub suit: u8,
    pub rank: u8
}

#[derive(Clone, Debug)]
pub struct CardRanking {
    pub player: usize,
    pub hand: u8,
    pub tiebreak: Vec<u8>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct State {
    pub cards: CardDeck,
    pub hands: Vec<Vec<Card>>,
    pub needs_action: Vec<bool>,
    pub still_in: Vec<bool>,
    pub first_action: u16,
    pub card_table: Vec<Card>,
    pub chips: Vec<u16>,
    pub chip_table: Vec<u16>,
    pub bet_amount: u16,
    pub hand_pot: u16,
    pub hand_over: bool,
    pub last_move: String
}

impl Default for State {

    // All cards are hidden in deck
    fn default() -> Self {
        
        State {
            cards: [[true; NUM_DECK_VALUES]; NUM_DECK_SUITS],
            hands: vec![Vec::new(), Vec::new()],
            needs_action: vec![true; NUM_PLAYERS],
            still_in: vec![true; NUM_PLAYERS],
            first_action: 1,
            card_table: Vec::new(),
            chips: vec![64; NUM_PLAYERS],
            chip_table: vec![0; NUM_PLAYERS],
            bet_amount: 0,
            hand_pot: 0,
            hand_over: true,
            last_move: String::from("New Hand")
        }
    }
}

// Returns a ([0-3],[0-12]) idx of the card drawn
fn draw_cards(deck: &mut CardDeck, num_cards_needed: u8) -> Vec<Card> {
    
    let mut rng;

    unsafe {

        let mut seed_arr = [0 as u8; 32];
        for (i, byte) in SEED.to_le_bytes().iter().enumerate() {
            seed_arr[i] = *byte
        };

        rng = ChaChaRng::from_seed(seed_arr);
    }

    let mut num_cards_drawn: u8 = 0;
    let mut card_vec = Vec::new();

    while num_cards_drawn != num_cards_needed {
        
        let card_suit = rng.gen_range(0, NUM_DECK_SUITS);
        let card_rank = rng.gen_range(0, NUM_DECK_VALUES);
    
        if deck[card_suit][card_rank] {
            num_cards_drawn += 1;
            deck[card_suit][card_rank] = false;
            card_vec.push(Card {
                suit: card_suit as u8, 
                rank: card_rank as u8 + 1
            });
        }
    }

    return card_vec;
} 

// The hand is over because everyone but one person folded  
fn hand_is_over_folded(state: &UserState<State>) -> (bool, usize) {

    let mut players_in = 0;
    let mut winner_idx = 0;

    for i in 0..NUM_PLAYERS {
        
        if state.g.still_in[i] {
            players_in += 1;
            winner_idx = i;
        }
    }

    // true only if 1 player is left
    return (players_in == 1, winner_idx)

}

// The round is over because all bets are equal 
fn betting_round_is_over(state: &UserState<State>) -> bool {

    for i in 0..NUM_PLAYERS {
        
        if state.g.still_in[i] && state.g.needs_action[i] {
            return false;
        } 
    }

    true    
}

/**
 * Start the next betting round, ignores all in hands.
 */
fn next_betting_round(state: &mut UserState<State>) {
    
    println!("Start a new betting round.");

    for i in 0..NUM_PLAYERS {
        
        state.g.hand_pot += state.g.chip_table[i];
        state.g.chip_table[i] = 0;

        if state.g.still_in[i] {
            state.g.needs_action[i] = true;
        } 
    
    }

    state.g.bet_amount = 0;

}

fn deal_new_hand(state: &mut UserState<State>) {

    // Reset all player status
    state.g.needs_action = vec![true; NUM_PLAYERS];
    state.g.still_in = vec![true; NUM_PLAYERS];
    state.g.hand_over = false;

    // Create initial hand of 2 for all players
    for player in 0..NUM_PLAYERS {

        let player_hand = draw_cards(&mut state.g.cards, 2); 
        state.g.hands[player] = player_hand;
    }
    
}

fn payout_and_reset_hand(winner: usize, state: &mut UserState<State>) {
    
    // Pay the winner
    state.g.bet_amount = 0;
    state.g.hand_pot += state.g.chip_table.iter().sum::<u16>();
    state.g.chips[winner] += state.g.hand_pot;
    state.g.chip_table = vec![0; NUM_PLAYERS];
    state.g.hand_pot = 0;
    
    state.g.first_action = (state.g.first_action % state.ctx.num_players) + 1;

    // Find next non-eliminated player
    while state.g.chips[state.g.first_action as usize - 1] <= 0 {
        state.g.first_action = (state.g.first_action % state.ctx.num_players) + 1;
    }

    // Clear the table and shuffle the deck
    state.g.hand_over = true;
    state.g.card_table = Vec::new();
    state.g.hands = vec![Vec::new(), Vec::new()];
    state.g.cards = [[true; NUM_DECK_VALUES]; NUM_DECK_SUITS];  
    state.g.still_in = vec![false; NUM_PLAYERS];

}

/// Define your moves as methods in this trait.
#[moves]
trait Moves {

    fn poker_move(state: &mut UserState<State>, args: &Option<Value>)
                -> Result<(), Box<Error>> {

        if let Some(value) = args {
            let action: u64 = value.as_array()
                .and_then(|arr| arr.get(0))
                .and_then(|click| click.as_u64())
                .ok_or(Box::new(Errors::InvalidMove))?;

            let player_idx = state.ctx.action_players.clone().expect("No acting players found")[0] as usize - 1;

            match action {
                
                // Check or Call
                1 => {
                    
                    let needed_bet = state.g.bet_amount - state.g.chip_table[player_idx];
                    state.g.chip_table[player_idx] += needed_bet;
                    state.g.chips[player_idx] -= needed_bet;

                    state.g.needs_action[player_idx] = false;
                    
                    // UI Output
                    if needed_bet == 0 {
                        state.g.last_move = String::from("Check");
                    } else {
                        let mut move_log = String::from("Call ");
                        move_log.push_str(&state.g.bet_amount.to_string());
                        state.g.last_move = move_log;
                    }
                    
                    return Ok(());
                },

                // Standard bet/raise
                2 => {
                    
                    // Raise the required bet
                    if state.g.bet_amount == 0 {
                        
                        state.g.bet_amount = STANDARD_BET_SIZE;
                        
                        let mut move_log = String::from("Bet ");
                        move_log.push_str(&state.g.bet_amount.to_string());
                        state.g.last_move = move_log; 
                    } else {
                        
                        state.g.bet_amount *= 2;

                        let mut move_log = String::from("Raise ");
                        move_log.push_str(&state.g.bet_amount.to_string());
                        state.g.last_move = move_log;
                    }
                    
                    // Pay for it
                    let needed_bet = state.g.bet_amount - state.g.chip_table[player_idx];
                    state.g.chip_table[player_idx] += needed_bet;
                    state.g.chips[player_idx] -= needed_bet;

                    // Since the bet has been raised, everyone who is still in the hand needs action.
                    for i in 0..NUM_PLAYERS {
                        if state.g.still_in[i] {
                            state.g.needs_action[i] = true;
                        }
                    }

                    state.g.needs_action[player_idx] = false;
                    return Ok(());

                },

                // All in
                3 => {
                    
                    // TODO: Handle case when others should actually be all in, and we don't bet the full amount
                    state.g.bet_amount = state.g.chips[player_idx];
                    state.g.chip_table[player_idx] += state.g.chips[player_idx];
                    state.g.chips[player_idx] = 0;

                    // Since the bet has been raised, everyone who is still in the hand needs action.
                    for i in 0..NUM_PLAYERS {
                        if state.g.still_in[i] {
                            state.g.needs_action[i] = true;
                        }
                    }

                    let mut move_log = String::from("All In ");
                    move_log.push_str(&state.g.bet_amount.to_string());
                    state.g.last_move = move_log;
                    state.g.needs_action[player_idx] = false;
                    return Ok(());

                },

                // Fold
                0 => {
                    
                    if !state.g.still_in[player_idx] {
                        return Err(Box::new(Errors::InvalidMove));
                    }

                    state.g.last_move = String::from("Fold");
                    state.g.still_in[player_idx] = false;
                    state.g.needs_action[player_idx] = false;
                    return Ok(());
                },

                _ => return Err(Box::new(Errors::InvalidMove)),
            }

        }

        Ok(())
    }
}

/// Define the game flow.
#[flow]
trait Flow {

    fn initial_state(&self) -> State {    
    
        let initial_deck = [[true; NUM_DECK_VALUES]; NUM_DECK_SUITS];

        State {
            cards: initial_deck,
            hands: vec![Vec::new(), Vec::new()],
            needs_action: vec![true; NUM_PLAYERS as usize],
            still_in: vec![true; NUM_PLAYERS as usize],
            first_action: 1,
            card_table: Vec::new(),
            chips: vec![64; NUM_PLAYERS as usize],
            chip_table: vec![0; NUM_PLAYERS as usize],
            bet_amount: 0,
            hand_pot: 0,
            hand_over: true,
            last_move: String::from("New Hand")
        }

    }

    fn on_turn_begin(&self, state: &mut UserState<State>) 
        -> Result<(), Box<Error>> {

        if state.g.hand_over {
            deal_new_hand(state);
        } 

        if betting_round_is_over(state) {

            println!("Betting round is over for player {:?}", state.ctx.action_players);

            // Deal cards if needed
            match state.g.card_table.len() {
                0 => {
                    state.g.card_table = draw_cards(&mut state.g.cards, 3);
                    next_betting_round(state);
                },
                3 => {
                    state.g.card_table.append(&mut draw_cards(&mut state.g.cards, 1));
                    next_betting_round(state);
                },
                4 => {
                    state.g.card_table.append(&mut draw_cards(&mut state.g.cards, 1));
                    next_betting_round(state);
                },
                _ => return Err(Box::new(Errors::InvalidMove)),
            } 
        }

        Ok(())

    }

    fn on_move(&self, state: &mut UserState<State>, _: &Move) -> Result<(), Box<Error>> {

        // End hand via fold
        let (is_over, fold_winner) = hand_is_over_folded(state);
        if is_over {
            payout_and_reset_hand(fold_winner, state);
            return Ok(());
        }
        
        // End hand via evaluation
        if betting_round_is_over(state) && state.g.card_table.len() == 5 {
            
            // TODO: hand resolution
            let mut winner = CardRanking{
                player: 0,
                hand: 0,
                tiebreak: vec![0]
                };

            for i in 0..(state.ctx.num_players as usize) {
                
                if state.g.still_in[i] {
                    
                    state.g.hands[i].extend_from_slice(&state.g.card_table);
                    let hand_rank = resolver::evaluate_best_hand(i, &state.g.hands[i].clone());
                    
                    println!("Player {} best hand is {}-{:?}", hand_rank.player, hand_rank.hand, hand_rank.tiebreak);

                    if hand_rank.hand > winner.hand {
                        winner = hand_rank;
                    } else if hand_rank.hand == winner.hand {
                        println!("Need tiebreaker to resolve hand");
                        // Tiebreakers
                        for j in 0..hand_rank.tiebreak.len() {
                            if hand_rank.tiebreak[j] > winner.tiebreak[j] {
                                winner = hand_rank;
                                break;
                            } else if hand_rank.tiebreak[j] < winner.tiebreak[j] {
                                break;
                            }
                        }
                        
                        // TODO: Hand is completely tied, do a split pot.
                    
                    }
                    
                }
            }

            println!("Hand was won by player {} with hand ranking {}", winner.player, winner.hand);
            payout_and_reset_hand(winner.player, state);

        }

        Ok(())
    }

    fn get_current_players(&self, state: &UserState<State>) -> Option<Vec<u16>> {

        let mut next_to_play = Vec::new();

        let action_player = match state.ctx.action_players {
            Some(ref players) => players[0],
            None => 1,
        };

        let mut next_candidate = (action_player + 1) % state.ctx.num_players;

        let mut move_counter = 0;

        // Not 0-indexed, required to be 1 or 2
        if state.g.hand_over || betting_round_is_over(state) {
            next_to_play.push(state.g.first_action);
            return Some(next_to_play);
        } 

        while next_to_play.is_empty() {          

            if state.g.needs_action[next_candidate as usize] {
                next_to_play.push(next_candidate + 1);
                break;
            } 
            
            next_candidate = (next_candidate + 1) % state.ctx.num_players;
            move_counter += 1;

            if move_counter > state.ctx.num_players {
                panic!("Game state stuck in finding next players. Acting player {}", action_player)
            }

        }

        Some(next_to_play)
    }  
   

    fn end_turn_if(&self, _: &UserState<State>) -> bool {
        true
    }

    fn end_game_if(&self, state: &UserState<State>) -> Option<(Option<Score>, Value)> {

        let mut players_in = 0;
        let mut winner_idx: u16 = 0;

        for i in 0..NUM_PLAYERS {
            
            // To be in, you must have chips or still be alive in a hand
            if state.g.chips[i] > 0 || state.g.still_in[i] {
                players_in += 1;
                winner_idx = i as u16;
            }
        }

        if players_in == 1 {
            return Some((Some(Score::Win(winner_idx + 1)), json!({
                "winner": winner_idx + 1
            })));
        }

        None

    }
}

#[cfg(test)]
mod tests{
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
