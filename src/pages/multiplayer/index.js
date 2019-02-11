/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import Async from 'react-promise';
import React from 'react';
import { render } from 'react-dom';

// Client-side WASM imports.
import bindingsPromise from '../../../core/client';
import createProxyBuilder from 'oasis-game-client-proxy';

// Multiplayer game imports.
import { GameWrapper, Client } from 'oasis-game-components';
import { Game, GameServer } from 'oasis-game-client';
import Web3 from 'web3';

// Game component imports.
import Board from '../../components/board';
import Logo from '../../assets/logo.svg';

const Multiplayer = () => {
  // TODO: Better way to get game parameters.
  let splitUrl = window.location.pathname.split('/');
  let gameId = +splitUrl[2];

  // TODO: Extract this into a separate JS wallet manager.
  // The all-caps fields are injected by Webpack during the build.
  let eventsWeb3c = new Web3(new Web3.providers.WebsocketProvider(WS_ENDPOINT));

  let createGame = async function () {
    let Web3c = require('web3c');
    await Web3c.Promise

    let web3 = new Web3(ethereum);
    await ethereum.enable();
    let web3c = new Web3c(ethereum);
    let server = new GameServer(CONTRACT_ADDRESS, {
      web3c,
      eventsWeb3c,
      confidential: CONFIDENTIAL_CONTRACT
    });
    let game = new Game(server, gameId);
    return game.ready();
  }

  let proxyPromise = Promise.all([
    bindingsPromise,
    createGame()
  ]).then(async ([bindings, game]) => {
    let builder = createProxyBuilder(bindings);
    // The client-side seed in multiplayer mode does not matter.
    let seed = Math.floor(Math.random() * 100000);
    let proxy = await builder([1, 2], game, game.playerId, seed).ready();
    return [proxy, game];
  });

  let PlayerComponent = (props) => {
    let proxy = props.proxy
    let game = props.game

    let playerId = game.playerId
    let Player = Client({
      board: Board,
      proxy,
      playerId,
      players: [1, 2],
      multiplayer: game,
      debug: false
    });

    return (
      <div className="code flex flex-column w-100 h-100 items-center bg-light-gray">
        <h1 className="f1 lh-title mb1">Tic Tac Toe</h1>
        <div class="flex justify-center">
          <h4 className="pt0 mt3 mr2">with</h4>
          <img className="h2" src={Logo} />
        </div>
        <Player />
      </div>
    );
  }

  return (
    <div class="code flex flex-column w-100 h-100 items-center">
      <GameWrapper proxyPromise={proxyPromise}>
        <PlayerComponent />
      </GameWrapper>
      <h5 class="mt5">Want to build your own game? Go to the <a href="http://docs.oasiscloud.io/en/latest/gaming-sdk">Oasis Devnet</a> to get started.</h5>
    </div>
  );
}

render(
    <Multiplayer />,
    document.getElementById('app')
);
