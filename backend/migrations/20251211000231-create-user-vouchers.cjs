'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserVouchers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        allowNull: false
      },
      voucherId: {
        type: Sequelize.INTEGER,
        references: { model: "Vouchers", key: "id" },
        onDelete: "CASCADE",
        allowNull: false
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { allowNull: true, type: Sequelize.DATE, defaultValue: null },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserVouchers');
  }
};