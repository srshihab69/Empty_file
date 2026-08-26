const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    `👋 Welcome! Ekhon apni jekono Custom Emoji ba Sticker pathan, ami sathe sathe tar ID ber kore dibo!`, 
    { parse_mode: 'Markdown' }
  );
});

bot.on('message', async (ctx) => {
  try {
    const message = ctx.message;
    let found = false;

    // 1. Check custom emoji in text
    const entities = message.entities || message.caption_entities;
    if (entities && entities.length > 0) {
      for (const entity of entities) {
        if (entity.type === 'custom_emoji') {
          found = true;
          await ctx.reply(`✨ **Custom Emoji ID:**\n\`${entity.custom_emoji_id}\``, { 
            parse_mode: 'Markdown' 
          });
        }
      }
    }

    // 2. Check if it's sent as a Sticker (jodi sticker pack-er moto hoy)
    if (message.sticker) {
      found = true;
      await ctx.reply(`📦 **Sticker File ID:**\n\`${message.sticker.file_id}\`\n\n*(Sticker Unique ID: \`${message.sticker.file_unique_id}\`)*`, { 
        parse_mode: 'Markdown' 
      });
    }

    // 3. Jodi kisu-i na mile
    if (!found) {
      await ctx.reply(`⚠️ Eta normal emoji ba ekhane kono custom emoji ID paoni. Ektu thikvave custom emoji ba sticker pathiye abar try korun!`);
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply('Kono ekta error hoyeche.');
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(200).send('Telegram Bot is running!');
  }
};
