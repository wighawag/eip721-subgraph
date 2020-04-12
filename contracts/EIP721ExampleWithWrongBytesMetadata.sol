pragma solidity 0.5.12;

import "./EIP721Example.sol";

contract EIP721ExampleWithWrongBytesMetadata is EIP721Example {

    function name() external view returns (string memory) {
        return "EIP721ExampleWithWrongBytesMetadata";
    }

    function symbol() external view returns (string memory) {
        return "E7EM";
    }

    function tokenURI(uint256 id) external view returns (bytes memory) {
        return new bytes(1);
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || //ERC165
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f; // ERC721 metadata
    }
}