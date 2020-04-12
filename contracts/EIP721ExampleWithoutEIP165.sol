pragma solidity 0.5.12;

import "./EIP721Example.sol";

contract EIP721ExampleWithoutEIP165 is EIP721Example {

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        revert("not support");
    }
}