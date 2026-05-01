const { createServer } = require('./app');

async function start() {
  const { app, port } = await createServer();

  app.listen(port, () => {
    console.log(`CYBERPULSE server online on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
