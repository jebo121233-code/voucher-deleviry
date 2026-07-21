'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'category',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      phone: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },

      address: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },

      owner: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },

      images: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stores');
  }
};