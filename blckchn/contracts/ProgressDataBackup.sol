// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProgressDataBackup {

    address public owner;
    mapping(address => string) public userProgress;

    event ProgressUpdated(address indexed user, string newIpfsHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this operation");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Function to update user's progress data on IPFS
    function updateProgress(string memory newIpfsHash) public {
        userProgress[msg.sender] = newIpfsHash;
        emit ProgressUpdated(msg.sender, newIpfsHash);
    }
}
