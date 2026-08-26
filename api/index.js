const { Telegraf } = require('telegraf');

// Environment variable theke bot token load korbe (Token gopon thakbe)
const bot = new Telegraf(process.env.BOT_TOKEN);

// Message ba caption theke custom emoji ID extract korar logic
bot.on('message', async (ctx) => {
  try {
    const message = ctx.message;
    // Message ba media caption-er entities check kora
    const entities = message.entities || message.caption_entities;
    
    if (entities && entities.length > 0) {
      for (const entity of entities) {
        if (entity.type === 'custom_emoji') {
          // Emoji-r unique ID ti reply kore dibe
          await ctx.reply(`Custom Emoji ID:\n\`${entity.custom_emoji_id}\``, { 
            parse_mode: 'Markdown' 
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Vercel Serverless Function handler (Webhook)
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
    res.status(200).send('Telegram Bot is running on Vercel!');
  }
};
