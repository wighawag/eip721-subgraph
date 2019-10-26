pragma solidity 0.5.12;

import "./EIP721WithMetadata.sol";
import "./EIP721Example.sol";

contract EIP721ExampleWithMetadata is EIP721Example, EIP721WithMetadata {

    function name() external view returns (string memory) {
        return "EIP721ExampleWithMetadata";
    }

    function symbol() external view returns (string memory) {
        return "E7EM";
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        return string(
            abi.encodePacked(
                "nft://",
                uint2str(uint256(address(this))),
                "/",
                uint2str(id)
            )
        );
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || //ERC165
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f; // ERC721 metadata
    }

    // solium-disable-next-line security/no-assign-params
    function uint2str(uint256 _i) private pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }

        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }

        return string(bstr);
    }

}