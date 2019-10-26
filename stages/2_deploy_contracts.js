
module.exports = async function({namedAccounts, deploy}) {
    const {
        deployer,
    } = namedAccounts;

    await deploy('EIP721Example', {from: deployer, gas: 3000000}, 'EIP721Example');
    await deploy('EIP721ExampleWithMetadata', {from: deployer, gas: 3000000}, 'EIP721ExampleWithMetadata');
}
