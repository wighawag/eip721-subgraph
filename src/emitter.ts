import { ContractRegistered } from '../generated/Emitter/EmitterContract';
import { EIP721Template } from '../generated/templates';
import { TokenContract, All } from "../generated/schema";
import { AnyEIP721 } from '../generated/templates/EIP721Template/AnyEIP721';

import { Bytes, BigInt } from '@graphprotocol/graph-ts';
import {normalize} from './utils';

import { log } from '@graphprotocol/graph-ts';

function toBytes(hexString: String): Bytes {
    let result = new Uint8Array(hexString.length/2);
    for (let i = 0; i < hexString.length; i += 2) {
        result[i/2] = parseInt(hexString.substr(i, 2), 16) as u32;
    }
    return result as Bytes;
}

function supportsInterface(contract: AnyEIP721, interfaceId: String, expected : boolean = true) : boolean {
    let supports = contract.try_supportsInterface(toBytes(interfaceId));
    return !supports.reverted && supports.value == expected;
}


export function handleContract (event: ContractRegistered): void {

    log.info('handleContract : {}',[event.params.contractAddress.toHex()]);

    let registeredAsEIP721 = false;
    let interfaceIds = event.params.interfaceIds;
    for (let i = 0; i < interfaceIds.length; i++) {
        let interfaceId = interfaceIds[i].toHex();
        log.info('interfaceId : {}',[interfaceId]);
        if (interfaceId == "0x80ac58cd") {
            registeredAsEIP721 = true;
            break;
        }
    }
    if (registeredAsEIP721) {
        let all = All.load('all');
        if (all == null) {
            all = new All('all');
            all.numOwners = BigInt.fromI32(0);
            all.numTokens = BigInt.fromI32(0);
            all.numTokenContracts = BigInt.fromI32(0);
        }
        
        let contractId = event.params.contractAddress.toHex();
        let contract = AnyEIP721.bind(event.params.contractAddress);
        let tokenContract = TokenContract.load(contractId);
        if (tokenContract == null) {
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
                tokenContract.numTokens = BigInt.fromI32(0);
                tokenContract.numOwners = BigInt.fromI32(0);
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
            all.numTokenContracts = all.numTokenContracts.plus(BigInt.fromI32(1));

            let doAllAddressesOwnTheirIdByDefault = contract.try_doAllAddressesOwnTheirIdByDefault();
            if(!doAllAddressesOwnTheirIdByDefault.reverted) {
                tokenContract.doAllAddressesOwnTheirIdByDefault = doAllAddressesOwnTheirIdByDefault.value; // only set it at creation
            } else {
                tokenContract.doAllAddressesOwnTheirIdByDefault = false;
            }
            
            EIP721Template.create(event.params.contractAddress);
            
            tokenContract.save();
            all.save();
        }
    }
}