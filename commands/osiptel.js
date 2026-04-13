const { NewMessage } = require('telegram/events');
const { GRUPO_ID } = require('../utils/config');
const CMDS_VALIDOS = ['telp', 'serum', 'op', 'claro', 'movistar', 'bitel'];

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

      const sent = await client.sendMessage(GRUPO_ID, {
        message: `/${cmd} ${telefono}`,
      });

      const texto = await esperarRespuesta(client, sent.id, 20000);

      // 🔥 NUEVO: parseo completo
      const titular = parsearRespuesta(texto);

      res.json({
        success: true,
        telefono,
        titular,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const esperarRespuesta = (client, mensajeEnviadoId, timeout = 20000, ventana = 3000) => {
  return new Promise((resolve, reject) => {
    const respuestas = [];
    let ventanaTimer = null;

    const timer = setTimeout(() => {
      clearTimeout(ventanaTimer);
      client.removeEventHandler(handler);
      reject(new Error('Timeout: sin respuesta en el tiempo esperado'));
    }, timeout);

    const resolverConMejor = () => {
      clearTimeout(timer);
      client.removeEventHandler(handler);
      const mejor = respuestas.sort((a, b) => b.fecha - a.fecha)[0];
      resolve(mejor.texto);
    };

    const handler = async (event) => {
      const msg = event.message;
      if (msg.id === mensajeEnviadoId) return;
      if (msg.replyTo?.replyToMsgId !== mensajeEnviadoId) return;

      const msgText = msg.text || msg.message || '';

      // 🔥 NUEVO: incluye "Sin Resultados"
      const esRespuestaFinal =
        msgText.includes('OSIPTEL ONLINE') ||
        msgText.includes('CLARO ONLINE') ||
        msgText.includes('TITULAR') ||
        msgText.includes('Sin Resultados') ||
        msgText.includes('No se hallaron');

      if (!esRespuestaFinal) return;

      respuestas.push({
        texto: msgText,
        fecha: new Date(),
      });

      clearTimeout(ventanaTimer);
      ventanaTimer = setTimeout(resolverConMejor, ventana);
    };

    client.addEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
  });
};

const toTitleCase = (str) => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const parsearRespuesta = (texto) => {
  if (!texto || typeof texto !== 'string') return null;
  if (texto.includes('Sin Resultados')) return null;

  const limpio = texto.replace(/\*\*|`/g, '');
  const linea = limpio.split('\n').find((l) => l.toUpperCase().includes('TITULAR'));

  if (!linea) return null;

  const titular = linea.split(/➣|➾|:/)[1]?.trim();

  return titular ? toTitleCase(titular) : null;
};

module.exports = { telegramOsiptel };
