pragma solidity 0.5.12;

import "./EIP721.sol";

contract EIP721Example is EIP721 {
    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed approved, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);


    mapping(address => uint256) internal _numTokensPerOwner;
    mapping(uint256 => address) internal _owners;
    mapping(address => mapping(address => bool)) internal _approvalsForAll;
    mapping(uint256 => address) internal _approvals;

    uint256 internal lastId;

    function mint(address to) external {
        _owners[++lastId] = to;
        _numTokensPerOwner[to]++;
        emit Transfer(address(0), to, lastId);
    }

    // //////////////// FAKE TO TEST ////////////////////////////////////
    function mintDuplicate(address to) external {
        emit Transfer(address(0), to, lastId);
    }

    function burnNonExistant() external {
        emit Transfer(msg.sender, address(0), lastId+1);
    }
    ////////////////////////////////////////////////////////////////////

    function ownerOf(uint256 id) external view returns (address) {
        address owner = _owners[id];
        require(owner != address(0), "token does not exists");
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _numTokensPerOwner[owner];
    }

    function approve(address to, uint256 id) external {
        address owner = _owners[id];
        require(owner == msg.sender, "not owner");
        _approvals[id] = to;
        emit Approval(owner, to, id);
    }

    function getApproved(uint256 id) external view returns (address) {
        require(_owners[id] != address(0), "token does not exist");
        return _approvals[id];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _approvalsForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _approvalsForAll[msg.sender][operator];
    }

    function burn(uint256 id) external {
        address owner = _owners[id];
        require(owner == msg.sender, "not owner");
        _numTokensPerOwner[owner]--;
        _owners[id] = address(0);
        _approvals[id] = address(0); // is that required ?
        emit Transfer(owner, address(0), id);
    }

    function _transferFrom(address from, address to, uint256 id) internal {
        require(to != address(0), "to is zero address");
        require(from != address(0), "from is zero address");
        require(_owners[id] == from, "not owner");
        _numTokensPerOwner[from]--;
        _numTokensPerOwner[to]++;
        _owners[id] = to;
        _approvals[id] = address(0);
        emit Transfer(from, to, id);
    }
    function transferFrom(address from, address to, uint256 id) external {
        _transferFrom(from, to, id);
    }
    function safeTransferFrom(address from, address to, uint256 id) external {
        _transferFrom(from, to, id);
        require(
            _checkOnERC721Received(from, to, id, ""),
            "EIP-721: transfer rejected"
        );
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes calldata data) external {
        _transferFrom(from, to, id);
        require(
            _checkOnERC721Received(from, to, id, data),
            "EIP-721: transfer rejected"
        );
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || //ERC165
            interfaceId == 0x80ac58cd; // ERC721
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) internal returns (bool) {
        if (!_isContract(to)) {
            return true;
        }

        bytes4 retval = ERC721TokenReceiver(to).onERC721Received(msg.sender, from, tokenId, _data);
        return (retval == ERC721_RECEIVED);
    }

    function _isContract(address addr) internal view returns (bool) {
        // for accounts without code, i.e. `keccak256('')`:
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

        bytes32 codehash;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            codehash := extcodehash(addr)
        }
        return (codehash != 0x0 && codehash != accountHash);
    }

}