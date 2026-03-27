const express = require('express');
const { client } = require('./utils/client');

const PORT = process.env.PORT || 3000;
const GRUPO_PROD = '-1003422780175';

const GRUPO_ID = GRUPO_PROD;

// --- ROUTES ---
const welcomeRoutes = (app) => {
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome' });
  });
};

const telegramTest = (app) => {
  app.get('/telegram/grupos', async (req, res) => {
    const dialogs = await client.getDialogs();
    const grupos = dialogs.map((d) => ({
      title: d.title,
      id: d.id?.toString(),
    }));
    res.json(grupos);
  });

  app.post('/telegram/test', async (req, res) => {
    try {
      const { message } = req.body;
      await client.sendMessage(GRUPO_ID, { message });
      res.json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (error) {
      console.error('[TELEGRAM ERROR]', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const telegramReniec = (app) => {
  app.get('/reniec/:dni', async (req, res) => {
    try {
      const { dni } = req.params;

      if (!/^\d{8,}$/.test(dni)) {
        return res.status(400).json({
          success: false,
          error: 'DNI inválido. Debe tener mínimo 8 dígitos',
        });
      }

      const sent = await client.sendMessage(GRUPO_ID, {
        message: `/dni ${dni}`,
      });

      const respuesta = await esperarRespuestaReniec(sent.id, 20000);
      const parsed = parseReniec(respuesta.text || '');

      const imagen = await client.downloadMedia(respuesta.media);

      res.json({
        success: true,
        data: parsed,
        image: imagen.toString('base64'),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const telegramOsiptel = (app) => {
  app.get('/osiptel/:cmd/:telefono', async (req, res) => {
    try {
      const { cmd, telefono } = req.params;

      const CMDS_VALIDOS = ['telx', 'serum', 'op', 'claro', 'movistar', 'bitel'];

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

      const texto = await esperarRespuesta(sent.id, 15000);
      const titular = extraerNombre(texto);

      res.json({ success: true, telefono, titular });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

// ✅ Osiptel — retorna solo texto
const esperarRespuesta = (mensajeEnviadoId, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const { NewMessage } = require('telegram/events');

    const timer = setTimeout(() => {
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      reject(new Error('Timeout: sin respuesta en el tiempo esperado'));
    }, timeout);

    const handler = async (event) => {
      const msg = event.message;
      if (msg.id === mensajeEnviadoId) return;

      const msgText = msg.text || msg.message || ''; // ✅ seguro

      const esRespuestaFinal =
        msgText.includes('Titular') ||
        msgText.includes('Nombre') ||
        msgText.includes('No se hallaron datos') ||
        msgText.includes('No se hallaron coincidencias');

      if (!esRespuestaFinal) return;

      clearTimeout(timer);
      client.removeEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
      resolve(msgText); // ✅ solo texto
    };

    client.addEventHandler(handler, new NewMessage({ chats: [GRUPO_ID] }));
  });
};

// ✅ Reniec — retorna { text, media } ambos obligatorios
const esperarRespuestaReniec = (mensajeEnviadoId, timeout = 20000) => {
  return new Promise((resolve, reject) => {
    const { NewMessage } = require('telegram/events');

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

const extraerNombre = (texto) => {
  if (!texto || typeof texto !== 'string') return null;
  if (texto.includes('No se hallaron datos')) return null;
  const matches = [...texto.matchAll(/`([^`]+)`/g)];
  const nombre = matches.find((m) => /^[A-ZÁÉÍÓÚÑ\s]+$/i.test(m[1].trim()));
  return nombre ? nombre[1].trim() : null;
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
    familia: {
      padre: get('PADRE'),
      madre: get('MADRE'),
    },
  };
}

// --- SERVER ---
const startServer = () => {
  const app = express();
  app.use(express.json());

  welcomeRoutes(app);
  telegramTest(app);
  telegramOsiptel(app);
  telegramReniec(app);

  app.listen(PORT, () => {
    console.log(`[SERVER] Escuchando en el puerto: ${PORT}`);
  });
};

module.exports = { startServer };
