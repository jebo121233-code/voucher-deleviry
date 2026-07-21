'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserVoucher = sequelize.define(
    'UserVoucher',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      voucherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      tableName: 'uservouchers',
      timestamps: false
    }
  );

  return UserVoucher;
};