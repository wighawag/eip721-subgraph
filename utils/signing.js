const ethers = require('ethers');
const {solidityKeccak256, arrayify} = ethers.utils;
const ethSigUtil = require('eth-sig-util');

module.exports = {
  async signMessage(wallet, types, namesOrValues, message) {
    let values = [];
    if (message) {
        for(const name of namesOrValues) {
            values.push(message[name]);
        }
    } else {
        values = namesOrValues;
    }
    const hashedData = solidityKeccak256(types, values);
    const signature = await wallet.signMessage(arrayify(hashedData));
    return signature;
  },
  createEIP712Signer({types, domain, primaryType}) {
    return {
      sign :(wallet, message) => {
        return ethSigUtil.signTypedData(Buffer.from(wallet.privateKey.slice(2), 'hex'), {
          data: {
            types,
            domain,
            primaryType,
            message
          }
        });
      },
      hash : (message) => '0x' + ethSigUtil.TypedDataUtils.sign({types, domain, primaryType, message}).toString('hex')//ethSigUtil.typedSignatureHash({types, domain, primaryType, message})
    }
  },
  abiEncode(types, values) {
    return ethers.utils.defaultAbiCoder.encode(types, values);
  },
  abiDecode(types, data) {
    return ethers.utils.defaultAbiCoder.decode(types, data);
  },
};
