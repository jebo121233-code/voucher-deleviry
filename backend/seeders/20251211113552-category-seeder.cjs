'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('category', [
      {
        name: 'clothes',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'courses',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'makeup and accessories',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'optics and glasses',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'gym',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'perfumes',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'clinics',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('category', null, {});
  }
};