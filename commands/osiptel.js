const { NewMessage } = require('telegram/events');
const { GRUPO_ID } = require('../utils/config');

const CMDS_VALIDOS = ['telx', 'serum', 'op', 'claro', 'movistar', 'bitel'];

const telegramOsiptel = (app, client) => {
  app.get('/osiptel/:cmd/:telefono', async (req, res) => {
    try {
      const { cmd, telefono } = req.params;

      if (!CMDS_VALIDOS.includes(cmd)) {
        return res.status(400).json({
          success: false,
          error: `Comando inválido. Usa: ${CMDS_VALIDOS.join(', ')}`,
        });
      }

      if (!/^9\d{8}$/.test(telefono)) {
        return res.status(400).json({
          success: false,
          error: 'Teléfono inválido. Debe tener 9 dígitos y empezar con 9',
        });
      }

      const sent = await client.sendMessage(GRUPO_ID, { message: `/${cmd} ${telefono}` });
      const texto = await esperarRespuesta(client, sent.id, 20000);
      const titular = extraerNombre(texto);

      res.json({ success: true, telefono, titular });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const esperarRespuesta = (client, mensajeEnviadoId, timeout = 20000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      reject(new Error('Timeout: sin respuesta en el tiempo esperado'));
    }, timeout);

    const handler = async (event) => {
      const msg = event.message;
      if (msg.id === mensajeEnviadoId) return;

      const msgText = msg.text || msg.message || '';

      const esRespuestaFinal =
        msgText.includes('Titular') ||
        msgText.includes('Nombre') ||
        msgText.includes('No se hallaron datos') ||
        msgText.includes('No se hallaron coincidencias');

      if (!esRespuestaFinal) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      resolve(msgText);
    };

    client.addEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
  });
};

const extraerNombre = (texto) => {
  if (!texto || typeof texto !== 'string') return null;
  if (texto.includes('No se hallaron datos')) return null;
  const matches = [...texto.matchAll(/`([^`]+)`/g)];
  const nombre = matches.find((m) => /^[A-ZÁÉÍÓÚÑ\s]+$/i.test(m[1].trim()));
  return nombre ? nombre[1].trim() : null;
};

module.exports = { telegramOsiptel };
