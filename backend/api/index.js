// Import the compiled Express app from dist
const app = require('../dist/src/app').default;

// Export for Vercel serverless
module.exports = app;
