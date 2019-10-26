const ethers = require('ethers');
const { Contract } = ethers;
const { Web3Provider } = ethers.providers;

module.exports = async function({ethereum, namedAccounts, getDeployedContract}) {
    const ethersProvider = new Web3Provider(ethereum);
    const {
        others,
    } = namedAccounts;

    async function mint(contract) {
        await contract
            .connect(ethersProvider.getSigner(others[0]))
            .functions.mint(others[0])
            .then(tx => tx.wait());

        await contract
            .connect(ethersProvider.getSigner(others[1]))
            .functions.mint(others[0])
            .then(tx => tx.wait());
    }

    const EIP721Example = getDeployedContract('EIP721Example');
    const eip721Example = new Contract(EIP721Example.address, EIP721Example.abi, ethersProvider);
    await mint(eip721Example);

    const EIP721ExampleWithMetadata = getDeployedContract('EIP721ExampleWithMetadata');
    const eip721ExampleWithMetadata = new Contract(EIP721ExampleWithMetadata.address, EIP721ExampleWithMetadata.abi, ethersProvider);
    await mint(eip721ExampleWithMetadata);
}

