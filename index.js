require('dotenv').config({ quiet: true });
const express = require('express');

const { client1, client2 } = require('./utils/client');
const { IS_DEV, NAME, PORT } = require('./utils/config');
const { loadCommands } = require('./utils/loader');
const client = IS_DEV ? client1 : client2;

async function bootstrap() {
  try {
    await client.connect();
    const m = await client.getMe();
    console.log(`[${NAME}] Conectado como: ${m.username || m.id}`);

    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.get('/', (req, res) => res.json({ message: 'Welcome' }));

    loadCommands(app, client);

    app.listen(PORT || 3000, () => {
      console.log(`[SERVER] Escuchando en el puerto: ${PORT} | ${IS_DEV ? 'DEV' : 'PROD'}`);
    });
  } catch (error) {
    console.error('[APP] Error al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
