require('dotenv').config({ quiet: true });
const { client1, client2 } = require('./utils/client');
const { startServer } = require('./api');

async function bootstrap() {
  try {
    await client1.connect();
    await client2.connect();

    const me1 = await client1.getMe();
    const me2 = await client2.getMe();

    console.log(`[CLIENT 1] Conectado como: ${me1.username || me1.id}`);
    console.log(`[CLIENT 2] Conectado como: ${me2.username || me2.id}`);

    startServer();
  } catch (error) {
    console.error('[APP] Error al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
