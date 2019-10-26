
module.exports = async function({namedAccounts, deploy}) {
    const {
        deployer,
    } = namedAccounts;

    await deploy('GravatarRegistry', {from: deployer, gas: 3000000}, 'GravatarRegistry');
}
