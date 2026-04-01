const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const path = require('path');
const fs = require('fs');

function readEnvFile(envPath) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const values = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    values[key.trim()] = rest.join('=').trim();
  }

  return values;
}

async function main() {
  console.log('=== Obtener Grupos de Telegram ===\n');

  let apiIdStr, apiHash, session;

  const envPath = path.resolve(__dirname, '.env');

  if (fs.existsSync(envPath)) {
    const useEnv = await input.confirm('Se detectó un .env ¿Deseas usar esas variables? (y/n): ');

    if (useEnv) {
      const envVars = readEnvFile(envPath);
      apiIdStr = envVars['TELEGRAM_API_ID'];
      apiHash = envVars['TELEGRAM_API_HASH'];
      session = envVars['TELEGRAM_SESSION'];
      console.log('\n✅ Variables cargadas desde .env\n');
    }
  }

  // Si no usó .env o no existe, pedir por input
  if (!apiIdStr) apiIdStr = await input.text('Ingresa tu API ID: ');
  if (!apiHash) apiHash = await input.text('Ingresa tu API Hash: ');
  if (!session) session = await input.text('Ingresa tu SESSION STRING: ');

  const apiId = Number(apiIdStr);

  if (isNaN(apiId) || !apiHash || !session) {
    console.error('Datos inválidos.');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  console.log('\n⏳ Obteniendo grupos...\n');

  const dialogs = await client.getDialogs();

  const grupos = dialogs
    .filter((d) => d.isGroup || d.isChannel)
    .map((d) => ({
      title: d.title,
      id: d.id?.toString(),
      type: d.isChannel ? 'canal' : 'grupo',
    }));

  const outputPath = path.resolve(__dirname, 'groups.json');
  fs.writeFileSync(outputPath, JSON.stringify(grupos, null, 2), 'utf-8');

  console.log(JSON.stringify(grupos, null, 2));
  console.log(`\n✅ Total encontrados: ${grupos.length}`);
  console.log(`📄 Guardado en: ${outputPath}`);

  await client.disconnect();
}

main();
