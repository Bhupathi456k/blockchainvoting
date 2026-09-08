// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Secure Digital Voting Platform Smart Contract
 * @dev Implements a tamper-proof electronic voting system with duplicate vote prevention,
 * candidate registration, voter authorization, and automatic vote counting.
 * Developed for academic demonstration purposes.
 */
contract Voting {
    // Structure to represent a Candidate
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string description;
        uint256 voteCount;
    }

    // Structure to represent an Election
    struct Election {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isEnded;
    }

    // Administrator address
    address public admin;

    // Election details
    Election public election;

    // Candidate storage
    uint256 public candidateCount;
    mapping(uint256 => Candidate) public candidates;

    // Voter tracking
    mapping(address => bool) public authorizedVoters;
    mapping(address => bool) public hasVoted;
    uint256 public totalVotesCast;

    // Events
    event ElectionCreated(string title, uint256 startTime, uint256 endTime);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp, uint256 totalVotes);
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event CandidateUpdated(uint256 indexed candidateId, string name, string party);
    event VoterAuthorized(address indexed voterAddress);
    event VoterDeauthorized(address indexed voterAddress);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);

    // Modifiers for access control and validation
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this operation");
        _;
    }

    modifier electionActive() {
        require(election.isActive, "Election is not currently active");
        require(!election.isEnded, "Election has ended");
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has expired");
        _;
    }

    modifier electionNotStarted() {
        require(!election.isActive, "Cannot modify election once started");
        require(!election.isEnded, "Cannot modify ended election");
        _;
    }

    /**
     * @dev Constructor sets the deployer as the admin
     */
    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Initialize/create a new election
     * @param _title Title of the election
     * @param _description Description of the election
     * @param _startTime Election start time (unix timestamp)
     * @param _endTime Election end time (unix timestamp)
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin {
        require(_startTime < _endTime, "Start time must be before end time");
        require(_endTime > block.timestamp, "End time must be in the future");

        election = Election({
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: false,
            isEnded: false
        });

        emit ElectionCreated(_title, _startTime, _endTime);
    }

    /**
     * @dev Start the election manually (or activate it)
     */
    function startElection() external onlyAdmin {
        require(!election.isActive, "Election already active");
        require(!election.isEnded, "Election already ended");
        require(candidateCount >= 2, "Must have at least 2 candidates to start election");

        election.isActive = true;
        emit ElectionStarted(block.timestamp);
    }

    /**
     * @dev End the election manually
     */
    function endElection() external onlyAdmin {
        require(election.isActive, "Election is not active");
        require(!election.isEnded, "Election already ended");

        election.isActive = false;
        election.isEnded = true;
        emit ElectionEnded(block.timestamp, totalVotesCast);
    }

    /**
     * @dev Register a new candidate
     * @param _name Name of the candidate
     * @param _party Political party or affiliation
     * @param _description Brief description
     */
    function registerCandidate(
        string memory _name,
        string memory _party,
        string memory _description
    ) external onlyAdmin electionNotStarted {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            description: _description,
            voteCount: 0
        });

        emit CandidateAdded(candidateCount, _name, _party);
    }

    /**
     * @dev Update candidate details before election starts
     */
    function updateCandidate(
        uint256 _candidateId,
        string memory _name,
        string memory _party,
        string memory _description
    ) external onlyAdmin electionNotStarted {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        require(bytes(_name).length > 0, "Candidate name cannot be empty");

        candidates[_candidateId].name = _name;
        candidates[_candidateId].party = _party;
        candidates[_candidateId].description = _description;

        emit CandidateUpdated(_candidateId, _name, _party);
    }

    /**
     * @dev Authorize a single voter
     * @param _voter Address of the voter to authorize
     */
    function authorizeVoter(address _voter) external onlyAdmin {
        require(_voter != address(0), "Invalid voter address");
        require(!authorizedVoters[_voter], "Voter already authorized");

        authorizedVoters[_voter] = true;
        emit VoterAuthorized(_voter);
    }

    /**
     * @dev Batch authorize multiple voters
     * @param _voters Array of voter addresses
     */
    function authorizeVotersBatch(address[] memory _voters) external onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (voter != address(0) && !authorizedVoters[voter]) {
                authorizedVoters[voter] = true;
                emit VoterAuthorized(voter);
            }
        }
    }

    /**
     * @dev Deauthorize a voter
     * @param _voter Address of the voter to deauthorize
     */
    function deauthorizeVoter(address _voter) external onlyAdmin {
        require(authorizedVoters[_voter], "Voter not authorized");
        require(!hasVoted[_voter], "Cannot deauthorize voter who already voted");

        authorizedVoters[_voter] = false;
        emit VoterDeauthorized(_voter);
    }

    /**
     * @dev Cast a vote for a candidate
     * @param _candidateId ID of the candidate to vote for
     * CRITICAL SECURITY REQUIREMENT: Prevents duplicate voting at the smart contract level
     */
    function castVote(uint256 _candidateId) external electionActive {
        // 1. Check voter authorization
        require(authorizedVoters[msg.sender], "You are not authorized to vote");

        // 2. CRITICAL: Check if voter has already voted
        require(!hasVoted[msg.sender], "You have already cast your vote");

        // 3. Check valid candidate
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate selected");

        // Record the vote
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        totalVotesCast++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    /**
     * @dev Get candidate details by ID
     * @param _candidateId Candidate ID
     */
    function getCandidate(uint256 _candidateId) external view returns (
        uint256 id,
        string memory name,
        string memory party,
        string memory description,
        uint256 voteCount
    ) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.party, c.description, c.voteCount);
    }

    /**
     * @dev Get all candidates list
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory candidateList = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            candidateList[i - 1] = candidates[i];
        }
        return candidateList;
    }

    /**
     * @dev Get full election results
     * Returns total candidates, total votes, and array of candidate votes
     */
    function getResults() external view returns (
        Candidate[] memory results,
        uint256 totalVotes,
        bool isComplete
    ) {
        Candidate[] memory candidateList = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            candidateList[i - 1] = candidates[i];
        }
        return (candidateList, totalVotesCast, election.isEnded);
    }

    /**
     * @dev Check if a specific address has voted
     * @param _voter Address to check
     */
    function checkHasVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }

    /**
     * @dev Check if a specific address is authorized
     * @param _voter Address to check
     */
    function checkIsAuthorized(address _voter) external view returns (bool) {
        return authorizedVoters[_voter];
    }

    /**
     * @dev Get election status details
     */
    function getElectionStatus() external view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isEnded,
        uint256 totalVotes,
        uint256 totalCandidates
    ) {
        return (
            election.title,
            election.description,
            election.startTime,
            election.endTime,
            election.isActive,
            election.isEnded,
            totalVotesCast,
            candidateCount
        );
    }
}
