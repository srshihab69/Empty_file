const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Main Keyboard Structure
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

// Webhook handling - Optimized for Vercel Serverless
app.post(`/api/webhook`, async (req, res) => {
    try {
        const msg = req.body.message;
        if (!msg) return res.sendStatus(200);

        const chatId = msg.chat.id;

        // 1. /start command (Perfect Pic Style)
        if (msg.text === '/start') {
            const name = msg.from.first_name;
            const welcomeText = `<blockquote>👋 Hello, ${name}! ❞</blockquote>\n\n` +
                                `<blockquote>Welcome to <b>ID Checker Bot</b>. Use the buttons below to get information about any user.</blockquote>`;
            
            await bot.sendMessage(chatId, welcomeText, mainKeyboard);
        }

        // 2. User Info Logic (Shared User Response - Pic Style)
        else if (msg.user_shared) {
            const userId = msg.user_shared.user_id;
            const header = `<blockquote>🔍 Shared User Info</blockquote>\n\n`;
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
                details = `<blockquote>` +
                          `🆔 ID: <code>${userId}</code>\n` +
                          `👤 Name: <code>Unknown</code>\n` +
                          `🏷️ Username: <code>N/A</code>` +
                          `</blockquote>`;
            }
            await bot.sendMessage(chatId, header + details, { parse_mode: 'HTML', reply_markup: inlineBtn });
        }

        // 3. My Info Logic (Pic Style)
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

        // 4. Support Logic (Updated with New Button)
        else if (msg.text === '☎️ Support') {
            const supportText = `<blockquote>🛡️ Need help or found a bug?</blockquote>\n\n` +
                                `<blockquote>⚡ Contact my developer: <b>@srshihab69</b></blockquote>`;
            const supportBtn = {
                inline_keyboard: [
                    [
                        { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
                    ],
                    [
                        { text: '🤖 Get Any ID Finder Bot', url: 'https://t.me/AnyIDFinderBot' }
                    ]
                ]
            };
            await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
        }

    } catch (err) {
        console.error("Vercel Webhook Error:", err);
    }

    // Response to Vercel
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ID Checker Bot is Active`));
