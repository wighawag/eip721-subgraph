const {instantiateContract} = require('../utils/index');

module.exports = async function({namedAccounts, deployments}) {
    const {
        others,
    } = namedAccounts;

    async function mint(contract) {
        await contract
            .connect(contract.provider.getSigner(others[0]))
            .functions.mint(others[0])
            .then(tx => tx.wait());

        await contract
            .connect(contract.provider.getSigner(others[1]))
            .functions.mint(others[0])
            .then(tx => tx.wait());
    }

    const contractNames = ['EIP721Example', 'EIP721ExampleWithMetadata', 'FakeEIP721Example', 'FakeEIP721ExampleWithMetadata', 'FailedEIP721Example', 'FailedEIP721ExampleWithMetadata'];
    for (const contractName of contractNames) {
        const info = deployments.get(contractName);
        const contract = instantiateContract(info);
        await mint(contract);
        console.log('minting done : ' + contractName);
    }
    
    
}

