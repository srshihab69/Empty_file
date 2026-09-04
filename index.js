const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);
const app = express();
app.use(bodyParser.json());

app.post(`/api/webhook`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: [
                [
                    { text: '👤 User Info', request_users: { request_id: 101, user_is_bot: false } },
                    { text: '🤖 Bot Info', request_users: { request_id: 102, user_is_bot: true } }
                ],
                [
                    { text: '👥 Group Info', request_chat: { request_id: 103, chat_is_channel: false } },
                    { text: '📢 Channel Info', request_chat: { request_id: 104, chat_is_channel: true } }
                ],
                [{ text: '🆔 My Info' }]
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(msg.chat.id, "<b>🌟 Information Finder Bot 🌟</b>\nSelect an option below:", opts);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Handling User/Bot selection
    if (msg.user_shared) {
        const uid = msg.user_shared.user_id;
        try {
            // we try to get info from getChat
            const user = await bot.getChat(uid);
            let text = `<b>✨ ${msg.user_shared.request_id === 102 ? 'Bot' : 'User'} Details</b>\n\n` +
                       `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                       `📛 <b>Name:</b> ${user.first_name} ${user.last_name || ''}\n` +
                       `🔗 <b>Username:</b> ${user.username ? '@'+user.username : 'None'}\n` +
                       `📝 <b>Bio:</b> ${user.bio || 'Not set'}\n` +
                       `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}`;

            bot.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: "🔗 Open Profile", url: `t.me/` + (user.username || `user?id=${user.id}`) }]]
                }
            });
        } catch (e) {
            bot.sendMessage(chatId, `<b>Limited Info (Privacy On):</b>\n🆔 ID: <code>${uid}</code>\n\n<i>Note: Full details hidden by user privacy.</i>`, {parse_mode: 'HTML'});
        }
    }

    // Handling Group/Channel selection
    if (msg.chat_shared) {
        const cid = msg.chat_shared.chat_id;
        try {
            const chat = await bot.getChat(cid);
            const count = await bot.getChatMemberCount(cid);
            let text = `<b>✨ Chat Details</b>\n\n` +
                       `🆔 <b>ID:</b> <code>${chat.id}</code>\n` +
                       `📛 <b>Title:</b> ${chat.title}\n` +
                       `👥 <b>Members:</b> ${count}\n` +
                       `🔗 <b>Type:</b> ${chat.type}\n` +
                       `📝 <b>About:</b> ${chat.description || 'No description'}`;

            bot.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: "🔗 View Chat", url: chat.username ? `t.me/${chat.username}` : `https://t.me/c/${Math.abs(chat.id+1000000000000)}/1` }]]
                }
            });
        } catch (e) {
            bot.sendMessage(chatId, `<b>Group/Channel Info:</b>\n🆔 ID: <code>${cid}</code>\n\n<i>Note: Bot must be an admin in that chat to see full details.</i>`, {parse_mode: 'HTML'});
        }
    }

    if (msg.text === '🆔 My Info') {
        const u = msg.from;
        bot.sendMessage(chatId, `<b>🆔 Your Info:</b>\n\nName: ${u.first_name}\nID: <code>${u.id}</code>\nUsername: @${u.username || 'N/A'}\nPremium: ${u.is_premium ? 'Yes' : 'No'}`, {parse_mode: 'HTML'});
    }
});

module.exports = app;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Active on ${PORT}`));
