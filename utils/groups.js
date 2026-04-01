const telegramGroups = (app, client) => {
  app.get('/telegram/grupos', async (req, res) => {
    try {
      const dialogs = await client.getDialogs();
      const grupos = dialogs.map((d) => ({
        title: d.title,
        id: d.id?.toString(),
      }));
      res.json({ success: true, data: grupos });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

module.exports = { telegramGroups };
