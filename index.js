const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Webhook setup for Vercel
app.post(`/api/webhook`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Start Command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `✨ <b>Welcome to Information Extractor</b> ✨\n\n` +
                        `⭐ <b>Please select an option from the menu below:</b>`;

    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: [
                [
                    { text: '👤 User Info', request_users: { request_id: 101, user_is_bot: false } }
                ],
                [
                    { text: '🆔 My Info' },
                    { text: '☎️ Support' }
                ]
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(chatId, welcomeText, opts);
});

// Message Listener
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1. User Info Logic
    if (msg.user_shared) {
        const sharedUserId = msg.user_shared.user_id;

        try {
            // Check if user has started the bot/is accessible
            const user = await bot.getChat(sharedUserId);
            
            // If success: Show all details
            let response = `👤 <b>Full Name:</b> ${user.first_name || ''} ${user.last_name || ''}\n` +
                           `⚡ <b>Username:</b> ${user.username ? '@' + user.username : 'N/A'}\n` +
                           `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                           `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}`;

            const inlineBtn = {
                inline_keyboard: [[
                    { text: '💬 Send Message', url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` }
                ]]
            };

            bot.sendMessage(chatId, response, { parse_mode: 'HTML', reply_markup: inlineBtn });

        } catch (error) {
            // If user never started the bot: Show ONLY ID and specific text
            bot.sendMessage(chatId, `🔍 <b>Searching User Info</b>\n🆔 <b>ID:</b> <code>${sharedUserId}</code>`, { parse_mode: 'HTML' });
        }
    }

    // 2. My Info Logic
    if (msg.text === '🆔 My Info') {
        const u = msg.from;
        // Note: Phone and Bio are only visible if privacy allows or shared
        const myInfo = `⭐ <b>Your Information</b> ⭐\n\n` +
                       `👤 <b>Full Name:</b> ${u.first_name} ${u.last_name || ''}\n` +
                       `⚡ <b>Username:</b> @${u.username || 'N/A'}\n` +
                       `🆔 <b>ID:</b> <code>${u.id}</code>\n` +
                       `💎 <b>Premium:</b> ${u.is_premium ? 'Yes' : 'No'}\n` +
                       `📞 <b>Phone:</b> Private\n` +
                       `📝 <b>Bio:</b> Check Profile`;
        
        bot.sendMessage(chatId, myInfo, { parse_mode: 'HTML' });
    }

    // 3. Support Button
    if (msg.text === '☎️ Support') {
        const supportText = `🛡️ <b>Need help or have questions?</b>\n\n⚡ <b>Contact my developer via the button below:</b>`;
        const supportBtn = {
            inline_keyboard: [[
                { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
            ]]
        };
        bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
    }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
