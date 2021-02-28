import { ContractRegistered } from '../generated/Emitter/EmitterContract';
import { EIP721Template } from '../generated/templates';
import { TokenContract } from "../generated/schema";
import { ByteArray } from '@graphprotocol/graph-ts';


export function handleMinter(event: ContractRegistered): void {
    let registeredAsEIP721 = false;
    let interfaceIds = event.params.interfaceIds;
    for (let i = 0; i < interfaceIds.length; i++) {
        let interfaceId = interfaceIds[i].toHex();
        if (interfaceId == "80ac58cd") {
            registeredAsEIP721 = true;
            break;
        }
    }
    if (registeredAsEIP721) {
        let tokenContract = TokenContract.load(event.params.contractAddress.toHex());
        if (tokenContract == null) {
            EIP721Template.create(event.params.contractAddress);
        }
    }
}