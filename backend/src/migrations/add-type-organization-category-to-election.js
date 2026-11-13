'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('elections', 'type', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('elections', 'organization', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('elections', 'category', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('elections', 'type');
    await queryInterface.removeColumn('elections', 'organization');
    await queryInterface.removeColumn('elections', 'category');
  }
};