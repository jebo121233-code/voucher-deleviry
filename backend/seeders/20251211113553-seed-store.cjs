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

    await queryInterface.bulkInsert('stores', 
      [
        {
          name: "adidas",
          category_id: 1,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "nike",
          category_id: 2,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "puma",
          category_id: 3,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "bata",
          category_id: 2,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "gucci",
          category_id: 1,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },
        {
          name: "wakiki",
          category_id: 3,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },
        {
          name: "zara",
          category_id: 4,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },
        {
          name: "or",
          category_id: 4,
          phone: JSON.stringify(["+201111111411", "+201111111412", "+201111111413"]),
          owner: JSON.stringify([
            { name: "Ahmed", role: "Manager" },
            { name: "Sara", role: "Co-owner" }
          ]),
          address: JSON.stringify(["address1", "address2"]),
          createdAt: new Date(),
          updatedAt: null,
        },
      ]
    )
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete('stores', null, {});
  }
};
