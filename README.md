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

### Specifying credentials
If you want to deploy on Oasis, make sure your mnemonic is defined in `secrets.json`. This file is not tracked by your repo, but it's imported by Truffle during migration and frontend compilation. The default Contract Kit mnemonic is already there, ready to use.

## Building + Migrating

Please refer to our most up to date documentation in the [Oasis Game Box](https://github.com/oasislabs/game-box#building--migrating) repository. 
