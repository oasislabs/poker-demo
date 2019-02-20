/**
 * Module that handles hand resolution
 */

use std::collections::HashMap;
use Card;
use CardRanking;

const STRAIGHT_FLUSH : u8 = 8;
const QUADS : u8 = 7;
const FULL_HOUSE : u8 = 6;
const FLUSH : u8 = 5;
const STRAIGHT : u8 = 4;
const TRIPLE : u8 = 3;
const TWO_PAIR : u8 = 2;
const PAIR : u8 = 1;
const HIGH : u8 = 0;

// Given a list of 7 card combinations, return the best hand
// Leave an arbitrary Vec in the return value for tiebreaking
pub fn evaluate_best_hand(player: usize, hand: &Vec<Card>) -> CardRanking {

    let mut working_hand = hand.clone();
    working_hand.sort_by(|a, b| b.rank.cmp(&a.rank));

    let subsets = to_ranked_subsets(&working_hand);

    // Just go down the ranking of hands
    match is_straight_flush(&subsets) {
        Some(best_hand) => return CardRanking {
            player: player,
            hand: STRAIGHT_FLUSH, 
            tiebreak: vec![best_hand[0].rank]
            },
        None => (),
    };

    let histogram = to_histogram(&working_hand);

    // Quads
    if histogram.contains_key(&4) {
        return CardRanking {
            player: player,
            hand: QUADS, 
            tiebreak: vec![*histogram.get(&4).expect(""), *histogram.get(&1).expect("")]
            };
    }

    // Full house
    if histogram.contains_key(&3) && histogram.contains_key(&2) {
        return CardRanking {
            player: player,
            hand: FULL_HOUSE, 
            tiebreak: vec![*histogram.get(&3).expect(""), *histogram.get(&2).expect("")]
            };
    } 

    match is_flush(&subsets) {
        Some(best_hand) => {
            let mut strength = Vec::new();
            for card in best_hand {
                strength.push(card.rank);   
            }
            return CardRanking {
                player: player,
                hand: FLUSH, 
                tiebreak: strength
            };
        },
        None => (),
    };

    match is_straight(&subsets) {
        Some(best_hand) => return CardRanking {
                player: player,
                hand: STRAIGHT, 
                tiebreak: vec![best_hand[0].rank]
            },
        None => (),
    };

    // Triple (We need to get 2 extra high cards)
    if histogram.contains_key(&3) {
        
        // Populate the tiebreak with next 3 best cards
        let mut trip_strength = Vec::new();
        let triple = *histogram.get(&3).expect("");
        trip_strength.push(triple);

        for i in 0..7 {
            
            if working_hand[i].rank != triple {
                trip_strength.push(working_hand[i].rank);
            }   

            // We only need 3 values, the triple and 2 next best cards.
            if trip_strength.len() > 2 {
                break;
            }
        }

        return CardRanking {
                player: player,
                hand: TRIPLE, 
                tiebreak: trip_strength
            };

    } else if histogram.contains_key(&2) && histogram.contains_key(&0) {
        return CardRanking {
                player: player,
                hand: TWO_PAIR, 
                tiebreak: vec![*histogram.get(&2).expect(""), *histogram.get(&0).expect(""), *histogram.get(&1).expect("")]
            };

    // Pair (We need to get 3 extra high cards)
    } else if histogram.contains_key(&2) {
        
        // Populate the tiebreak with next 3 best cards
        let mut pair_strength = Vec::new();
        let pair = *histogram.get(&2).expect("");
        pair_strength.push(pair);

        for i in 0..7 {
            
            if working_hand[i].rank != pair {
                pair_strength.push(working_hand[i].rank);
            }   

            // We only need 4 values, the pair and 3 next best cards.
            if pair_strength.len() > 3 {
                break;
            }
        }

        return CardRanking {
                player: player,
                hand: PAIR, 
                tiebreak: pair_strength
            };
    
    } 

    // Just push the top 5 cards
    let mut hc_strength = Vec::new();
    for i in 0..5 {
        hc_strength.push(working_hand[i].rank);   
    }
    
    return CardRanking {
                player: player,
                hand: HIGH, 
                tiebreak: hc_strength
            };

}

// Find all high cards, pairs, trips and quads. 
// Note that this takes a sorted list of 7 cards, not subsets of 5.
fn to_histogram(cards: &Vec<Card>) -> HashMap<u8, u8> {

    // The returned hashmap contains: at index [1,2,3,4], the highest rank seen
    // I'll reserve the index 0 for the second of a 2 pair.

    // What rank are we looking for?
    let mut current_rank = cards[0].rank;

    // How many instances of the pair have we seen?
    let mut instances : u8 = 1;
    let mut output = HashMap::new();
    let mut bookkeep = false;

    for i in 1..7 {
        
        if cards[i-1].rank == cards[i].rank {
            instances += 1;
            if i == 6 {
                bookkeep = true;
            }
        } else {
            bookkeep = true;
        }
            
        if bookkeep {
        
            bookkeep = false;
        
            match instances {
                1 => {
                    // Other case that matters: keep the highest single for 4+1 or 2+2+1.
                    if !output.contains_key(&1) {
                        output.insert(1, current_rank);
                    }
                }
                2 => {
                    // Already saw a better pair. Consider for 2 pair.
                    if output.contains_key(&2) {
                        if output.contains_key(&0) {
                            // Also consider as the kicker
                            if !output.contains_key(&1) {
                                output.insert(1, current_rank);
                            }
                        } else {
                            output.insert(0, current_rank);
                        }
                    } else {
                        output.insert(2, current_rank);
                    }
                },
                3 => {
                    // We already saw a triple. This triple should be used as the pair.
                    if output.contains_key(&3) {
                        // But if better pair existed (3,2,3), skip it
                        if !output.contains_key(&2) {
                            output.insert(2, current_rank);
                        }
                    } else {
                        output.insert(3, current_rank);
                    }
                },
                4 => {
                    // No possible clash for a quad.
                    output.insert(4, current_rank);
                },
                _ => return HashMap::new(), // TODO error.
            } 
            
            current_rank = cards[i].rank;
            instances = 1;
            
        } 
    }
    
    output
}

// Evaluate if a straight exists within set of of subsets
fn is_straight(subsets: &Vec<Vec<Card>>) -> Option<Vec<Card>> {
    
    for hand in subsets {
   
        let mut has_straight = true;        
        for i in 1..5 {
            if hand[i-1].rank != hand[i].rank + 1 {
                has_straight = false;
                break;
            }
        }   
        if has_straight {
            return Some(hand.to_vec());
        }
    }   
    None
}

// Evaluate if a flush exists within set of of subsets
fn is_flush(subsets: &Vec<Vec<Card>>) -> Option<Vec<Card>> {
    
    for hand in subsets {
        
        let suit = hand[0].suit;
        let mut has_flush = true;
        
        for i in 1..5 {
            if hand[i].suit != suit {
                has_flush = false;
                break;
            }
        }   
        if has_flush {
            return Some(hand.to_vec());
        }
    }
    
    None
}

// Wasteful, but evaluate if a straight flush exists within set of of subsets
fn is_straight_flush(subsets: &Vec<Vec<Card>>) -> Option<Vec<Card>> {
    
    for hand in subsets {
   
        let suit = hand[0].suit;
        let mut has_straight_flush = true;        
        for i in 1..5 {
            if hand[i].suit != suit || hand[i-1].rank != hand[i].rank + 1 {
                has_straight_flush = false;
                break;
            }
        }   
        if has_straight_flush {
            return Some(hand.to_vec());
        }
    }   
    
    None
}

fn to_ranked_subsets(hand_of_seven: &Vec<Card>) -> Vec<Vec<Card>> {
    
    let mut ranked_subsets = Vec::new();
    let mut working_cards = hand_of_seven.clone();
    working_cards.sort_by(|a, b| b.rank.cmp(&a.rank));

    // Ugly method for getting all 5 card subsets out of 7                
    for i in 0..7 {
        for j in (i+1)..7 {
                
            let mut working_hand = Vec::new();
                
            for k in 0..7 {
                if i != k && j != k {
                    working_hand.push(working_cards[k].clone());
                }
            }
            ranked_subsets.push(working_hand.clone());
        }
    }
    ranked_subsets
}