const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Webhook handling - Optimized for Vercel
app.post(`/api/webhook`, (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).send('ok'); // সাথে সাথে রেসপন্স পাঠিয়ে কানেকশন ধরে রাখা
});

// Main Menu Keyboard
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '👤 User Info', request_users: { request_id: 101, user_is_bot: false } }],
            [{ text: '🆔 My Info' }, { text: '☎️ Support' }]
        ],
        resize_keyboard: true
    },
    parse_mode: 'HTML'
};

// Start Command Logic
bot.onText(/\/start/, (msg) => {
    const name = msg.from.first_name;
    // Header bold, body unbold as requested
    const welcomeText = `<b>Hello ${name}!</b>\n` +
                        `Welcome to Information Extractor bot. Select a button below to start.`;
    
    bot.sendMessage(msg.chat.id, welcomeText, mainKeyboard);
});

// Listener for all actions
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1. User Info (When user is selected)
    if (msg.user_shared) {
        const userId = msg.user_shared.user_id;

        try {
            // Attempt to fetch user details
            const user = await bot.getChat(userId);
            
            let details = `👤 <b>Full Name:</b> ${user.first_name || ''} ${user.last_name || ''}\n` +
                          `⚡ <b>Username:</b> ${user.username ? '@' + user.username : 'N/A'}\n` +
                          `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                          `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}`;

            const inlineBtn = {
                inline_keyboard: [[
                    { text: '💬 Send Message', url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` }
                ]]
            };

            await bot.sendMessage(chatId, details, { parse_mode: 'HTML', reply_markup: inlineBtn });

        } catch (e) {
            // If the bot doesn't know the user (fallback logic)
            await bot.sendMessage(chatId, `🔍 <b>Searching User Info</b>\n🆔 <b>ID:</b> <code>${userId}</code>`, { parse_mode: 'HTML' });
        }
    }

    // 2. My Info
    else if (msg.text === '🆔 My Info') {
        const u = msg.from;
        const myInfo = `⭐ <b>Your Information</b> ⭐\n\n` +
                       `👤 <b>Full Name:</b> ${u.first_name} ${u.last_name || ''}\n` +
                       `⚡ <b>Username:</b> @${u.username || 'N/A'}\n` +
                       `🆔 <b>ID:</b> <code>${u.id}</code>\n` +
                       `💎 <b>Premium:</b> ${u.is_premium ? 'Yes' : 'No'}\n` +
                       `📞 <b>Phone:</b> Private\n` +
                       `📝 <b>Bio:</b> Check Profile Settings`;
        
        await bot.sendMessage(chatId, myInfo, { parse_mode: 'HTML' });
    }

    // 3. Support
    else if (msg.text === '☎️ Support') {
        const supportText = `🛡️ <b>Need help or found a bug?</b>\n\n⚡ <b>Contact my developer:</b>`;
        const supportBtn = {
            inline_keyboard: [[
                { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
            ]]
        };
        await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
    }
});

// Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
