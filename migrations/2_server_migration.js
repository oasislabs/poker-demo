const Server = artifacts.require('GameServerContract');

module.exports = async function(deployer) {
  return deployer.deploy(Server)
}
