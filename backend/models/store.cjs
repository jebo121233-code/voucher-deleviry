'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Store.hasMany(models.Voucher, {
        foreignKey: "storeId",
        as: "vouchers",
      });

      Store.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
      });
    }
  }
  Store.init({
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

    phone: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    address: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    owner: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    images: {
      type: DataTypes.JSON,
      allowNull: true,
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
    modelName: 'Store',
    timestamps: true,
  });
  return Store;
};