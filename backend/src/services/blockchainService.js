const { ethers } = require('ethers');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');

// Standard Hardhat Account #0 default private key for local development
const DEFAULT_HARDHAT_ADMIN_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractWithSigner = null;
    this.contractAddress = config.blockchain.contractAddress;
    this.initialized = false;
    this.contractAbi = null;
  }

  get isConnected() {
    return !!(this.provider && this.contract);
  }

  /**
   * Initialize blockchain provider, signer, and contract
   */
  async initialize() {
    try {
      // Connect to local Ethereum RPC with fallback handling
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl, undefined, {
        staticNetwork: ethers.Network.from(31337), // Local Hardhat chainId fallback
      });

      // Load contract ABI
      const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts/Voting.sol/Voting.json');

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        this.contractAbi = artifact.abi;
      } else {
        console.warn('⚠️  Voting contract artifact not found. Please compile the contract.');
      }

      // Initialize admin signer if private key is available
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || DEFAULT_HARDHAT_ADMIN_KEY;
      if (adminPrivateKey && this.provider) {
        try {
          this.signer = new ethers.Wallet(adminPrivateKey, this.provider);
        } catch (signerErr) {
          console.warn('⚠️  Could not create admin signer:', signerErr.message);
        }
      }

      // Connect read-only contract if address is provided
      if (this.contractAddress && this.contractAbi) {
        this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.provider);
        if (this.signer) {
          this.contractWithSigner = this.contract.connect(this.signer);
        }
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
   * Authorize a voter address on-chain using the contract admin signer
   */
  async authorizeVoter(voterAddress) {
    if (!this.contractWithSigner) {
      await this.initialize();
    }
    if (!this.contractWithSigner) {
      throw new Error('Blockchain admin signer or contract is not connected');
    }

    const tx = await this.contractWithSigner.authorizeVoter(voterAddress);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
    };
  }

  /**
   * Authorize multiple voters in batch on-chain
   */
  async authorizeVotersInBatch(voterAddresses) {
    if (!this.contractWithSigner) {
      await this.initialize();
    }
    if (!this.contractWithSigner) {
      throw new Error('Blockchain admin signer or contract is not connected');
    }

    const tx = await this.contractWithSigner.authorizeVotersInBatch(voterAddresses);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
    };
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
          const electionStatus = await this.contract.status();
          contractStatus = {
            deployed: true,
            address: this.contractAddress,
            admin,
            candidateCount: Number(candidateCount),
            totalVotes: Number(totalVotes),
            status: electionStatus === 0 ? 'NOT_STARTED' : (electionStatus === 1 ? 'ACTIVE' : 'ENDED'),
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
      await this.initialize();
    }
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
      await this.initialize();
    }
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
      await this.initialize();
    }
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
      confirmations: tx.blockNumber ? (await this.provider.getBlockNumber()) - tx.blockNumber + 1 : 0,
    };
  }
}

module.exports = new BlockchainService();
