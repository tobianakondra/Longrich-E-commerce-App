/**
 * Configuration Jest pour les tests de règles de sécurité Firebase
 */

module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/security/**/*.test.js'],
    verbose: true,
    testTimeout: 10000, // Augmenter le timeout pour les tests Firebase
    transform: {},
};