const { ethereum } = require('@nomiclabs/buidler');
const ethers = require('ethers');
const {Wallet, Contract} = ethers;
const {Web3Provider} = ethers.providers;

function EthersProviderWrapper(web3Provider, network) {
  Web3Provider.call(this, web3Provider, network);
  this._sendAsync = async (request, callback) => {
    let result;
    try {
    result = await web3Provider.send(request.method, request.params);
    callback(null, {result});
    } catch (e) {
    callback(e, null);
    }
  };
}
EthersProviderWrapper.prototype = Object.create(Web3Provider.prototype);
  
const ethersProvider = new EthersProviderWrapper(ethereum);

module.exports = {
    createWallet() {
        return Wallet.createRandom().connect(ethersProvider);
    },
    instantiateContract(contractInfo) {
        return new Contract(contractInfo.address, contractInfo.abi, ethersProvider);
    }
};
