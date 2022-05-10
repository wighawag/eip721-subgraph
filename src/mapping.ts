import { store, Bytes, BigInt } from '@graphprotocol/graph-ts';
import { Transfer, EIP721 } from '../generated/EIP721/EIP721';
import { Token, TokenContract, Owner, All, OwnerPerTokenContract } from '../generated/schema';

// import { log } from '@graphprotocol/graph-ts';

let ZERO_ADDRESS_STRING = '0x0000000000000000000000000000000000000000';

let ZERO_ADDRESS: Bytes = Bytes.fromHexString(ZERO_ADDRESS_STRING) as Bytes;
let ZERO = BigInt.fromI32(0);
let ONE = BigInt.fromI32(1);


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

function setCharAt(str: string, index: i32, char: string): string {
    if(index > str.length-1) return str;
    return str.substr(0,index) + char + str.substr(index+1);
}

function normalize(strValue: string): string {
    if (strValue.length === 1 && strValue.charCodeAt(0) === 0) {
        return "";    
    } else {
        for (let i = 0; i < strValue.length; i++) {
            if (strValue.charCodeAt(i) === 0) {
                strValue = setCharAt(strValue, i, '\ufffd'); // graph-node db does not support string with '\u0000'
            }
        }
        return strValue;
    }
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
        all.numOwners = ZERO;
        all.numTokens = ZERO;
        all.numTokenContracts = ZERO;
    }
    
    let contract = EIP721.bind(event.address);
    let tokenContract = TokenContract.load(contractId);
    if(tokenContract == null) {
        // log.error('contract : {}',[event.address.toHexString()]);
        let supportsEIP165Identifier = supportsInterface(contract, '01ffc9a7');
        let supportsEIP721Identifier = supportsInterface(contract, '80ac58cd');
        let supportsNullIdentifierFalse = supportsInterface(contract, '00000000', false);
        let supportsEIP721 = supportsEIP165Identifier && supportsEIP721Identifier && supportsNullIdentifierFalse;

        let supportsEIP721Metadata = false;
        if(supportsEIP721) {
            supportsEIP721Metadata = supportsInterface(contract, '5b5e139f');
            // log.error('NEW CONTRACT eip721Metadata for {} : {}', [event.address.toHex(), supportsEIP721Metadata ? 'true' : 'false']);
        }
        if (supportsEIP721) {
            tokenContract = new TokenContract(contractId);
            tokenContract.doAllAddressesOwnTheirIdByDefault = false;
            tokenContract.supportsEIP721Metadata = supportsEIP721Metadata;
            tokenContract.numTokens = ZERO;
            tokenContract.numOwners = ZERO;
            let name = contract.try_name();
            if(!name.reverted) {
                tokenContract.name = normalize(name.value);
            }
            let symbol = contract.try_symbol();
            if(!symbol.reverted) {
                tokenContract.symbol = normalize(symbol.value);
            }
        } else {
            return;
        }
        all.numTokenContracts = all.numTokenContracts.plus(ONE);

        let doAllAddressesOwnTheirIdByDefault = contract.try_doAllAddressesOwnTheirIdByDefault();
        if(!doAllAddressesOwnTheirIdByDefault.reverted) {
            tokenContract.doAllAddressesOwnTheirIdByDefault = doAllAddressesOwnTheirIdByDefault.value; // only set it at creation
        } else {
            tokenContract.doAllAddressesOwnTheirIdByDefault = false;
        }
    }

    if (from != ZERO_ADDRESS_STRING || to != ZERO_ADDRESS_STRING) { // skip if from zero to zero

        if (from != ZERO_ADDRESS_STRING) { // existing token
            let currentOwnerPerTokenContractId = contractId + '_' + from;
            let currentOwnerPerTokenContract = OwnerPerTokenContract.load(currentOwnerPerTokenContractId);
            if (currentOwnerPerTokenContract != null) {
                if (currentOwnerPerTokenContract.numTokens.equals(ONE)) {
                    tokenContract.numOwners = tokenContract.numOwners.minus(ONE);
                }
                currentOwnerPerTokenContract.numTokens = currentOwnerPerTokenContract.numTokens.minus(ONE);
                currentOwnerPerTokenContract.save();
            }

            let currentOwner = Owner.load(from);
            if (currentOwner != null) {
                if (currentOwner.numTokens.equals(ONE)) {
                    all.numOwners = all.numOwners.minus(ONE);
                }
                currentOwner.numTokens = currentOwner.numTokens.minus(ONE);
                currentOwner.save();
            }
        } // else minting
        
        
        if(to != ZERO_ADDRESS_STRING) { // transfer
            let newOwner = Owner.load(to);
            if (newOwner == null) {
                newOwner = new Owner(to);
                newOwner.numTokens = ZERO;
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
            
            if (from == ZERO_ADDRESS_STRING) { // mint +1
                all.numTokens = all.numTokens.plus(ONE);
                tokenContract.numTokens = tokenContract.numTokens.plus(ONE);
            }
            
            eip721Token.owner = newOwner.id;
            eip721Token.save();

            if (newOwner.numTokens.equals(ZERO)) {
                all.numOwners = all.numOwners.plus(ONE);
            }
            newOwner.numTokens = newOwner.numTokens.plus(ONE);
            newOwner.save();

            let newOwnerPerTokenContractId = contractId + '_' + to;
            let newOwnerPerTokenContract = OwnerPerTokenContract.load(newOwnerPerTokenContractId);
            if (newOwnerPerTokenContract == null) {
                newOwnerPerTokenContract = new OwnerPerTokenContract(newOwnerPerTokenContractId);
                newOwnerPerTokenContract.owner = newOwner.id;
                newOwnerPerTokenContract.contract = tokenContract.id;
                newOwnerPerTokenContract.numTokens = ZERO;
            }

            if (newOwnerPerTokenContract.numTokens.equals(ZERO)) {
                tokenContract.numOwners = tokenContract.numOwners.plus(ONE);
            }
            newOwnerPerTokenContract.numTokens = newOwnerPerTokenContract.numTokens.plus(ONE);
            newOwnerPerTokenContract.save();
        } else { // burn
            store.remove('Token', id);
            all.numTokens = all.numTokens.minus(ONE);
            tokenContract.numTokens = tokenContract.numTokens.minus(ONE);
        }
    }
    tokenContract.save();
    all.save();
}
