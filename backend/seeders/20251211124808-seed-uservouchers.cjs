'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert('uservouchers', 
      [
        {
          userId: 1,
          voucherId: 1,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 2,
          voucherId: 1,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 1,
          voucherId: 2,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 2,
          voucherId: 3,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 1,
          voucherId: 6,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 3,
          voucherId: 1,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 1,
          voucherId: 4,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 10,
          voucherId: 2,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 9,
          voucherId: 4,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          userId: 10,
          voucherId: 2,
          createdAt: new Date(),
          updatedAt: null,
        },
        {
          userId: 1,
          voucherId: 6,
          createdAt: new Date(),
          updatedAt: null,
        },
      ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete('uservouchers', null, {});
  }
};
