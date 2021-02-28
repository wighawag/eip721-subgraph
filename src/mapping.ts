import { store, Bytes, BigInt } from '@graphprotocol/graph-ts';
import { Transfer, AnyEIP721 } from '../generated/templates/EIP721Template/AnyEIP721';
import { Token, TokenContract, Owner, All, OwnerPerTokenContract } from '../generated/schema';
import {normalize} from './utils';
import { log } from '@graphprotocol/graph-ts';

let zeroAddress = '0x0000000000000000000000000000000000000000';

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
    }
    
    let contract = AnyEIP721.bind(event.address);
    let tokenContract = TokenContract.load(contractId);
    if(tokenContract == null) {
        log.error('contract : {}',[event.address.toHexString()]);
    }

    if (from != zeroAddress || to != zeroAddress) { // skip if from zero to zero

        if (from != zeroAddress) { // existing token
            let currentOwnerPerTokenContractId = contractId + '_' + from;
            let currentOwnerPerTokenContract = OwnerPerTokenContract.load(currentOwnerPerTokenContractId);
            if (currentOwnerPerTokenContract != null) {
                if (currentOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(1))) {
                    tokenContract.numOwners = tokenContract.numOwners.minus(BigInt.fromI32(1));
                }
                currentOwnerPerTokenContract.numTokens = currentOwnerPerTokenContract.numTokens.minus(BigInt.fromI32(1));
                currentOwnerPerTokenContract.save();
            }

            let currentOwner = Owner.load(from);
            if (currentOwner != null) {
                if (currentOwner.numTokens.equals(BigInt.fromI32(1))) {
                    all.numOwners = all.numOwners.minus(BigInt.fromI32(1));
                }
                currentOwner.numTokens = currentOwner.numTokens.minus(BigInt.fromI32(1));
                currentOwner.save();
            }
        } // else minting
        
        
        if(to != zeroAddress) { // transfer
            let newOwner = Owner.load(to);
            if (newOwner == null) {
                newOwner = new Owner(to);
                newOwner.numTokens = BigInt.fromI32(0);
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
                        eip721Token.tokenURI = normalize(metadataURI.value);
                    } else {
                        eip721Token.tokenURI = "";
                    }
                } else {
                    // log.error('tokenURI not supported {}', [tokenContract.id]);
                    eip721Token.tokenURI = ""; // TODO null ?
                }
            }
            
            all.numTokens = all.numTokens.plus(BigInt.fromI32(1));
            eip721Token.owner = newOwner.id;
            eip721Token.save();

            if (newOwner.numTokens.equals(BigInt.fromI32(0))) {
                all.numOwners = all.numOwners.plus(BigInt.fromI32(1));
            }
            newOwner.numTokens = newOwner.numTokens.plus(BigInt.fromI32(1));
            newOwner.save();

            let newOwnerPerTokenContractId = contractId + '_' + to;
            let newOwnerPerTokenContract = OwnerPerTokenContract.load(newOwnerPerTokenContractId);
            if (newOwnerPerTokenContract == null) {
                newOwnerPerTokenContract = new OwnerPerTokenContract(newOwnerPerTokenContractId);
                newOwnerPerTokenContract.owner = newOwner.id;
                newOwnerPerTokenContract.contract = tokenContract.id;
                newOwnerPerTokenContract.numTokens = BigInt.fromI32(0);
            }

            if (newOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(0))) {
                tokenContract.numOwners = tokenContract.numOwners.plus(BigInt.fromI32(1));
            }
            newOwnerPerTokenContract.numTokens = newOwnerPerTokenContract.numTokens.plus(BigInt.fromI32(1));
            newOwnerPerTokenContract.save();

            tokenContract.numTokens = tokenContract.numTokens.plus(BigInt.fromI32(1));
        } else { // burn
            store.remove('Token', id);
            all.numTokens = all.numTokens.minus(BigInt.fromI32(1));
            tokenContract.numTokens = tokenContract.numTokens.minus(BigInt.fromI32(1));
        }
    }
    tokenContract.save();
    all.save();
}
