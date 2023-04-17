const { Client, GatewayIntentBits, Events } = require("discord.js");
const { createEmbedding, getAnswerForMessage } = require("./openai-gpt");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  console.log("HERH");
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "pong") {
    await interaction.reply("Pong!");
  }
});

client.on(Events.MessageCreate, async (message) => {
  let replyToMessage = false;
  if (message.author.bot) return;
  for (let user of message.mentions.users.values()) {
    if (user.username === "AppBot-test") {
      replyToMessage = true;
    }
  }

  if (!replyToMessage) return;

  let userQuery = message.content.replace(/<.*?>/g, "");
  let top3 = await createEmbedding(message.content);
  let replyMsg = await getAnswerForMessage(userQuery, top3);

  message.reply(replyMsg);
});

client.login(
  process.env.BOT_TOKEN,
);
