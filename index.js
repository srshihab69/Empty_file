const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Webhook setup for Vercel
app.post(`/api/webhook`, async (req, res) => {
    try {
        await bot.processUpdate(req.body);
    } catch (e) {
        console.error(e);
    }
    res.status(200).send('ok');
});

// Main Keyboard
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

// Start Command
bot.onText(/\/start/, (msg) => {
    const name = msg.from.first_name;
    const welcomeText = `<b>Hello ${name}!</b>\n` +
                        `Welcome to Information Extractor bot. Select a button below to start.`;
    bot.sendMessage(msg.chat.id, welcomeText, mainKeyboard);
});

// Listener
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1. User Info Logic
    if (msg.user_shared) {
        const userId = msg.user_shared.user_id;
        const isBot = msg.user_shared.request_id === 102; // Just in case you add bot info later

        let header = `<blockquote>🔍 Shared User Info ❞</blockquote>\n\n`;
        let details = "";
        let inlineBtn = null;

        try {
            const user = await bot.getChat(userId);
            
            details = `<blockquote>` +
                      `🆔 ID: <code>${user.id}</code>\n` +
                      `👤 Name: <code>${user.first_name || ''} ${user.last_name || ''}</code>\n` +
                      `🏷️ Username: <code>${user.username ? '@' + user.username : 'No username'}</code>\n` +
                      `⭐ Premium: ${user.is_premium ? '✅ Yes' : '❌ No'}` +
                      `</blockquote>`;

            inlineBtn = {
                inline_keyboard: [[
                    { text: '💬 Send Message', url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` }
                ]]
            };

        } catch (e) {
            // If details cannot be fetched, only show ID
            details = `<blockquote>` +
                      `🆔 ID: <code>${userId}</code>\n` +
                      `👤 Name: <code>Unknown</code>\n` +
                      `🏷️ Username: <code>N/A</code>` +
                      `</blockquote>`;
        }

        await bot.sendMessage(chatId, header + details, { 
            parse_mode: 'HTML', 
            reply_markup: inlineBtn 
        });
    }

    // 2. My Info Logic (Screenshot style)
    else if (msg.text === '🆔 My Info') {
        const u = msg.from;
        const header = `<blockquote>🆔 Your ID Information ❞</blockquote>\n\n`;
        const details = `<blockquote>` +
                        `🆔 User ID: <code>${u.id}</code>\n` +
                        `👤 Name: <code>${u.first_name} ${u.last_name || ''}</code>\n` +
                        `🏷️ Username: <code>${u.username ? '@' + u.username : 'No username'}</code>\n` +
                        `⭐ Premium: ${u.is_premium ? '✅ Yes' : '❌ No'}` +
                        `</blockquote>`;
        
        await bot.sendMessage(chatId, header + details, { parse_mode: 'HTML' });
    }

    // 3. Support Logic
    else if (msg.text === '☎️ Support') {
        const supportText = `<blockquote>🛡️ Need help or found a bug? ❞</blockquote>\n\n` +
                            `<blockquote>⚡ Contact my developer: <b>@srshihab69</b></blockquote>`;
        const supportBtn = {
            inline_keyboard: [[
                { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
            ]]
        };
        await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
