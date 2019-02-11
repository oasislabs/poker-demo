const Web3 = require('web3')
const HDWalletProvider = require("truffle-hdwallet-provider");

const secrets = require('./secrets.json')

const config = {
  oasis: {
    mnemonic: secrets.mnemonics.oasis,
    endpoint: 'https://web3.oasiscloud.io',
    wsEndpoint: 'wss://web3.oasiscloud.io/ws'
  },
  development: {
    mnemonic: secrets.mnemonics.development,
    endpoint: 'http://localhost:8545',
    wsEndpoint: 'ws://localhost:8546'
  }
}

module.exports = {
  config,
  networks: {
    // Oasis Devnet
    oasis: {
      provider: function () {
        return new HDWalletProvider(config.oasis.mnemonic, config.oasis.endpoint, 0, 10);
      },
      gas: 16000000,
      network_id: "42261"
    },

    // Contract Kit local chain
    development: {
      provider: function () {
        return new HDWalletProvider(config.development.mnemonic, config.development.endpoint, 0, 10);
      },
      gas: 16000000,
      gasPrice: 20,
      network_id: "*"
    },
  },
  compilers: {
    external: {
      command: "./node_modules/.bin/oasis-compile",
      targets: [{
        path: "./.oasis-build/*.json"
      }]
    }
  },
  bail: true
};
