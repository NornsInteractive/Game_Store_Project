const { createServer } = require('../app');

module.exports = async (req, res) => {
  const { app } = await createServer();
  return app(req, res);
};
