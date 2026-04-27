const CerebrasService = require("./cerebras");

// Singleton instance shared across the app
const cerebrasService = new CerebrasService();

module.exports = {
  CerebrasService,
  cerebrasService,
};
