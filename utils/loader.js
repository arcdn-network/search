const { telegramReniec } = require('../commands/reniec');
const { telegramOsiptel } = require('../commands/osiptel');
const { telegramFacial } = require('../commands/facial');

const commands = [telegramReniec, telegramOsiptel, telegramFacial];

const loadCommands = (app, client) => {
  commands.forEach((command) => command(app, client));
};

module.exports = { loadCommands };
