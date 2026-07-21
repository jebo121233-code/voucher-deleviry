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

    await queryInterface.bulkInsert('vouchers', 
      [
        {
          name: "de50",
          category_id: 1,
          description: "this is description",
          storeId: 1,
          percentage: 10,
          price: 50,
          discount: null,
          quantity: 10,
          min_val: 100,
          max_val: 300,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "de100",
          category_id: 2,
          description: "this is description",
          storeId: 1,
          percentage: null,
          price: 40,
          discount: 100,
          quantity: 30,
          min_val: 0,
          max_val: 200,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "adi20",
          category_id: 3,
          description: "this is description",
          storeId: 2,
          percentage: 20,
          price: 100,
          discount: null,
          quantity: 5,
          min_val: 0,
          max_val: 1000,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "hot200",
          category_id: 4,
          description: "this is description",
          storeId: 4,
          percentage: null,
          price: 100,
          discount: 200,
          quantity: 15,
          min_val: 100,
          max_val: 300,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "winter30",
          category_id: 3,
          description: "this is description",
          storeId: 1,
          percentage: 30,
          price: 50,
          discount: null,
          quantity: 10,
          min_val: 100,
          max_val: 300,
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "summer10",
          category_id: 2,
          description: "this is description",
          storeId: 1,
          percentage: 10,
          price: 50,
          discount: null,
          quantity: 10,
          min_val: 100,
          max_val: 300,
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

    await queryInterface.bulkDelete('vouchers', null, {});
  }
};
