// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint8 vote; // index of the candidate voted for
    }


    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    string[] private docs;
    bool public votingStarted = false;
    bool public votingEnded = false;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier isRegistered() {
        require(voters[msg.sender].isRegistered, "You are not registered to vote");
        _;
    }

    modifier votingActive() {
        require(!votingEnded, "Voting has ended");
        require(votingStarted, "Voting has not started");
        _;
    }

    constructor(string[] memory candidateNames) {
        owner = msg.sender;
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                name: candidateNames[i],
                voteCount: 0
            }));
        }
    }

    function stringExists(string memory searchString) public view returns (bool) {
        for (uint i = 0; i < docs.length; i++) {
            if (keccak256(abi.encodePacked(docs[i])) == keccak256(abi.encodePacked(searchString))) {
                return true;
            }
        }
        return false;
    }

    function registerVoter(address voter) public {
        voters[voter].isRegistered = true;
    }

    function vote(uint8 candidateIndex, string memory document) public isRegistered votingActive {
        require(votingStarted, "Voting has not started");
        require(!stringExists(document), "A vote has been emitted with this document");
        require(candidateIndex < candidates.length, "Invalid candidate index");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].vote = candidateIndex;
        docs.push(document);
        candidates[candidateIndex].voteCount += 1;
    }

    function startVoting() public onlyOwner {
        require(!votingStarted, "Voting has started");
        votingStarted = true;
    }

    function endVoting() public onlyOwner {
        require(votingStarted, "Voting has not started");
        require(!votingEnded, "Voting has already ended");
        votingEnded = true;
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint8 index) public view returns (string memory name, uint256 voteCount) {
        require(index < candidates.length, "Invalid candidate index");
        Candidate storage candidate = candidates[index];
        return (candidate.name, candidate.voteCount);
    }

    function getWinner() public view returns (string memory winnerName, uint256 winnerVoteCount) {

        require(votingEnded, "Voting is still ongoing");
        uint256 winningVoteCount = 0;
        uint8 winningCandidateIndex = 0;
        for (uint8 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateIndex = i;
            }
        }
        return (candidates[winningCandidateIndex].name, winningVoteCount);
    }
}
