'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voucher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voucher.belongsToMany(models.User, {
        through: models.UserVoucher,
        foreignKey: "voucherId",
        otherKey: "userId",
        as: "users"
      });

      Voucher.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
      });

      Voucher.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: "store",
      });
    }
  }
  Voucher.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    percentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0, max: 100 },
    },

    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0 },
    },

    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },

    max_val: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { max: 10000000000 },
    },

    min_val: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0 },
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'Voucher',
  });
  return Voucher;
};