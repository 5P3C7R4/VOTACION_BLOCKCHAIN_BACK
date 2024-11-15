// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // Estructura que representa a un votante
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint8 vote;
    }
    // Estructura que representa a un candidato
    struct Candidate {
        string name;
        uint16 index;
        uint16 voteCount;
    }
    // Mapeo de direcciones a votantes
    mapping(address => Voter) public voters;
    address public owner;
    Candidate[] public candidates;
    uint8 public candidatesCount;
    string[] private docs;
    bool public votingStarted = false;
    bool public votingEnded = false;

    constructor() {
        owner = msg.sender;
    }

    // Modificador que restringe el acceso a ciertas funciones solo al propietario
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    // Modificador que verifica si el votante está registrado
    modifier isRegistered() {
        require(
            voters[msg.sender].isRegistered,
            "You are not registered to vote"
        );
        _;
    }

    // Modificador que asegura que la votación esté activa
    modifier votingActive() {
        require(!votingEnded, "Voting has ended");
        require(votingStarted, "Voting has not started");
        _;
    }

    // Función para agregar un candidato, solo puede ser llamada por el propietario
    function addCandidate(string memory _name, uint16 _index) public onlyOwner {
        for (uint16 i = 0; i < candidates.length; i++) {
            require(candidates[i].index != _index, "Index already exists");
        }

        candidates.push(Candidate(_name, _index, 0));
    }

    // Función para obtener la dirección del propietario
    function getOwner() public view returns (address) {
        return owner;
    }

    // Función que verifica si un documento ya existe en la lista
    function stringExists(
        string memory searchString
    ) public view returns (bool) {
        for (uint i = 0; i < docs.length; i++) {
            if (
                keccak256(abi.encodePacked(docs[i])) ==
                keccak256(abi.encodePacked(searchString))
            ) {
                return true;
            }
        }
        return false;
    }

    // Función para registrar a un votante
    function registerVoter(address voter) public {
        voters[voter].isRegistered = true;
    }

    // Función para emitir un voto
    function vote(
        uint8 candidateIndex,
        string memory document
    ) public isRegistered votingActive {
        require(votingStarted, "Voting has not started");
        require(
            !stringExists(document),
            "A vote has been emitted with this document"
        );
        require(candidateIndex <= candidates.length, "Invalid candidate index");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].vote = candidateIndex;
        docs.push(document);
        candidates[candidateIndex - 1].voteCount += 1;
    }

    // Función para iniciar el proceso de votación
    function startVoting() public onlyOwner {
        require(!votingStarted, "Voting has started");
        votingStarted = true;
    }

    // Función para finalizar el proceso de votación
    function endVoting() public onlyOwner {
        require(votingStarted, "Voting has not started");
        require(!votingEnded, "Voting has already ended");
        votingEnded = true;
    }

    // Función para obtener el número de candidatos
    function getCandidateCount() public view returns (uint8) {
        return uint8(candidates.length);
    }

    // Función para obtener todos los candidatos
    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    // Función para obtener información de un candidato específico
    function getCandidate(
        uint8 index
    ) public view returns (string memory name, uint256 voteCount) {
        require(index <= candidates.length, "Invalid candidate index");
        Candidate storage candidate = candidates[index - 1];
        return (candidate.name, candidate.voteCount);
    }

    // Función para determinar el ganador de la votación
    function getWinner()
        public
        view
        returns (string memory winnerName, uint256 winnerVoteCount)
    {
        require(votingEnded, "Voting is still ongoing");
        uint256 winningVoteCount = 0;
        uint8 winningCandidateIndex = 0;
        uint8 winnersCount = 0; // Contador de candidatos con votos máximos
        for (uint8 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateIndex = i;
            } else if (candidates[i].voteCount == winningVoteCount) {
                winnersCount++; // Incrementa el contador de empates
            }
        }
        for (uint8 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == winningVoteCount) {
                winnersCount++;
            }
        }
        if (winnersCount > 1) {
            return ("Tie", winningVoteCount);
        }
        return (candidates[winningCandidateIndex].name, winningVoteCount);
    }
}
