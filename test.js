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
    // const GravatarRegistry = getDeployedContract('GravatarRegistry');
    // const registry = new Contract(GravatarRegistry.address, GravatarRegistry.abi, ethersProvider);
    const abi = JSON.parse(fs.readFileSync('./abis/Gravity.json').toString());
    const contractsInfo = JSON.parse(fs.readFileSync('./test_deployments.json').toString());
    const address = contractsInfo['1337']['GravatarRegistry'].address;
    const registry = new Contract(address, abi, ethersProvider);

    const result = await registry
        .callStatic.getGravatar(others[0]);
    console.log({result});
})()
