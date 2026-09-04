const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Webhook endpoint for Vercel
app.post(`/api/webhook`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMsg = `<b>🌟 Welcome to Info Extractor Bot 🌟</b>\n\n` +
                       `<b>Please select an option from the keyboard below:</b>`;

    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: [
                [
                    { text: '👤 User Info', request_users: { request_id: 1, user_is_bot: false } },
                    { text: '🤖 Bot Info', request_users: { request_id: 2, user_is_bot: true } }
                ],
                [
                    { text: '👥 Group Info', request_chat: { request_id: 3, chat_is_channel: false } },
                    { text: '📢 Channel Info', request_chat: { request_id: 4, chat_is_channel: true } }
                ],
                [{ text: '🆔 My Info' }]
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(chatId, welcomeMsg, opts);
});

// Listener for all messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1. Handling Shared User or Bot
    if (msg.user_shared) {
        const sharedId = msg.user_shared.user_id;
        const isBotRequest = msg.user_shared.request_id === 2;

        try {
            // Attempting to fetch full details using getChat
            const user = await bot.getChat(sharedId);
            
            let response = `<b>✨ ${isBotRequest ? 'Bot' : 'User'} Information Found</b>\n\n` +
                           `👤 <b>Full Name:</b> ${user.first_name || ''} ${user.last_name || ''}\n` +
                           `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                           `🔗 <b>Username:</b> ${user.username ? '@' + user.username : 'None'}\n` +
                           `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}\n` +
                           `📞 <b>Phone:</b> ${user.phone_number || 'Nobody 🛡️'}\n`;
            
            if (user.bio) response += `📝 <b>About:</b> ${user.bio}\n`;

            const inlineBtn = {
                inline_keyboard: [[
                    { 
                        text: isBotRequest ? '🚀 Start Bot' : '💬 Send Message', 
                        url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` 
                    }
                ]]
            };

            bot.sendMessage(chatId, response, { parse_mode: 'HTML', reply_markup: inlineBtn });

        } catch (error) {
            // Fallback if getChat fails due to privacy
            bot.sendMessage(chatId, `<b>⚠️ Privacy Restricted</b>\n\nID: <code>${sharedId}</code>\n\n<i>The user has hidden their profile from bots. Name and username cannot be fetched directly.</i>`, { parse_mode: 'HTML' });
        }
    }

    // 2. Handling Shared Group or Channel
    if (msg.chat_shared) {
        const sharedChatId = msg.chat_shared.chat_id;
        const isChannel = msg.chat_shared.request_id === 4;

        try {
            const chat = await bot.getChat(sharedChatId);
            const members = await bot.getChatMemberCount(sharedChatId);

            let response = `<b>✨ ${isChannel ? 'Channel' : 'Group'} Information</b>\n\n` +
                           `📛 <b>Title:</b> ${chat.title}\n` +
                           `🆔 <b>ID:</b> <code>${chat.id}</code>\n` +
                           `🔗 <b>Username:</b> ${chat.username ? '@' + chat.username : 'Private 🔒'}\n` +
                           `👥 <b>Total Members:</b> ${members}\n` +
                           `📝 <b>Description:</b> ${chat.description || 'No description available'}\n`;

            const inlineBtn = {
                inline_keyboard: [[
                    { 
                        text: isChannel ? '📢 Join Channel' : '👥 Join Group', 
                        url: chat.username ? `t.me/${chat.username}` : `https://t.me/c/${Math.abs(chat.id + 1000000000000)}/1`
                    }
                ]]
            };

            bot.sendMessage(chatId, response, { parse_mode: 'HTML', reply_markup: inlineBtn });

        } catch (error) {
            bot.sendMessage(chatId, `<b>⚠️ Limited Access</b>\n\nID: <code>${sharedChatId}</code>\n\n<i>Bot cannot fetch details. The group/channel is either private or the bot is not a member there.</i>`, { parse_mode: 'HTML' });
        }
    }

    // 3. My Info Button
    if (msg.text === '🆔 My Info') {
        const u = msg.from;
        const response = `<b>✨ Your Profile Information</b>\n\n` +
                         `👤 <b>Full Name:</b> ${u.first_name} ${u.last_name || ''}\n` +
                         `🆔 <b>ID:</b> <code>${u.id}</code>\n` +
                         `🔗 <b>Username:</b> ${u.username ? '@' + u.username : 'N/A'}\n` +
                         `💎 <b>Premium:</b> ${u.is_premium ? 'Yes' : 'No'}`;
        
        bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
    }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
