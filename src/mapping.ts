import { store, Address, Bytes, EthereumValue } from '@graphprotocol/graph-ts';
import { Transfer, EIP721 } from '../generated/EIP721/EIP721';
import { EIP721Token, Contract } from '../generated/schema';

import { log } from '@graphprotocol/graph-ts';

let zeroAddress = '0x0000000000000000000000000000000000000000';

function toBytes(hexString: String): Bytes {
    let result = new Uint8Array(hexString.length/2);
    for (let i = 0; i < hexString.length; i += 2) {
        result[i/2] = parseInt(hexString.substr(i, 2), 16) as u32;
    }
    return result as Bytes;
}

function supportsInterface(contract: EIP721, interfaceId: String, expected : boolean = true) : boolean {
    let supports = contract.try_supportsInterface(toBytes(interfaceId));
    return !supports.reverted && supports.value == expected;
}

// function supportsInterface(contract: EIP721, interfaceId: String, expected : boolean = true) : boolean {
//     let result = contract.tryCall('supportsInterface', [EthereumValue.fromFixedBytes(toBytes(interfaceId))]);
//     if (result.reverted) {
//         return false;
//     }
//     let value = result.value;
//     if(value.length == 0) {
//         return !expected;
//     }
//     let firstValue = value[0];
//     // TODO check length
//     // TODO : 
//     let byteValue = changetype<Bytes>(value[0].data as u32);
//     if(byteValue.length == 0) {
//         return !expected;
//     }
//     // if(byteValue.toHexString() == '0x' || byteValue.toHexString() == '0x0') {
//     //     return !expected;
//     // }
    
//     return firstValue.toBoolean() == expected;
    
//     // if(byteValue.toHex() != '0x1') {
//     //     // log.debug('truthful != 0x1 : {}',[byteValue.toHexString()]);
//     // }

//     // return expected;
// }

export function handleTransfer(event: Transfer): void {
    let contract = EIP721.bind(event.address);
    let contractInfo = Contract.load(event.address.toHex());
    if(contractInfo == null) {
        log.info('contract : {}',[event.address.toHexString()]);
        let supportsEIP165Identifier = supportsInterface(contract, '01ffc9a7');
        // log.debug('eip165 : {}', [supportsEIP165Identifier ? 'true' : 'false']);
        let supportsEIP721Identifier = supportsInterface(contract, '80ac58cd');
        // log.debug('eip721 : {}', [supportsEIP721Identifier ? 'true' : 'false']);
        let supportsCryptoKittiesIdentifier = supportsInterface(contract, '9a20483d');
        // log.debug('cryptoKitties : {}', [supportsCryptoKittiesIdentifier ? 'true' : 'false']);
        let supportsNullIdentifierFalse = supportsInterface(contract, '00000000', false);
        // log.debug('eip165Null : {}', [supportsNullIdentifierFalse ? 'true' : 'false']);
        let supportsEIP721 = supportsEIP165Identifier &&
            (supportsCryptoKittiesIdentifier || supportsEIP721Identifier) &&
            supportsNullIdentifierFalse;

        let supportsEIP721Metadata = false;
        if(supportsEIP721) {
            supportsEIP721Metadata = supportsInterface(contract, '5b5e139f');
            // log.debug('eip721Metadata : {}', [supportsEIP721Metadata ? 'true' : 'false']);
        }
        if (supportsEIP721) {
            contractInfo = new Contract(event.address.toHex());
            contractInfo.supportsCryptoKittyStandard = supportsCryptoKittiesIdentifier;
            contractInfo.supportsEIP721Metadata = supportsEIP721Metadata;
            contractInfo.address = event.address;
        } else {
            return;
        }
    }

    let tokenId = event.params.id;
    let id = event.address.toHex() + '_' + tokenId.toHex();
    let eip721Token = EIP721Token.load(id);
    if(eip721Token == null) {
        eip721Token = new EIP721Token(id);
        eip721Token.contract = contractInfo.id;
        eip721Token.tokenID = tokenId;
        eip721Token.mintTime = event.block.timestamp;
        if (contractInfo.supportsEIP721Metadata) {
            let metadataURI = contract.try_tokenURI(tokenId);
            if(!metadataURI.reverted) {
                eip721Token.tokenURI = metadataURI.value; // only set it at creation
            }
        } else if (contractInfo.supportsCryptoKittyStandard) {
            let metadataURI = contract.try_tokenMetadata(tokenId, "");
            if(!metadataURI.reverted) {
                eip721Token.tokenURI = metadataURI.value; // only set it at creation
            }
        }
    } else if(event.params.to.toHex() == zeroAddress) {
        store.remove('EIP721Token', id);
    }
    if(event.params.to.toHex() != zeroAddress) { // ignore transfer to zero
        eip721Token.owner = event.params.to;
        eip721Token.save();
        contractInfo.tokens.push(eip721Token.id);
        contractInfo.save();
    }
}
