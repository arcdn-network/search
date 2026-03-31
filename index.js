require('dotenv').config({ quiet: true });
const { client } = require('./utils/client');
const { startServer } = require('./api');

async function bootstrap() {
  try {
    await client.connect();

    const m = await client.getMe();
    console.log(`[CLIENT] Conectado como: ${m.username || m.id}`);

    startServer();
  } catch (error) {
    console.error('[APP] Error al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
