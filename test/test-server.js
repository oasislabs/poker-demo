const Web3 = require('web3')
const Web3c = require('web3c')
const minimist = require('minimist')
const sodium = require('sodium-universal')
const { GameServer, Game } = require('oasis-game-client')

const GameServerContract = artifacts.require('GameServerContract')
const web3c = new Web3(GameServerContract.web3.currentProvider)

const truffleConfig = require('../truffle-config.js')
let args = minimist(process.argv.slice(2), {
  boolean: ['confidential']
})
let networkConfig = truffleConfig.config[args.network || 'development']
let eventsWeb3c = new Web3(new Web3.providers.WebsocketProvider(networkConfig.wsEndpoint))
let confidential = (args.confidential !== undefined) ? args.confidential : true

let s = GameServerContract.web3.currentProvider.send.bind(GameServerContract.web3.currentProvider)
let sa = GameServerContract.web3.currentProvider.sendAsync.bind(GameServerContract.web3.currentProvider)
GameServerContract.web3.currentProvider.send = function () {
	console.log('SEND ARGUMENTS:', arguments)
	return s(...arguments)
}

GameServerContract.web3.currentProvider.sendAsync = function () {
	console.log('SEND_ASYNC ARGUMENTS:', arguments)
	return sa(...arguments)
}

console.log('CONFIDENTIAL:', confidential)

async function delay (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

contract('GameServerContract', async (accounts) => {

  it('should create a new game', async () => {
    let server = new GameServer(GameServerContract.address, {
      privateKey: '0xb5144c6bda090723de712e52b92b4c758d78348ddce9aa80ca8ef51125bfb308',
      web3c,
      eventsWeb3c,
      confidential
    })

    let token1 = Buffer.allocUnsafe(20)
    let token2 = Buffer.allocUnsafe(20)
    sodium.randombytes_buf(token1)
    sodium.randombytes_buf(token2)

    let game = await server.createGame([
      {
        token: token1,
        is_bot: false
      },
      {
        token: token2,
        is_bot: false
      }
    ])

    assert.equal(game.id, 1)

    let players = await game.getRegisteredPlayers()
    console.log('players:', players)
    assert.deepEqual(players, {})
  })

  it('should not start a game if both players aren\'t ready', async () => {
    let server = new GameServer(GameServerContract.address, {
      privateKey: '0xb5144c6bda090723de712e52b92b4c758d78348ddce9aa80ca8ef51125bfb308',
      web3c,
      eventsWeb3c,
      confidential
    })

    let token1 = Buffer.allocUnsafe(20)
    let token2 = Buffer.allocUnsafe(20)
    sodium.randombytes_buf(token1)
    sodium.randombytes_buf(token2)

    let game = await server.createGame([
      {
        token: token1,
        is_bot: false
      },
      {
        token: token2,
        is_bot: false
      }
    ])

    // Making a move should result in a transaction failure.
    try {
      await game.sendAction({
        MakeMove: {
          move_type: 'poker_move',
          player_id: 1,
          args: [2]
        }
      })
    } catch (err) {
      assert.ok(err)
    }
  })

  it.only('should let both players become ready, then should accept moves', async () => {
    let server1 = new GameServer(GameServerContract.address, {
      privateKey: '0xb5144c6bda090723de712e52b92b4c758d78348ddce9aa80ca8ef51125bfb308',
      web3c,
      eventsWeb3c,
      confidential
    })
    let server2 = new GameServer(GameServerContract.address, {
      privateKey: '0x069f89ed3070c73586672b4d64f08dcc0f91d65dbdd201b27d5949a437035e4a',
      web3c,
      eventsWeb3c,
      confidential
    })
    await Promise.all([server1.ready(), server2.ready()])


    let token1 = Buffer.allocUnsafe(20)
    let token2 = Buffer.allocUnsafe(20)
    sodium.randombytes_buf(token1)
    sodium.randombytes_buf(token2)

    let game1 = await server1.createGame([
      {
        token: token1,
        is_bot: false
      },
      {
        token: token2,
        is_bot: false
      }
    ])
    let game2 = new Game(server2, game1.id)

    await game1.ready()
    await game2.ready()

    let initialPlayers = await game1.getRegisteredPlayers()
    console.log('initialPlayers:', initialPlayers)
    assert.deepEqual(initialPlayers, {})

    await game1.sendReady(token1)
    let players1 = await game1.getRegisteredPlayers()
    console.log('players1:', players1)
    assert(players1[game1.address])

    await delay(5000)

    await game2.sendReady(token2)
    let players2 = await game1.getRegisteredPlayers()
    console.log('players2:', players2)
    assert(players2[game1.address])
    assert(players2[game2.address])

    // Making a move should succeeed.
    await game1.sendAction({
      MakeMove: {
        move_type: 'poker_move',
        player_id: 1,
        args: [2]
      }
    })
  })

  it.skip('should complete a game', async () => {
    let server1 = new GameServer(GameServerContract.address, {
      web3c,
      eventsWeb3c,
      account: 0,
      confidential
    })
    let server2 = new GameServer(GameServerContract.address, {
      web3c,
      eventsWeb3c,
      account: 1,
      confidential
    })

    let game1 = await server1.createGame([
      {
        address: accounts[0],
        is_bot: false
      },
      {
        address: accounts[1],
        is_bot: false
      }
    ])
    await game1.ready()

    let game2 = new Game(server2, game1.id)

    await game1.sendReady()
    await game2.sendReady()

    // Alternate moves until victory.
    await game1.sendAction({
      MakeMove: {
        move_type: 'click_cell',
        player_id: 1,
        args: [0]
      }
    })

    await game2.sendAction({
      MakeMove: {
        move_type: 'click_cell',
        player_id: 2,
        args: [1]
      }
    })

    await game1.sendAction({
      MakeMove: {
        move_type: 'click_cell',
        player_id: 1,
        args: [4]
      }
    })

    await game2.sendAction({
      MakeMove: {
        move_type: 'click_cell',
        player_id: 2,
        args: [3]
      }
    })

    await game1.sendAction({
      MakeMove: {
        move_type: 'click_cell',
        player_id: 1,
        args: [8]
      }
    })

    await delay(200)

    let state1 = game1.getLastState()
    let state2 = game2.getLastState()

    assert.ok(state1.ctx.gameover)
    assert.ok(state2.ctx.gameover)
  })
})
