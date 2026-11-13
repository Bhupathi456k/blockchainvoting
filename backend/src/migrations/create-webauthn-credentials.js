/**
 * Migration: Create webauthn_credentials table
 *
 * Adds the table for storing WebAuthn / FIDO2 / Passkey credentials.
 * Supports multiple authenticators per user.
 * Stores only public cryptographic keys and metadata — NEVER raw biometrics.
 */
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('webauthn_credentials')) {
      await queryInterface.createTable('webauthn_credentials', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        credentialId: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        publicKey: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        counter: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        transports: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
        },
        deviceName: {
          type: DataTypes.STRING(200),
          allowNull: true,
          defaultValue: 'My device',
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('webauthn_credentials', ['userId']);
      await queryInterface.addIndex('webauthn_credentials', ['credentialId'], { unique: true });
      console.log('✓ Created webauthn_credentials table with indexes');
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('webauthn_credentials');
    console.log('✓ Dropped webauthn_credentials table');
  },
};
