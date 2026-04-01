const { NewMessage } = require('telegram/events');
const { GRUPO_ID } = require('../utils/config');

const telegramReniec = (app, client) => {
  app.get('/reniec/:dni', async (req, res) => {
    try {
      const { dni } = req.params;

      if (!/^\d{8,}$/.test(dni)) {
        return res.status(400).json({
          success: false,
          error: 'DNI inválido. Debe tener mínimo 8 dígitos',
        });
      }

      const sent = await client.sendMessage(GRUPO_ID, { message: `/dni ${dni}` });
      const respuesta = await esperarRespuestaReniec(client, sent.id, 20000);
      const parsed = parseReniec(respuesta.text || '');
      const imagen = await client.downloadMedia(respuesta.media);

      res.json({ success: true, data: parsed, image: imagen.toString('base64') });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const esperarRespuestaReniec = (client, mensajeEnviadoId, timeout = 20000) => {
  return new Promise((resolve, reject) => {
    let text = null;
    let media = null;

    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      reject(new Error('Timeout RENIEC: no se recibió imagen'));
    }, timeout);

    const handler = async (event) => {
      const msg = event.message;
      if (msg.id === mensajeEnviadoId) return;

      const msgText = msg.message || msg.text || '';

      const esLoading =
        msgText.includes('EXTRAYENDO') || msgText.includes('CONSULTANDO') || msgText.includes('PROCESANDO');

      if (esLoading) return;

      const esTextoReniec =
        msgText.includes('INFO PERSONAL') ||
        msgText.includes('DNI:') ||
        msgText.includes('NOMBRES') ||
        msgText.includes('No se hallaron');

      if (esTextoReniec) text = msgText;
      if (msg.media && text) media = msg.media;

      if (text && media) {
        clearTimeout(timer);
        client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
        resolve({ text, media });
      }
    };

    client.addEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
  });
};

function parseReniec(text) {
  const get = (label) => {
    const regex = new RegExp(`${label}:\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const dniFull = get('DNI');
  let dni = null;
  let digito = null;

  if (dniFull) {
    const parts = dniFull.split('-').map((s) => s.trim());
    dni = parts[0];
    digito = parts[1] || null;
  }

  return {
    dni,
    digito,
    edad: Number(get('EDAD')),
    sexo: get('SEXO'),
    nombres: get('NOMBRES'),
    apellidos: get('APELLIDOS'),
    infoPersonal: {
      estatura: get('ESTATURA'),
      restriccion: get('RESTRICCIÓN'),
      estadoCivil: get('ESTADO CIVIL'),
      emision: get('EMISIÓN'),
      caducidad: get('CADUCIDAD'),
      inscripcion: get('INSCRIPCIÓN'),
      gradoInstruccion: get('GRADO INST'),
    },
    nacimiento: {
      fecha: get('FECHA'),
      distrito: get('DISTRITO'),
      provincia: get('PROVINCIA'),
      departamento: get('DEP'),
    },
    direccion: {
      distrito: get('DISTRITO'),
      provincia: get('PROVINCIA'),
      departamento: get('DEP'),
      direccion: get('DIRECCIÓN'),
    },
    familia: { padre: get('PADRE'), madre: get('MADRE') },
  };
}

module.exports = { telegramReniec };
