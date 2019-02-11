const Web3 = require('web3')
const Web3c = require('web3c')
const minimist = require('minimist')
const { GameServer, Game } = require('oasis-game-client')

const GameServerContract = artifacts.require('GameServerContract')
const web3c = new Web3c(GameServerContract.web3.currentProvider)

const truffleConfig = require('../truffle-config.js')
let args = minimist(process.argv.slice(2), {
  boolean: ['confidential']
})
let networkConfig = truffleConfig.config[args.network || 'development']
let eventsWeb3c = new Web3c(new Web3.providers.WebsocketProvider(networkConfig.wsEndpoint))
let confidential = (args.confidential !== undefined) ? args.confidential : true


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
      web3c,
      eventsWeb3c,
      account: 0,
      confidential
    })
    let game = await server.createGame([
      {
        address: accounts[0],
        is_bot: false
      },
      {
        address: accounts[1],
        is_bot: false
      }
    ])

    assert.equal(game.id, 1)

    let players = await game.getRegisteredPlayers()

    assert.deepEqual(players[accounts[0].toLowerCase()].map(p => p.id), [1])
    assert.deepEqual(players[accounts[1].toLowerCase()].map(p => p.id), [2])
  })

  it('should not start a game if both players aren\'t ready', async () => {
    let server = new GameServer(GameServerContract.address, {
      web3c,
      eventsWeb3c,
      account: 0,
      confidential
    })
    let game = await server.createGame([
      {
        address: accounts[0],
        is_bot: false
      },
      {
        address: accounts[1],
        is_bot: false
      }
    ])

    assert.equal(game.id, 2)

    // Making a move should result in a transaction failure.
    try {
      await game.sendAction({
        MakeMove: {
          move_type: 'click_slot',
          player_id: 1,
          args: [0]
        }
      })
    } catch (err) {
      assert.ok(err)
    }
  })

  it('should complete a game', async () => {
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
