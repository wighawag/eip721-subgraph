import { store, Address, Bytes } from '@graphprotocol/graph-ts';
import { Transfer, EIP721 } from '../generated/EIP721/EIP721';
import { EIP721Token } from '../generated/schema';

let zeroAddress = '0x0000000000000000000000000000000000000000';

function toBytes(hexString: String): Bytes {
    let result = new Uint8Array(hexString.length/2);
    for (let i = 0; i < hexString.length; i += 2) {
        result[i/2] = parseInt(hexString.substr(i, 2), 16) as u32;
    }
    return result as Bytes;
}

export function handleTransfer(event: Transfer): void {
    let contract = EIP721.bind(event.address);
    
    let supportsEIP165Identifier = contract.try_supportsInterface(toBytes('01ffc9a7'));
    let supportsEIP721Identifier = contract.try_supportsInterface(toBytes('80ac58cd'));
    let supportsNullIdentifier = contract.try_supportsInterface(toBytes('00000000'));
    let supportsEIP721 = (!supportsEIP165Identifier.reverted && supportsEIP165Identifier.value) &&
        (!supportsEIP721Identifier.reverted && supportsEIP721Identifier.value) &&
        (!supportsNullIdentifier.reverted && !supportsNullIdentifier.value);

    if(!supportsEIP721) {
        return;
    }

    let tokenId = event.params.id;
    let id = event.address.toHex() + '_' + tokenId.toHex();
    let eip721Token = EIP721Token.load(id);
    if(eip721Token == null) {
        eip721Token = new EIP721Token(id);
        eip721Token.contractAddress = event.address;
        eip721Token.tokenID = tokenId;
        eip721Token.mintTime = event.block.timestamp;
        let supportsEIP721Metadata = contract.try_supportsInterface(toBytes('5b5e139f'));
        if (!supportsEIP721Metadata.reverted && supportsEIP721Metadata.value) {
            let metadataURI = contract.try_tokenURI(tokenId);
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
    }
}
