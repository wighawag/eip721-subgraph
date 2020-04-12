
module.exports = async function({getNamedAccounts, deployments}) {
    const {deploy} = deployments;
    const {
        deployer,
    } = await getNamedAccounts();

    await deploy('EIP721Example', {from: deployer, gas: 3000000}, 'EIP721Example');
    await deploy('EIP721ExampleWithMetadata', {from: deployer, gas: 3000000}, 'EIP721ExampleWithMetadata');
    // await deploy('EIP721ExampleWithoutEIP165', {from: deployer, gas: 3000000}, 'EIP721ExampleWithoutEIP165');
    await deploy('EIP721ExampleWithWrongUint8Metadata', {from: deployer, gas: 3000000}, 'EIP721ExampleWithWrongUint8Metadata');
    await deploy('EIP721ExampleWithWrongBytesMetadata', {from: deployer, gas: 3000000}, 'EIP721ExampleWithWrongBytesMetadata');
}
