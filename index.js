require('dotenv').config({ quiet: true });
const { client1, client2 } = require('./utils/client');
const { IS_DEV } = require('./utils/config');
const { startServer } = require('./api');

const clientUser = IS_DEV ? client1 : client2;
const clientName = IS_DEV ? 'CLIENT1' : 'CLIENT2';

async function connectClient(client, name) {
  await client.connect();
  const m = await client.getMe();
  console.log(`[${name}] Conectado como: ${m.username || m.id}`);
}

async function bootstrap() {
  try {
    await connectClient(clientUser, clientName);
    startServer(clientUser);
  } catch (error) {
    console.error('[APP] Error al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
