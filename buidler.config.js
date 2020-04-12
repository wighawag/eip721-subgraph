const fs = require('fs');
usePlugin("buidler-deploy");
usePlugin("buidler-ethers-v5");

module.exports = {
  namedAccounts: {
    deployer: 0,
    tester: 1,
    others: "from:2"
  },
  solc: {
      version: '0.5.12',
      optimizer: {
          enabled: false,
          // runs: 200
      }
  },
  paths: {
    sources: 'contracts'
  },
  networks: {
    localhost: {
      live: true
    }
  }
};
