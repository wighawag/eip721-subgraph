const {instantiateContract} = require('../utils/index');

module.exports = async function({getNamedAccounts, deployments}) {
    const {
        others,
    } = await getNamedAccounts();


    const contractNames = ['EIP721Example', 'EIP721ExampleWithMetadata', /*'EIP721ExampleWithoutEIP165',*/ 'EIP721ExampleWithWrongUint8Metadata', 'EIP721ExampleWithWrongBytesMetadata'];
    for (const contractName of contractNames) {
        const info = await deployments.get(contractName);
        const contract = instantiateContract(info);
        await contract
            .connect(contract.provider.getSigner(others[0]))
            .functions.mint(others[0])
            .then(tx => tx.wait());
    }


    // for (const contractName of contractNames) {
    //     const info = deployments.get(contractName);
    //     const contract = instantiateContract(info);
    //     await contract
    //         .connect(contract.provider.getSigner(others[0]))
    //         .functions.mintDuplicate(others[0])
    //         .then(tx => tx.wait());
    // }

    // for (const contractName of contractNames) {
    //     const info = deployments.get(contractName);
    //     const contract = instantiateContract(info);
    //     await contract
    //         .connect(contract.provider.getSigner(others[0]))
    //         .functions.burnNonExistant)
    //         .then(tx => tx.wait());
    // }    
    
}

