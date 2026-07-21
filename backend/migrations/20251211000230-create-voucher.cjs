'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vouchers', {
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

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

      storeId: {
        type: Sequelize.INTEGER,
        references: { model: "stores", key: "id" },
        onDelete: "CASCADE",
        allowNull: false,
      },

      percentage: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      discount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      max_val: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      min_val: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable('Vouchers');
  }
};