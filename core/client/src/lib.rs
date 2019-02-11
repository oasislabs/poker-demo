extern crate console_error_panic_hook;
extern crate wasm_bindgen;

extern crate game_engine;
extern crate client_proxy;
extern crate core;

use std::panic;

use wasm_bindgen::prelude::*;
use client_proxy::{create_proxy, Proxy};
use game_engine::StoreFactory;
use core::Game;

#[wasm_bindgen]
pub fn create (player_id: u16, players: Vec<u16>, multiplayer: bool, server: bool, seed: u32) -> Proxy {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let game = Game {};
    let store = game.create(player_id, players, multiplayer, server, true, Some(seed as u128));
    create_proxy(store)
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
