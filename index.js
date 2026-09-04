const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Main Handler function for Webhook
app.post(`/api/webhook`, async (req, res) => {
    try {
        const msg = req.body.message;
        if (!msg) return res.sendStatus(200);

        const chatId = msg.chat.id;

        // 1. Start Command
        if (msg.text === '/start') {
            const name = msg.from.first_name;
            const welcomeText = `<b>Hello ${name}!</b>\n` +
                                `Welcome to Information Extractor bot. Select a button below to start.`;
            
            await bot.sendMessage(chatId, welcomeText, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        [{ text: '👤 User Info', request_users: { request_id: 101, user_is_bot: false } }],
                        [{ text: '🆔 My Info' }, { text: '☎️ Support' }]
                    ],
                    resize_keyboard: true
                }
            });
        }

        // 2. User Info Logic (Selected User)
        else if (msg.user_shared) {
            const userId = msg.user_shared.user_id;
            try {
                // We await the chat details
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
                // If bot doesn't know the user, show search text + ID
                await bot.sendMessage(chatId, `🔍 <b>Searching User Info</b>\n🆔 <b>ID:</b> <code>${userId}</code>`, { parse_mode: 'HTML' });
            }
        }

        // 3. My Info Logic
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

        // 4. Support Logic
        else if (msg.text === '☎️ Support') {
            const supportText = `🛡️ <b>Need help or found a bug?</b>\n\n⚡ <b>Contact my developer:</b>`;
            const supportBtn = {
                inline_keyboard: [[
                    { text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }
                ]]
            };
            await bot.sendMessage(chatId, supportText, { parse_mode: 'HTML', reply_markup: supportBtn });
        }

        // কাজ শেষ হলে রেসপন্স পাঠাবে
        res.status(200).send('ok');

    } catch (error) {
        console.error("Error processing update:", error);
        res.sendStatus(200); // এরর হলেও রেসপন্স দিবে যাতে টেলিগ্রাম বারবার আপডেট না পাঠায়
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`)); 
