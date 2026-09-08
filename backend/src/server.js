const app = require('./app');
const config = require('./config/config');
const { initDatabase } = require('./models');
const blockchainService = require('./services/blockchainService');

const startServer = async () => {
  try {
    console.log('🚀 Starting Backend Server...');
    console.log('---------------------------------');

    // 1. Initialize Database
    console.log('⏳ Initializing database...');
    await initDatabase();

    // 2. Initialize Blockchain Service
    console.log('⏳ Connecting to blockchain...');
    await blockchainService.initialize();

    // 3. Start Express HTTP Server
    const server = app.listen(config.port, () => {
      console.log('---------------------------------');
      console.log(`✅ Server running in ${config.nodeEnv} mode`);
      console.log(`📡 Listening on http://localhost:${config.port}`);
      console.log(`🔌 Database: SQLite (${config.database.storage})`);
      console.log(`⛓️  Blockchain RPC: ${config.blockchain.rpcUrl}`);
      console.log(`📄 Contract: ${config.blockchain.contractAddress || 'Not set'}`);
      console.log('---------------------------------');
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
