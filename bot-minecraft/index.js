require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events } = require('discord.js');
const Aternos = require('aternos-api');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// 1. Define ambos comandos slash
const commands = [
  new SlashCommandBuilder()
    .setName('star')
    .setDescription('Enciende el servidor de Aternos'),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Apaga el servidor de Aternos')
].map(command => command.toJSON());

// 2. Registra los comandos
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos (/) ...');
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log('Comandos registrados a nivel de servidor.');
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log('Comandos registrados globalmente.');
    }
  } catch (error) {
    console.error(error);
  }
})();

// 3. Lógica del bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
  console.log('¡Bot listo!');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Conexión y obtención del server de Aternos
  const getAternosServer = async () => {
    const at = new Aternos();
    await at.login(process.env.ATERNO_USER, process.env.ATERNO_PASS);
    await at.init();
    const servers = at.servers;
    if (servers.length === 0) throw new Error('No se encontró ningún servidor.');
    const server = servers[0];
    await server.fetch();
    return server;
  };

  if (interaction.commandName === 'star') {
    await interaction.reply('Encendiendo el servidor de Aternos...');
    try {
      const server = await getAternosServer();
      await server.start();
      await interaction.followUp('¡Servidor iniciando! Revisa la web de Aternos para ver el progreso.');
    } catch (err) {
      console.error(err);
      await interaction.followUp('Hubo un error encendiendo el servidor.');
    }
  } else if (interaction.commandName === 'stop') {
    await interaction.reply('Apagando el servidor de Aternos...');
    try {
      const server = await getAternosServer();
      await server.stop();
      await interaction.followUp('¡Servidor detenido!');
    } catch (err) {
      console.error(err);
      await interaction.followUp('Hubo un error apagando el servidor.');
    }
  }
});

client.login(DISCORD_TOKEN);