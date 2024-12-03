const FruitTracking = artifacts.require("FruitTracking");

module.exports = function (deployer) {
  deployer.deploy(FruitTracking);
};
