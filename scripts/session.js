const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const path = require('path');
const fs = require('fs');

function updateEnvFile(envPath, values) {
  let content = '';

  // Si ya existe el .env, leerlo
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }

  // Para cada clave, actualizar o agregar
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;

    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      content += `\n${line}`;
    }
  }

  fs.writeFileSync(envPath, content.trimStart(), 'utf-8');
}

async function main() {
  console.log('=== Generador de Sesión de Telegram ===\n');

  const apiIdStr = await input.text('Ingresa tu API ID: ');
  const apiHash = await input.text('Ingresa tu API Hash: ');
  const apiId = Number(apiIdStr);

  if (isNaN(apiId) || !apiHash) {
    console.error('API ID o API Hash inválidos.');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Teléfono (con código de país, ej: +51999999999): '),
    password: async () => await input.text('Contraseña 2FA (dejar vacío si no tienes): '),
    phoneCode: async () => await input.text('Código recibido por Telegram: '),
    onError: (err) => console.error('Error:', err),
  });

  const session = client.session.save();

  // Escribir en .env
  const envPath = path.resolve(__dirname, '.env');
  updateEnvFile(envPath, {
    TELEGRAM_API_ID: apiIdStr,
    TELEGRAM_API_HASH: apiHash,
    TELEGRAM_SESSION: session,
  });

  console.log('\n✅ Sesión generada y guardada en .env exitosamente');
  console.log(`📄 Archivo: ${envPath}`);

  await client.disconnect();
}

main();
