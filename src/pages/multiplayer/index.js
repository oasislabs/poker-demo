/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import Async from 'react-promise'
import React from 'react'
import { render } from 'react-dom'

// Client-side WASM imports.
import bindingsPromise from '../../../core/client'
import createProxyBuilder from 'oasis-game-client-proxy'

// Multiplayer game imports.
import { GameWrapper, Client, WalletManagerView } from 'oasis-game-components'
import { Game, GameServer } from 'oasis-game-client'
import Web3 from 'web3'
import codecs from 'codecs'

// Game component imports.
import Board from '../../components/board'
import Logo from '../../assets/logo.svg'

// Transfer all funds from the current wallet to the new one.
async function transferFunds (existingGame, newGame, web3c) {
  let { address: existingAddress } = existingGame.getAccount()
  let { address: newAddress } = newGame.getAccount()

  return new Promise((resolve, reject) => {
    web3c.eth.getBalance(existingAddress, (err, balance) => {
      if (err) return reject(err)
      web3c.eth.sendTransaction({
        from: newAddress,
        to: existingAddress,
        value: balance
      }, err => {
        if (err) return reject(err)
        return resolve()
      })
    })
  })
}

class Multiplayer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      web3c: null,
      game: null,
      proxy: null,
      token: null
    }
  }

  async componentDidMount () {
    let splitUrl = window.location.pathname.split('/')
    let gameId = +splitUrl[2]

    if (splitUrl[3]) {
      var tokenInfo = codecs('json').decode(Buffer.from(splitUrl[3], 'hex'))
      var newPrivateKey = tokenInfo.privateKey
      var token = tokenInfo.token
    }

    let Web3c = require('web3c')
    await Web3c.Promise

    let web3 = new Web3(ethereum)
    await ethereum.enable()
    let web3c = new Web3c(ethereum)

    // TODO: Extract this into a separate JS wallet manager.
    // The all-caps fields are injected by Webpack during the build.
    let eventsWeb3c = new Web3(new Web3.providers.WebsocketProvider(WS_ENDPOINT))

    let game = await this.createGame(gameId, web3c, eventsWeb3c, newPrivateKey)
    game = await game.ready()
    let proxy = await this.createProxy(game)
    this.setState({
      game,
      proxy,
      web3c,
      token,
    })
  }

  async createGame (gameId, web3c, eventsWeb3c, newPrivateKey) {
    let oldPrivateKey = GameServer.loadKey()
    let server = new GameServer(CONTRACT_ADDRESS, {
      privateKey: oldPrivateKey,
      web3c,
      eventsWeb3c,
      confidential: CONFIDENTIAL_CONTRACT
    })

    if (newPrivateKey) {
      let oldServer = server
      server = GameServer(CONTRACT_ADDRESS, {
        privateKey: newPrivateKey,
        web3c,
        eventsWeb3c,
        confidential: CONFIDENTIAL_CONTRACT
      })
      if (oldPrivateKey && newPrivateKey) {
        await transferFunds(oldServer, server, web3c)
      }
    }
    server.persistKey()

    return new Game(server, gameId)
  }

  async createProxy (game) {
    let bindings = await bindingsPromise
    let builder = createProxyBuilder(bindings)
    let seed = Math.floor(Math.random() * 100000);
    return builder([1, 2], game, game.playerId, seed).ready();
  }

  render () {
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
          <h1 className="f1 lh-title mb1">Poker</h1>
          <div class="flex justify-center">
            <h4 className="pt0 mt3 mr2">with</h4>
            <img className="h2" src={Logo} />
          </div>
          <Player />
        </div>
      );
    }

    let wallet = this.state.web3c ? <WalletManagerView web3c={this.state.web3c} metamask={web3} /> : ''

    return (
      <div class="code flex flex-column w-100 h-100 items-center">
        <GameWrapper token={this.state.token} proxy={this.state.proxy} game={this.state.game}>
          <PlayerComponent />
        </GameWrapper>
        {wallet} 
        <h5 class="mt5">Want to build your own game? Go to the <a href="http://docs.oasiscloud.io/en/latest/gaming-sdk">Oasis Devnet</a> to get started.</h5>
      </div>
    )
  }
}

render(
  <Multiplayer />,
  document.getElementById('app')
)
