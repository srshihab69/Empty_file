const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(`👋 Debug mode on! Ekhon apnar oi emoji ba sticker guli pathan, bot tar raw data (JSON) dekhiye debe.`);
});

bot.on('message', async (ctx) => {
  try {
    // Telegram theke je message-ti asche, tar shob data JSON format-e convert korbe
    const rawData = JSON.stringify(ctx.message, null, 2);
    
    // Telegram message length 4096 character-er beshi hole kete choto kore dibe
    if (rawData.length > 4000) {
      await ctx.reply(`Message data onek boro! Message type: ${Object.keys(ctx.message).join(', ')}`);
    } else {
      await ctx.reply(`🔍 **Raw Message Data:**\n\`\`\`json\n${rawData}\n\`\`\`, { 
        parse_mode: 'Markdown' 
      });
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply(`Error: ${error.message}`);
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
