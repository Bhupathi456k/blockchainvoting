const { ethers } = require('ethers');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = config.blockchain.contractAddress;
    this.initialized = false;
  }

  /**
   * Initialize blockchain provider and contract
   */
  async initialize() {
    try {
      // Connect to local Ethereum RPC
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

      // Load contract ABI
      let contractAbi = null;
      const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts/Voting.sol/Voting.json');

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        contractAbi = artifact.abi;
      } else {
        console.warn('⚠️  Voting contract artifact not found. Please compile the contract.');
      }

      // Connect contract if address is provided
      if (this.contractAddress && contractAbi) {
        this.contract = new ethers.Contract(this.contractAddress, contractAbi, this.provider);
        this.initialized = true;
        console.log(`✓ Connected to Voting contract at: ${this.contractAddress}`);
      } else {
        console.warn('⚠️  BlockchainService initialized without active contract connection.');
      }
    } catch (error) {
      console.error('BlockchainService initialization error:', error.message);
    }
  }

  /**
   * Update contract address
   */
  async setContractAddress(address) {
    this.contractAddress = address;
    await this.initialize();
  }

  /**
   * Get blockchain status
   */
  async getStatus() {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();

      let contractStatus = null;
      if (this.contract) {
        try {
          const admin = await this.contract.admin();
          const candidateCount = await this.contract.candidateCount();
          const totalVotes = await this.contract.totalVotesCast();
          contractStatus = {
            deployed: true,
            address: this.contractAddress,
            admin,
            candidateCount: Number(candidateCount),
            totalVotes: Number(totalVotes),
          };
        } catch (e) {
          contractStatus = {
            deployed: false,
            address: this.contractAddress,
            error: e.message,
          };
        }
      }

      return {
        connected: true,
        rpcUrl: config.blockchain.rpcUrl,
        chainId: Number(network.chainId),
        blockNumber,
        contract: contractStatus,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Get election results from smart contract
   */
  async getResults() {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    const [candidates, totalVotes, isComplete] = await this.contract.getResults();

    const formattedCandidates = candidates.map(c => ({
      id: Number(c.id),
      name: c.name,
      party: c.party,
      description: c.description,
      voteCount: Number(c.voteCount),
    }));

    return {
      candidates: formattedCandidates,
      totalVotes: Number(totalVotes),
      isComplete,
    };
  }

  /**
   * Check if a voter has voted on the blockchain
   */
  async checkHasVoted(voterAddress) {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    return await this.contract.checkHasVoted(voterAddress);
  }

  /**
   * Check if a voter is authorized on the blockchain
   */
  async checkIsAuthorized(voterAddress) {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    return await this.contract.checkIsAuthorized(voterAddress);
  }

  /**
   * Verify a transaction hash
   */
  async verifyTransaction(txHash) {
    if (!this.provider) {
      await this.initialize();
    }

    const tx = await this.provider.getTransaction(txHash);
    if (!tx) {
      return { exists: false };
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);

    return {
      exists: true,
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      status: receipt ? (receipt.status === 1 ? 'CONFIRMED' : 'FAILED') : 'PENDING',
      gasUsed: receipt ? receipt.gasUsed.toString() : null,
      confirmations: await tx.confirmations(),
    };
  }
}

module.exports = new BlockchainService();
