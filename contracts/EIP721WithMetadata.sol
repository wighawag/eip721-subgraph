pragma solidity 0.5.12;

import "./EIP721.sol";

contract EIP721WithMetadata is EIP721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 id) external view returns (string memory);
}