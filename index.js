require('dotenv').config({ quiet: true });
const { client } = require('./utils/client');
const { startServer } = require('./api');

async function bootstrap() {
  try {
    await client.connect();

    const me2 = await client.getMe();

    console.log(`[CLIENT] Conectado como: ${me2.username || me2.id}`);

    startServer();
  } catch (error) {
    console.error('[APP] Error al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
