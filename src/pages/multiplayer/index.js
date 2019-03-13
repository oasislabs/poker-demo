/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.  */

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
import Board from '../../components/Board/Board'
import Footer from '../../components/Footer/Footer';

import GameLogo from '../../assets/2x/logo_poker_hd.png'
import BrandLogo from '../../assets/OasisLabs_Vertical_Logo_Red_RGB.png'

import '../../assets/index.css'

// Transfer all funds from the current wallet to the new one.
async function transferFunds (existingGame, newPrivateKey, web3c) {
  let { address: existingAddress } = existingGame.getAccount()
  let newAccount = web3c.eth.accounts.privateKeyToAccount(newPrivateKey)

  let balance = await web3c.eth.getBalance(newAccount.address)
  
  let gas = 3000
  let gasPrice = 1000000000
  let value = balance - (gas * gasPrice)

  if (value <= 0) return

  let { rawTransaction } =  await newAccount.signTransaction({
    from: newAccount.address,
    to: existingAddress,
    value,
    gas,
    gasPrice
  })
  return web3c.eth.sendSignedTransaction(rawTransaction)
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
    let params = new URLSearchParams(document.location.search.substring(1)) 
    let gameId = params.get('gameId')
    let rawToken = params.get('token')

    if (rawToken) {
      var tokenInfo = codecs('json').decode(Buffer.from(rawToken, 'base64'))
      var newPrivateKey = tokenInfo.privateKey
      var token = Buffer.from(tokenInfo.token, 'base64')
    }

    let Web3c = require('web3c')
    await Web3c.Promise

    let web3c = new Web3c(WS_ENDPOINT)

    let game = await this.createGame(gameId, web3c, web3c, newPrivateKey)
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

    await server.ready()
    if (oldPrivateKey && newPrivateKey && oldPrivateKey !== newPrivateKey) {
      await transferFunds(server, newPrivateKey, web3c)
    }
    await server.persistKey()

    let account = server.getAccount()
    await web3c.eth.getBalance(account.address)

    return new Game(server, gameId, 14000000)
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
          <Player />
        </div>
      );
    }

    let wallet = this.state.web3c ? <WalletManagerView web3c={this.state.web3c} metamask={web3} /> : ''

    return (
      <div class="code flex flex-column w-100 h-100 items-center">
        <img className="GameLogo" src={GameLogo} />
        <img className ="BrandLogo" src={BrandLogo} />
        <GameWrapper token={this.state.token} proxy={this.state.proxy} game={this.state.game}>
          <PlayerComponent />
        </GameWrapper>
        <div class="mt3">
          {wallet} 
        </div>
        <Footer />
      </div>
    )
  }
}

render(
  <Multiplayer />,
  document.getElementById('app')
)
