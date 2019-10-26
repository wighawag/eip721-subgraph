import { store, Address } from '@graphprotocol/graph-ts';
import { Transfer } from '../generated/EIP721/EIP721';
import { EIP721Token } from '../generated/schema';

let zeroAddress = Address.fromHexString('0x0000000000000000000000000000000000000000');

export function handleTransfer(event: Transfer): void {
    let id = event.address.toHex() + '_' + event.params.id.toHex();
    let eip721Token = EIP721Token.load(id);
    if(eip721Token == null) {
        eip721Token = new EIP721Token(id);
    } else if(event.params.to == zeroAddress) {
        store.remove('EIP721Token', id);
    }
    if(event.params.to != zeroAddress) { // ignore transfer to zero
        eip721Token.owner = event.params.to;
        eip721Token.save();
    }
}
