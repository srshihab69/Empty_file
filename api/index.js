const { Telegraf } = require('telegraf');

// Environment variable theke bot token load korbe
const bot = new Telegraf(process.env.BOT_TOKEN);

// 1. /start command ebong Keyboard Button add kora
bot.start(async (ctx) => {
  await ctx.reply(
    `👋 **Welcome!** Ei bot-er maddhome apni jekono Custom ba Animated Emoji-r Unique ID ber korte parben.\n\n👉 **Niyom:** Nicher button e click korun ba direct apnar custom emoji guli ei chat-e send korun!`, 
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '💡 Kivabe ID ber korbo?' }] // Keyboard button
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    }
  );
});

// 2. Keyboard button-er text handle korar jonno
bot.hears('💡 Kivabe ID ber korbo?', async (ctx) => {
  await ctx.reply(
    `Khub sohoj! 🎉\n\nApni je emoji ba sticker pack-er ID ber korte chan, shegula ekta ekta kore ei chat-e send ba forward korun. Ami sathe sathe tar **Custom Emoji ID** reply kore dibo.`
  );
});

// 3. Message ba caption theke custom emoji ID extract korar logic
bot.on('message', async (ctx) => {
  try {
    const message = ctx.message;
    // Message ba media caption-er entities check kora
    const entities = message.entities || message.caption_entities;
    
    if (entities && entities.length > 0) {
      for (const entity of entities) {
        if (entity.type === 'custom_emoji') {
          // Emoji-r unique ID ti reply kore dibe
          await ctx.reply(`✨ Custom Emoji ID:\n\`${entity.custom_emoji_id}\``, { 
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
