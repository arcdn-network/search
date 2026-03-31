const { client } = require('./client');

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

module.exports = { telegramTest };
