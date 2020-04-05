import { store, Address, Bytes, EthereumValue, BigInt } from '@graphprotocol/graph-ts';
import { Transfer, EIP721 } from '../generated/EIP721/EIP721';
import { Token, TokenContract, Owner, All, TokenTypeOwner } from '../generated/schema';

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
    let all = All.load('all');
    if (all == null) {
        all = new All('all');
        all.numOwners = BigInt.fromI32(0);
        all.numTokens = BigInt.fromI32(0);
    }
    
    let contract = EIP721.bind(event.address);
    let tokenContract = TokenContract.load(event.address.toHex());
    if(tokenContract == null) {
        // log.info('contract : {}',[event.address.toHexString()]);
        let supportsEIP165Identifier = supportsInterface(contract, '01ffc9a7');
        let supportsEIP721Identifier = supportsInterface(contract, '80ac58cd');
        let supportsNullIdentifierFalse = supportsInterface(contract, '00000000', false);
        let supportsEIP721 = supportsEIP165Identifier && supportsEIP721Identifier && supportsNullIdentifierFalse;

        let supportsEIP721Metadata = false;
        if(supportsEIP721) {
            supportsEIP721Metadata = supportsInterface(contract, '5b5e139f');
            // log.debug('eip721Metadata : {}', [supportsEIP721Metadata ? 'true' : 'false']);
        }
        if (supportsEIP721) {
            tokenContract = new TokenContract(event.address.toHex());
            tokenContract.ownOwnId = false;
            tokenContract.supportsEIP721Metadata = supportsEIP721Metadata;
            tokenContract.tokens = [];
            tokenContract.numTokens = BigInt.fromI32(0);
            // tokenContract.numOwners = BigInt.fromI32(0);
        } else {
            return;
        }
    }

    let currentTokenTypeOwnerId = event.address.toHex() + '_' + event.params.from.toHex();
    let currentTokenTypeOwner = TokenTypeOwner.load(currentTokenTypeOwnerId);
    if (currentTokenTypeOwner != null) {
        currentTokenTypeOwner.address = event.params.from;
        currentTokenTypeOwner.contractAddress = event.address;
        currentTokenTypeOwner.numTokens = currentTokenTypeOwner.numTokens.minus(BigInt.fromI32(1));
        let tokens = currentTokenTypeOwner.tokens;
        let index = tokens.indexOf(event.params.id.toHex());
        tokens.splice(index, 1);
        currentTokenTypeOwner.tokens = tokens;
        currentTokenTypeOwner.save();
    }

    let newTokenTypeOwnerId = event.address.toHex() + '_' + event.params.to.toHex();
    let newTokenTypeOwner = TokenTypeOwner.load(newTokenTypeOwnerId);
    if (newTokenTypeOwner == null) {
        newTokenTypeOwner = new TokenTypeOwner(newTokenTypeOwnerId);
        newTokenTypeOwner.address = event.params.from;
        newTokenTypeOwner.contractAddress = event.address;
        newTokenTypeOwner.numTokens = BigInt.fromI32(0);
        newTokenTypeOwner.tokens = [];
    }

    let currentOwner = Owner.load(event.params.from.toHex());
    if (currentOwner != null) {
        if (currentOwner.numTokens.equals(BigInt.fromI32(1))) {
            all.numOwners = all.numOwners.minus(BigInt.fromI32(1));
        }
        currentOwner.numTokens = currentOwner.numTokens.minus(BigInt.fromI32(1));
        let tokens = currentOwner.tokens;
        let index = tokens.indexOf(event.params.id.toHex());
        tokens.splice(index, 1);
        currentOwner.tokens = tokens;
        currentOwner.save();
    }

    let newOwner = Owner.load(event.params.to.toHex());
    if (newOwner == null) {
        newOwner = new Owner(event.params.to.toHex());
        newOwner.numTokens = BigInt.fromI32(0);
        newOwner.tokens = [];
    }
    
    let tokenId = event.params.id;
    let id = event.address.toHex() + '_' + tokenId.toHex();
    let eip721Token = Token.load(id);
    if(eip721Token == null) {
        eip721Token = new Token(id);
        eip721Token.contract = tokenContract.id;
        eip721Token.tokenID = tokenId;
        eip721Token.mintTime = event.block.timestamp;
        if (tokenContract.supportsEIP721Metadata) {
            let metadataURI = contract.try_tokenURI(tokenId);
            if(!metadataURI.reverted) {
                eip721Token.tokenURI = metadataURI.value; // only set it at creation
            } else {
                eip721Token.tokenURI = "";
            }
        } else {
            eip721Token.tokenURI = ""; // TODO null ?
        }
    } else if(event.params.to.toHex() == zeroAddress) {
        all.numTokens = all.numTokens.minus(BigInt.fromI32(1));
        store.remove('EIP721Token', id);
    }
    if(event.params.to.toHex() != zeroAddress) { // ignore transfer to zero
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

        let newTokenTypeOwnerTokens = newTokenTypeOwner.tokens;
        newTokenTypeOwnerTokens.push(eip721Token.id);
        newTokenTypeOwner.tokens = newTokenTypeOwnerTokens;
        newTokenTypeOwner.numTokens = newTokenTypeOwner.numTokens.plus(BigInt.fromI32(1));
        newTokenTypeOwner.save();

        let tokens = tokenContract.tokens;
        tokens.push(id)
        tokenContract.tokens = tokens
        tokenContract.numTokens = tokenContract.numTokens.plus(BigInt.fromI32(1));
        tokenContract.save();
    } else {
        let tokens = tokenContract.tokens;
        let index = tokens.indexOf(event.params.id.toHex());
        tokens.splice(index, 1);
        tokenContract.tokens = tokens;
        tokenContract.numTokens = tokenContract.numTokens.minus(BigInt.fromI32(1));
        tokenContract.save();
    }
    all.save();
}
