# Poker: An Oasis Game with Randomness and Non-Round Robin Turn Order
This example game was made using the [Oasis game box](https://github.com/oasislabs/game-box). This is the most complex of the sample games, and if you're unfamiliar with the framework, it's best to first take a look at the following, simpler examples:
* [Tic Tac Toe](https://github.com/oasislabs/game-box): This Truffle box gives a more detailed overview of the game project, and describes how to get started with your own game.
* [Connect Four](https://github.com/oasislabs/connect-four-demo): This repository provides an example of how the game framework's Truffle box can be extended into a (slightly) more sophisticated game.
* [Battleship](https://github.com/oasislabs/battleship-demo): This game shows an example of how secret state and initial randomness can be incorporated into your game.

Once you're familiar with the basics, this project combines everything from all the other games demonstrates how to create an Oasis game that takes advantage of confidential contract state. Poker requires that the deck be kept secret from both the players, while players' hands are confidential only to other players. In addition, the game supports multiple move options, non-round robin turns, and makes full use of the randomness API in the Oasis game framework. Are you ready to get started?

For this variant of Poker, we will be using the rules of [Texas Hold'em](https://en.wikipedia.org/wiki/Texas_hold_%27em).

## Installation
This game is designed to be used from within your Contract Kit container. If you haven't already, pull the `oasislabs/contract-kit` image from Docker Hub.

1. Launch your Contract Kit container: 
   * `docker run -v "$PWD":/project -p8545:8545 -p8546:8546 -p8080:8080 -it oasislabs/contract-kit:latest /bin/bash`
   
The remaining steps are meant to be run in a shell inside your new `oasislabs/contract-kit` container.
1. Install `wasm-bindgen`: `cargo install wasm-bindgen-cli --vers=0.2.37` (this can take some time).
2. Clone this repository: `git clone https://github.com/oasislabs/poker-demo`
3. NPM installation: `cd poker-demo && npm i`
3. (optionally) In a separate window, start a local Parity instance for debugging: `cd poker-demo && ./scripts/start-parity.sh`
   * (Note: This will launch Parity with very loose network settings -- feel free to restrict those to localhost if you don't want to test with other machines on your local network)

### Specifying credentials
If you want to deploy on Oasis, make sure your mnemonic is defined in `secrets.json`. This file is not tracked by your repo, but it's imported by Truffle during migration and frontend compilation. The default Contract Kit mnemonic is already there, ready to use.

## Building + Migrating
Building is separated into three stages, each with a corresponding build script. From the repo root:
1. Build Rust dependencies: `./scripts/build-crates.sh`
2. Migrate contracts onto a testnet: `truffle migrate --network (your network)`
3. Build frontend components: `truffle exec ./scripts/build-frontend.js --network (your network)`

If deploying on a local Parity instance, the network name will be `development`. It's important that (3) always be performed after (2), and with `truffle exec`, because it depends on the address of your deployed contract, which Truffle automatically determines.

Once everything is built and migrated, you're ready to play!

## Playing
This box currently contains the following game modes:
1. Singleplayer: Two boards are rendered on the same screen, and a single user makes moves for
   both. This is useful for debugging your core game logic.
2. Two Player (On-Chain): Production time! This game mode allows for multiple players, or bots,
   to compete using a game contract running on Oasis.

### Singleplayer
To debug your game in singleplayer mode, first complete the installation steps above, then perform
the following steps:
1. `npm start` (you can do this in another shell)
2. Navigate to `localhost:8080/singleplayer` in your browser (or whichever port you've chosen to use)

This mode launches a local game server on port 8080 (note: this is an HTTP server, not an Ekiden 
gateway -- there is no blockchain involved in this game mode).

### Multiplayer
To play a complete end-to-end, on-chain game with friends, there are a few more steps:
1. Create a new game on the testnet: `truffle exec ./scripts/create.js --network (your network) --players (address1),(address2)... --seed (a seed number)`
   * (The addresses you list will be assigned player IDs in order, so `address1` becomes Player 1, and so on. Make sure these addresses have already been funded!)
 2. `npm start` (you can do this in another shell)
 3.  Navigate to `localhost:8080/multiplayer/(game id)`
 
If your players are using different computers, make sure that *both* the web server *and* the testnet are accessible to all parties -- this might require updating the networking configuration in the `config` section of `truffle-config.js`.

If you're using the Oasis testnet, you will not need to update any networking configuration.

