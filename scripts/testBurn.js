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
    const contractsInfo = JSON.parse(fs.readFileSync('./test_deployments.json').toString());
    const address = contractsInfo['1337']['EIP721Example'].address;
    const tokenContract = new Contract(address, abi, ethersProvider.getSigner(others[0]));

    const result = await tokenContract.functions.burn(1).then(tx => tx.wait());
    console.log({result});
})()
