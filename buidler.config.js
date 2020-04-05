const fs = require('fs');
usePlugin("buidler-deploy");

module.exports = {
  namedAccounts: {
    deployer: 0,
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
};
