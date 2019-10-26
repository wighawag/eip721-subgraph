
module.exports = async function({namedAccounts, deploy}) {
    const {
        deployer,
    } = namedAccounts;

    await deploy('EIP721Example', {from: deployer, gas: 3000000}, 'EIP721Example');
    await deploy('EIP721ExampleWithMetadata', {from: deployer, gas: 3000000}, 'EIP721ExampleWithMetadata');
    await deploy('FakeEIP721Example', {from: deployer, gas: 3000000}, 'FakeEIP721Example');
    await deploy('FakeEIP721ExampleWithMetadata', {from: deployer, gas: 3000000}, 'FakeEIP721ExampleWithMetadata');
    await deploy('FailedEIP721Example', {from: deployer, gas: 3000000}, 'FailedEIP721Example');
    await deploy('FailedEIP721ExampleWithMetadata', {from: deployer, gas: 3000000}, 'FailedEIP721ExampleWithMetadata');
}
