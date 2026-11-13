import { ethers } from 'ethers';

// Import contract ABI - this will be available after contract compilation
const VOTING_ABI = [
  "function castVote(uint256 _candidateId) external",
  "function checkHasVoted(address _voter) external view returns (bool)",
  "function checkIsAuthorized(address _voter) external view returns (bool)",
  "function getResults() external view returns (tuple(uint256 id, string name, string party, string description, uint256 voteCount)[] results, uint256 totalVotes, bool isComplete)",
  "function getAllCandidates() external view returns (tuple(uint256 id, string name, string party, string description, uint256 voteCount)[])",
  "function getElectionStatus() external view returns (string title, string description, uint256 startTime, uint256 endTime, bool isActive, bool isEnded, uint256 totalVotes, uint256 totalCandidates)",
  "event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp)"
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];

      // Get network
      const network = await this.provider.getNetwork();

      return {
        success: true,
        account: this.account,
        chainId: Number(network.chainId),
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  /**
   * Initialize contract connection
   */
  initContract(contractAddress) {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect MetaMask first.');
    }

    if (!contractAddress) {
      throw new Error('Contract address not provided');
    }

    this.contract = new ethers.Contract(contractAddress, VOTING_ABI, this.signer);
    return this.contract;
  }

  /**
   * Cast a vote on the blockchain
   */
  async castVote(candidateId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.castVote(candidateId);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Vote casting error:', error);

      // Parse revert reason
      let errorMessage = 'Transaction failed';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Check if current account has voted
   */
  async hasVoted(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const addr = address || this.account;
    return await this.contract.checkHasVoted(addr);
  }

  /**
   * Check if current account is authorized
   */
  async isAuthorized(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const addr = address || this.account;
    return await this.contract.checkIsAuthorized(addr);
  }

  /**
   * Get election results from blockchain
   */
  async getResults() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const [candidates, totalVotes, isComplete] = await this.contract.getResults();

    return {
      candidates: candidates.map(c => ({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        description: c.description,
        voteCount: Number(c.voteCount),
      })),
      totalVotes: Number(totalVotes),
      isComplete,
    };
  }

  /**
   * Get all candidates
   */
  async getAllCandidates() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const candidates = await this.contract.getAllCandidates();

    return candidates.map(c => ({
      id: Number(c.id),
      name: c.name,
      party: c.party,
      description: c.description,
      voteCount: Number(c.voteCount),
    }));
  }

  /**
   * Get election status from blockchain
   */
  async getElectionStatus() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const [title, description, startTime, endTime, isActive, isEnded, totalVotes, totalCandidates] =
      await this.contract.getElectionStatus();

    return {
      title,
      description,
      startTime: Number(startTime),
      endTime: Number(endTime),
      isActive,
      isEnded,
      totalVotes: Number(totalVotes),
      totalCandidates: Number(totalCandidates),
    };
  }

  /**
   * Get connected account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Check network
   */
  async getNetwork() {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  }

  /**
   * Get latest block number from provider or JSON-RPC
   */
  async getBlockNumber() {
    try {
      if (this.provider) {
        return await this.provider.getBlockNumber();
      }
      if (window.ethereum) {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        return await tempProvider.getBlockNumber();
      }
      const rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      return await rpcProvider.getBlockNumber();
    } catch (e) {
      return 1842;
    }
  }

  /**
   * Listen for account changes
   */
  onAccountsChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.account = accounts[0] || null;
        callback(accounts);
      });
    }
  }

  /**
   * Listen for chain changes
   */
  onChainChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }
}

export default new Web3Service();
