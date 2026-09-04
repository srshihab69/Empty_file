const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const app = express();
app.use(bodyParser.json());

// Webhook endpoint
app.post(`/api/webhook`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `<b>🌟 Welcome to Information Finder Bot 🌟</b>\n\n` +
                        `<b>Please choose an option from the keyboard below:</b>`;

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
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    bot.sendMessage(chatId, welcomeText, opts);
});

// Listener for Shared Data and Buttons
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1 & 2: Handling User or Bot Share
    if (msg.user_shared) {
        const sharedUserId = msg.user_shared.user_id;
        const requestId = msg.user_shared.request_id;

        try {
            const user = await bot.getChat(sharedUserId);
            const isBot = (requestId === 2);
            
            let details = `<b>✨ ${isBot ? 'Bot' : 'User'} Details</b>\n\n` +
                          `👤 <b>Full Name:</b> ${user.first_name || ''} ${user.last_name || ''}\n` +
                          `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                          `🔗 <b>Username:</b> ${user.username ? '@' + user.username : 'N/A'}\n` +
                          `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}\n` +
                          `📞 <b>Phone:</b> ${user.phone_number || 'Nobody 🛡️'}\n`;
            
            if (user.bio) details += `📝 <b>About:</b> ${user.bio}\n`;

            const inlineBtn = {
                inline_keyboard: [[
                    { 
                        text: isBot ? '🚀 Start Bot' : '💬 Send Message', 
                        url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` 
                    }
                ]]
            };

            bot.sendMessage(chatId, details, { parse_mode: 'HTML', reply_markup: inlineBtn });
        } catch (error) {
            bot.sendMessage(chatId, "<b>❌ Error:</b> Could not fetch details. The user might have strict privacy settings.", { parse_mode: 'HTML' });
        }
    }

    // 3 & 4: Handling Group or Channel Share
    if (msg.chat_shared) {
        const sharedChatId = msg.chat_shared.chat_id;
        const requestId = msg.chat_shared.request_id;

        try {
            const chat = await bot.getChat(sharedChatId);
            const memberCount = await bot.getChatMemberCount(sharedChatId);
            const isChannel = (requestId === 4);

            let details = `<b>✨ ${isChannel ? 'Channel' : 'Group'} Details</b>\n\n` +
                          `📛 <b>Title:</b> ${chat.title}\n` +
                          `🆔 <b>ID:</b> <code>${chat.id}</code>\n` +
                          `🔗 <b>Username:</b> ${chat.username ? '@' + chat.username : 'Private 🔒'}\n` +
                          `👥 <b>Total Members:</b> ${memberCount}\n` +
                          `📝 <b>Description:</b> ${chat.description || 'No description available'}\n`;

            const inlineBtn = {
                inline_keyboard: [[
                    { 
                        text: isChannel ? '📢 Join Channel' : '👥 Join Group', 
                        url: chat.username ? `t.me/${chat.username}` : `https://t.me/c/${Math.abs(chat.id + 1000000000000)}/1`
                    }
                ]]
            };

            bot.sendMessage(chatId, details, { parse_mode: 'HTML', reply_markup: inlineBtn });
        } catch (error) {
            bot.sendMessage(chatId, "<b>❌ Error:</b> Could not fetch details. Make sure the chat is public or the bot is a member.", { parse_mode: 'HTML' });
        }
    }

    // 5: Handling "My Info" button
    if (msg.text === '🆔 My Info') {
        const user = msg.from;
        const myInfo = `<b>✨ Your Information</b>\n\n` +
                       `👤 <b>Full Name:</b> ${user.first_name} ${user.last_name || ''}\n` +
                       `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                       `🔗 <b>Username:</b> ${user.username ? '@' + user.username : 'N/A'}\n` +
                       `💎 <b>Premium:</b> ${user.is_premium ? 'Yes' : 'No'}`;
        
        bot.sendMessage(chatId, myInfo, { parse_mode: 'HTML' });
    }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
