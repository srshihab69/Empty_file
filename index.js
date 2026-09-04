const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
// Polling বন্ধ রেখে শুধুমাত্র Webhook মোডে চলবে
const bot = new TelegramBot(token, { polling: false });

const app = express();
app.use(bodyParser.json());

// Webhook endpoint with async handling
app.post(`/api/webhook`, async (req, res) => {
    try {
        // বোটের আপডেটটি প্রসেস হওয়া পর্যন্ত অপেক্ষা করবে
        await bot.processUpdate(req.body);
    } catch (err) {
        console.error("Update processing error:", err);
    }
    res.sendStatus(200);
});

// Helper for Start Layout
const startKeyboard = {
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
    const welcomeText = `⭐ <b>Welcome to Information Extractor</b> ⭐\n\n` +
                        `⚡ <b>Please select an option from the menu below:</b>`;
    bot.sendMessage(msg.chat.id, welcomeText, startKeyboard);
});

// Main Message Listener
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1. Handling Selected User
    if (msg.user_shared) {
        const sharedUserId = msg.user_shared.user_id;

        try {
            // Attempting to fetch details
            const user = await bot.getChat(sharedUserId);
            
            // If the bot knows the user (Name and ID will exist)
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

        } catch (error) {
            // If the bot doesn't know the user, ONLY show ID and Searching text
            await bot.sendMessage(chatId, `🔍 <b>Searching User Info</b>\n🆔 <b>ID:</b> <code>${sharedUserId}</code>`, { parse_mode: 'HTML' });
        }
        return; // Stop further execution for this update
    }

    // 2. My Info Button
    if (msg.text === '🆔 My Info') {
        const u = msg.from;
        const myDetails = `⭐ <b>Your Premium Information</b> ⭐\n\n` +
                          `👤 <b>Full Name:</b> ${u.first_name} ${u.last_name || ''}\n` +
                          `⚡ <b>Username:</b> @${u.username || 'N/A'}\n` +
                          `🆔 <b>ID:</b> <code>${u.id}</code>\n` +
                          `💎 <b>Premium:</b> ${u.is_premium ? 'Yes' : 'No'}\n` +
                          `📞 <b>Phone:</b> Private\n` +
                          `📝 <b>Bio:</b> Check Settings`;
        
        await bot.sendMessage(chatId, myDetails, { parse_mode: 'HTML' });
    }

    // 3. Support Button
    if (msg.text === '☎️ Support') {
        const supportText = `🛡️ <b>Need assistance?</b>\n\n⚡ <b>Click the button below to contact development:</b>`;
        const supportBtn = {
            inline_keyboard: [[
                { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
            ]]
        };
        await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
    }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot Server Active on ${PORT}`);
});
