const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Logger } = require('telegram/extensions');

const createClient = (apiId, apiHash, session) => {
  if (!apiId || !apiHash || !session) {
    throw new Error(`Faltan variables para el cliente ${apiId}`);
  }
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger('error'),
  });
};

const client1 = createClient(
  Number(process.env.TELEGRAM_API_ID_1),
  process.env.TELEGRAM_API_HASH_1,
  process.env.TELEGRAM_SESSION_1,
);

const client2 = createClient(
  Number(process.env.TELEGRAM_API_ID_2),
  process.env.TELEGRAM_API_HASH_2,
  process.env.TELEGRAM_SESSION_2,
);

module.exports = { client1, client2 };
