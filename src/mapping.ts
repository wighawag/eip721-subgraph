import { store, Address, Bytes, EthereumValue, BigInt } from '@graphprotocol/graph-ts';
import { Transfer, EIP721 } from '../generated/EIP721/EIP721';
import { Token, TokenContract, Owner, All, OwnerPerTokenContract } from '../generated/schema';

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

export function handleTransfer(event: Transfer): void {
    let tokenId = event.params.id;
    let id = event.address.toHex() + '_' + tokenId.toString();
    let contractId = event.address.toHex();
    let from = event.params.from.toHex();
    let to = event.params.to.toHex();

    let all = All.load('all');
    if (all == null) {
        all = new All('all');
        all.numOwners = BigInt.fromI32(0);
        all.numTokens = BigInt.fromI32(0);
        all.numTokenContracts = BigInt.fromI32(0);
        all.tokenContracts = [];
    }
    
    let contract = EIP721.bind(event.address);
    let tokenContract = TokenContract.load(contractId);
    if(tokenContract == null) {
        // log.info('contract : {}',[event.address.toHexString()]);
        let supportsEIP165Identifier = supportsInterface(contract, '01ffc9a7');
        let supportsEIP721Identifier = supportsInterface(contract, '80ac58cd');
        let supportsNullIdentifierFalse = supportsInterface(contract, '00000000', false);
        let supportsEIP721 = supportsEIP165Identifier && supportsEIP721Identifier && supportsNullIdentifierFalse;

        let supportsEIP721Metadata = false;
        if(supportsEIP721) {
            supportsEIP721Metadata = supportsInterface(contract, '5b5e139f');
            log.debug('NEW CONTRACT eip721Metadata for {} : {}', [contractId, supportsEIP721Metadata ? 'true' : 'false']);
        }
        if (supportsEIP721) {
            tokenContract = new TokenContract(contractId);
            tokenContract.doAllAddressesOwnTheirIdByDefault = false;
            tokenContract.supportsEIP721Metadata = supportsEIP721Metadata;
            tokenContract.tokens = [];
            tokenContract.numTokens = BigInt.fromI32(0);
            tokenContract.numOwners = BigInt.fromI32(0);
        } else {
            return;
        }
        all.numTokenContracts = all.numTokenContracts.plus(BigInt.fromI32(1));
        let tokenContracts = all.tokenContracts
        tokenContracts.push(tokenContract.id);
        all.tokenContracts = tokenContracts;

        let doAllAddressesOwnTheirIdByDefault = contract.try_doAllAddressesOwnTheirIdByDefault();
        if(!doAllAddressesOwnTheirIdByDefault.reverted) {
            tokenContract.doAllAddressesOwnTheirIdByDefault = doAllAddressesOwnTheirIdByDefault.value; // only set it at creation
        } else {
            tokenContract.doAllAddressesOwnTheirIdByDefault = false;
        }
    }

    let currentOwnerPerTokenContractId = contractId + '_' + from;
    let currentOwnerPerTokenContract = OwnerPerTokenContract.load(currentOwnerPerTokenContractId);
    if (currentOwnerPerTokenContract != null) {
        if (currentOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(1))) {
            tokenContract.numOwners = tokenContract.numOwners.minus(BigInt.fromI32(1));
        }
        currentOwnerPerTokenContract.address = event.params.from;
        currentOwnerPerTokenContract.contractAddress = event.address;
        currentOwnerPerTokenContract.numTokens = currentOwnerPerTokenContract.numTokens.minus(BigInt.fromI32(1));
        let tokens = currentOwnerPerTokenContract.tokens;
        let index = tokens.indexOf(id);
        tokens.splice(index, 1);
        currentOwnerPerTokenContract.tokens = tokens;
        currentOwnerPerTokenContract.save();
    }

    let newOwnerPerTokenContractId = contractId + '_' + to;
    let newOwnerPerTokenContract = OwnerPerTokenContract.load(newOwnerPerTokenContractId);
    if (newOwnerPerTokenContract == null) {
        newOwnerPerTokenContract = new OwnerPerTokenContract(newOwnerPerTokenContractId);
        newOwnerPerTokenContract.address = event.params.from;
        newOwnerPerTokenContract.contractAddress = event.address;
        newOwnerPerTokenContract.numTokens = BigInt.fromI32(0);
        newOwnerPerTokenContract.tokens = [];
    }

    let currentOwner = Owner.load(from);
    if (currentOwner != null) {
        if (currentOwner.numTokens.equals(BigInt.fromI32(1))) {
            all.numOwners = all.numOwners.minus(BigInt.fromI32(1));
        }
        currentOwner.numTokens = currentOwner.numTokens.minus(BigInt.fromI32(1));
        let tokens = currentOwner.tokens;
        let index = tokens.indexOf(id);
        tokens.splice(index, 1);
        currentOwner.tokens = tokens;
        currentOwner.save();
    }

    let newOwner = Owner.load(to);
    if (newOwner == null) {
        newOwner = new Owner(to);
        newOwner.numTokens = BigInt.fromI32(0);
        newOwner.tokens = [];
    }
    
    let eip721Token = Token.load(id);
    if(eip721Token == null) {
        eip721Token = new Token(id);
        eip721Token.contract = tokenContract.id;
        eip721Token.tokenID = tokenId;
        eip721Token.mintTime = event.block.timestamp;
        if (tokenContract.supportsEIP721Metadata) {
            let metadataURI = contract.try_tokenURI(tokenId);
            if(!metadataURI.reverted) {
                log.debug('tokenURI value {} : {}', [tokenContract.id, metadataURI.value]);
                eip721Token.tokenURI = metadataURI.value; // only set it at creation
            } else {
                log.debug('tokenURI reverted {}', [tokenContract.id]);
                eip721Token.tokenURI = "";
            }
        } else {
            log.debug('tokenURI not supported {}', [tokenContract.id]);
            eip721Token.tokenURI = ""; // TODO null ?
        }
    } else if(to == zeroAddress) {
        all.numTokens = all.numTokens.minus(BigInt.fromI32(1));
        store.remove('Token', id);
    }
    if(to != zeroAddress) { // ignore transfer to zero
        all.numTokens = all.numTokens.plus(BigInt.fromI32(1));
        eip721Token.owner = newOwner.id;
        eip721Token.save();
        
        let newOwnerTokens = newOwner.tokens;
        newOwnerTokens.push(eip721Token.id);
        newOwner.tokens = newOwnerTokens;
        if (newOwner.numTokens.equals(BigInt.fromI32(0))) {
            all.numOwners = all.numOwners.plus(BigInt.fromI32(1));
        }
        newOwner.numTokens = newOwner.numTokens.plus(BigInt.fromI32(1));
        newOwner.save();

        let newOwnerPerTokenContractTokens = newOwnerPerTokenContract.tokens;
        newOwnerPerTokenContractTokens.push(eip721Token.id);
        newOwnerPerTokenContract.tokens = newOwnerPerTokenContractTokens;
        if (newOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(0))) {
            tokenContract.numOwners = tokenContract.numOwners.plus(BigInt.fromI32(1));
        }
        newOwnerPerTokenContract.numTokens = newOwnerPerTokenContract.numTokens.plus(BigInt.fromI32(1));
        newOwnerPerTokenContract.save();

        let tokens = tokenContract.tokens;
        tokens.push(id)
        tokenContract.tokens = tokens
        tokenContract.numTokens = tokenContract.numTokens.plus(BigInt.fromI32(1));
        tokenContract.save();
    } else {
        let tokens = tokenContract.tokens;
        let index = tokens.indexOf(id);
        tokens.splice(index, 1);
        tokenContract.tokens = tokens;
        tokenContract.numTokens = tokenContract.numTokens.minus(BigInt.fromI32(1));
        tokenContract.save();
    }
    all.save();
}
