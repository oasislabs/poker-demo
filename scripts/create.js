const Web3 = require('web3')
const Web3c = require('web3c')
const chalk = require('chalk')
const ora = require('ora')
const minimist = require('minimist')
const { Game, GameServer } = require('oasis-game-client')

const truffleConfig = require('../truffle-config.js')

let args = minimist(process.argv.slice(2), {
  string: ['bots', 'players'],
  boolean: ['confidential'],
  default: {
    confidential: true
  }
})

module.exports = async function (cb) {
  let network = args.network || 'development'
  let networkConfig = truffleConfig.config[network]
  const provider = truffleConfig.networks[network].provider()
  let web3c = new Web3c(provider)
  let eventsWeb3c = new Web3c(new Web3.providers.WebsocketProvider(networkConfig.wsEndpoint))

  let serverAddress = args.server || artifacts.require('GameServerContract').address
  let players = args.players ? args.players.split(',') : []
  let bots = args.bots ? args.bots.split(',') : []

  let playerArgs = [...players.map(address => {
    return {
      address,
      is_bot: false
    }
  }), ...bots.map(address => {
    return {
      address,
      is_bot: true
    }
  })]

  let spinner = ora({
    text: chalk.blue(`Creating a new game with game contract ${serverAddress}`),
    color: 'blue'
  }).start()

  let server = new GameServer(serverAddress, {
    web3c,
    eventsWeb3c,
    account: 0,
    confidential: args.confidential
  })

  try {
    let game = await server.createGame(playerArgs)
    await game.ready()
    spinner.succeed(chalk.green(`Created a new game with ID: ${game.id}`))
  } catch (err) {
    spinner.fail(chalk.red(`Could not create a new game: ${err}`))
  }
  
  cb()
}
