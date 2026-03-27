// generate-session.js
require('dotenv').config(); // <-- debe ser la primera línea
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

async function main() {
  const client = new TelegramClient(new StringSession(''), Number(33615582), '760395d00be4a67ee03c328d4db6bade', {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Teléfono: '),
    password: async () => await input.text('Contraseña 2FA (si tienes): '),
    phoneCode: async () => await input.text('Código recibido: '),
    onError: (err) => console.error(err),
  });

  console.log('SESSION_ID:', client.session.save());
  await client.disconnect();
}

main();
