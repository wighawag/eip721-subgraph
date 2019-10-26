const ethers = require('ethers');
const { Contract } = ethers;
const { Web3Provider } = ethers.providers;

module.exports = async function({ethereum, namedAccounts, getDeployedContract}) {
    const ethersProvider = new Web3Provider(ethereum);
    const {
        others,
    } = namedAccounts;

    const GravatarRegistry = getDeployedContract('GravatarRegistry');
    const registry = new Contract(GravatarRegistry.address, GravatarRegistry.abi, ethersProvider);

    await registry
        .connect(ethersProvider.getSigner(others[0]))
        .functions.createGravatar('Carl' + Date.now(), 'https://thegraph.com/img/team/team_04.png')
        .then(tx => tx.wait());

    await registry
        .connect(ethersProvider.getSigner(others[1]))
        .functions.createGravatar('Lucas' + Date.now(), 'https://thegraph.com/img/team/bw_Lucas.jpg')
        .then(tx => tx.wait());
}

