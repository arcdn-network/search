const express = require('express');
const { IS_DEV } = require('./utils/config');

// const { telegramGroups } = require('./utils/groups');
const { telegramReniec } = require('./commands/reniec');
const { telegramOsiptel } = require('./commands/osiptel');
const { telegramFacial } = require('./commands/facial');

const PORT = process.env.PORT || 3000;

const startServer = (client) => {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.get('/', (req, res) => res.json({ message: 'Welcome' }));

  telegramOsiptel(app, client);
  telegramReniec(app, client);
  telegramFacial(app, client);

  app.listen(PORT, () => {
    console.log(`[SERVER] Escuchando en el puerto: ${PORT} | ${IS_DEV ? 'DEV' : 'PROD'}`);
  });
};

module.exports = { startServer };
