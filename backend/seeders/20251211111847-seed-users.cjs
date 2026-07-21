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

    await queryInterface.bulkInsert('users', 
      [
        {
          name: "Mfoo",
          phone: '+2111111111111',
          email: "foo@gmail.com",
          password: "hoksha@123",
          age: 20,
          gender: "male",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Fbar",
          phone: '+2111111111112',
          email: "bar@gmail.com",
          password: "bar@123",
          age: 21,
          gender: "female",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Fxyz",
          phone: '+2111111111113',
          email: "xyz@gmail.com",
          password: "xyz@123",
          age: 18,
          gender: "female",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Mscar",
          phone: '+2111111111114',
          email: "scar@gmail.com",
          password: "scar@123",
          age: 25,
          gender: "male",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Mnemo",
          phone: '+2111111111115',
          email: "nemo@gmail.com",
          password: "nemo@123",
          age: 29,
          gender: "male",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Fdory",
          phone: '+2111111111116',
          email: "dory@gmail.com",
          password: "dory@123",
          age: 15,
          gender: "female",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Fdora",
          phone: '+2111111111117',
          email: "dora@gmail.com",
          password: "dora@123",
          age: 30,
          gender: "female",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Mmared",
          phone: '+2111111111118',
          email: "mared@gmail.com",
          password: "mared@123",
          age: 24,
          gender: "male",
          createdAt: new Date(),
          updatedAt: null,
        },

        {
          name: "Mhoksha",
          phone: '+2111111111119',
          email: "hoksha@gmail.com",
          password: "hoksha@123",
          age: 40,
          gender: "male",
          createdAt: new Date(),
          updatedAt: null,
        },
        
        {
          name: "Fsara",
          phone: '+2111111111120',
          email: "sara@gmail.com",
          password: "sara@123",
          age: 32,
          gender: "female",
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

    await queryInterface.bulkDelete('users', null, {});
  }
};
