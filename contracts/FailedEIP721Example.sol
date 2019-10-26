pragma solidity 0.5.12;

import "./EIP721Example.sol";

contract FailedEIP721Example is EIP721Example {

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        revert("not support");
    }
}