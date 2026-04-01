const { NewMessage } = require('telegram/events');
const { GRUPO_ID } = require('../utils/config');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const upload = multer({ storage: multer.memoryStorage() });

const telegramFacial = (app, client) => {
  app.post('/facial', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere una imagen',
        });
      }

      const buffer = req.file.buffer;
      const fileName = req.file.originalname || 'facial.jpg';

      const tmpPath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tmpPath, buffer);

      const sent = await client.sendFile(GRUPO_ID, {
        file: tmpPath,
        caption: '/facial',
        forceDocument: false,
      });

      fs.unlinkSync(tmpPath);

      const respuesta = await esperarRespuestaFacial(client, sent.id, 60000);

      if (!respuesta.success) {
        return res.status(422).json({ success: false, error: respuesta.error });
      }

      res.json({ success: true, pdf: respuesta.pdf, fileName: respuesta.fileName });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const esperarRespuestaFacial = (client, mensajeEnviadoId, timeout = 60000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      reject(new Error('Timeout FACIAL: sin respuesta en el tiempo esperado'));
    }, timeout);

    const handler = async (event) => {
      const msg = event.message;
      if (msg.id === mensajeEnviadoId) return;
      if (msg.replyTo?.replyToMsgId !== mensajeEnviadoId) return;

      const msgText = msg.message || msg.text || '';

      if (msgText.includes('CONSULTANDO')) return;

      if (!msgText.includes('Análisis Finalizado') && !msgText.includes('ERROR DE SISTEMA')) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));

      if (msgText.includes('ERROR DE SISTEMA')) {
        return resolve({ success: false, error: msgText });
      }

      if (msg.media) {
        const pdfBuffer = await client.downloadMedia(msg.media);
        const fileName = msg.file?.name || 'reporte_facial.pdf';
        resolve({ success: true, pdf: pdfBuffer.toString('base64'), fileName });
      } else {
        resolve({ success: true, pdf: null, fileName: null });
      }
    };

    client.addEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
  });
};

module.exports = { telegramFacial };
