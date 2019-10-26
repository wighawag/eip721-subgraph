pragma solidity  0.5.12;

contract EIP165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}