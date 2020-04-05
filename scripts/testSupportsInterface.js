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
    const abi = JSON.parse(fs.readFileSync('./abis/EIP721.json').toString());
    const addressToTest = '0x55b9a11c2e8351b4Ffc7b11561148bfaC9977855';
    const tokenContract = new Contract(addressToTest, abi, ethersProvider);
    const result = await tokenContract.populateTransaction.supportsInterface('0x01ffc9a7');
    console.log({result});
})()

