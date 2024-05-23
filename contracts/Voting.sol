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
    bool public votingEnded;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        _;
    }

    modifier isRegistered() {
        require(voters[msg.sender].isRegistered, "You are not registered to vote");
        _;
    }

    modifier votingActive() {
        require(!votingEnded, "Voting has ended");
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

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function registerVoter(address voter) public {
        voters[voter].isRegistered = true;
    }

    function vote(uint8 candidateIndex) public isRegistered hasNotVoted votingActive {
        require(candidateIndex < candidates.length, "Invalid candidate index");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].vote = candidateIndex;
        candidates[candidateIndex].voteCount += 1;
    }

    function endVoting() public onlyOwner {
        votingEnded = true;
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
