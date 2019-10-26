pragma solidity 0.5.12;

import "./EIP721ExampleWithMetadata.sol";

contract FakeEIP721ExampleWithMetadata is EIP721ExampleWithMetadata {

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return false;
    }

}