const fs = require('fs');
const ethers = require('ethers');
const { Contract } = ethers;
const { Web3Provider } = ethers.providers;
const rocketh = require('rocketh');
const ethersProvider = new Web3Provider(rocketh.ethereum);
const { getDeployedContract, namedAccounts } = rocketh;
const {
    others,
} = namedAccounts;

(async () => {
    // TODO   
})()
