const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL; // Vercel deployment URL
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
    const welcomeText = `<b>🌟 Welcome to Info Finder Bot 🌟</b>\n\n` +
                        `নিচের কীবোর্ড বাটন থেকে আপনার পছন্দমতো অপশন সিলেক্ট করুন।\n` +
                        `<i>Choose an option from the menu below:</i>`;

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
                ['🆔 My Info']
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(chatId, welcomeText, opts);
});

// Handling Shared Data (User/Bot/Chat)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 1 & 2: User and Bot Info
    if (msg.user_shared) {
        const sharedUserId = msg.user_shared.user_id;
        try {
            const user = await bot.getChat(sharedUserId);
            const isBot = msg.user_shared.request_id === 2;
            
            let infoMsg = `<b>${isBot ? '🤖 Bot' : '👤 User'} Details:</b>\n\n` +
                          `🆔 ID: <code>${user.id}</code>\n` +
                          `📛 Name: ${user.first_name || ''} ${user.last_name || ''}\n` +
                          `🔗 Username: @${user.username || 'N/A'}\n` +
                          `💎 Premium: ${user.is_premium ? 'Yes ✅' : 'No ❌'}\n` +
                          `📞 Phone: ${user.phone_number || 'Nobody 🛡️'}\n`;
            
            if(user.bio) infoMsg += `📝 About: ${user.bio}\n`;

            const inlineBtn = {
                reply_markup: {
                    inline_keyboard: [[
                        { text: isBot ? '🚀 Start Bot' : '💬 Send Message', url: `t.me/${user.username}` }
                    ]]
                }
            };
            bot.sendMessage(chatId, infoMsg, { parse_mode: 'HTML', ...inlineBtn });
        } catch (e) {
            bot.sendMessage(chatId, "❌ তথ্য পাওয়া যায়নি অথবা ইউজারটি প্রাইভেট।");
        }
    }

    // 3 & 4: Group and Channel Info
    if (msg.chat_shared) {
        const sharedChatId = msg.chat_shared.chat_id;
        try {
            const chat = await bot.getChat(sharedChatId);
            const memberCount = await bot.getChatMemberCount(sharedChatId);
            const isChannel = msg.chat_shared.request_id === 4;

            let infoMsg = `<b>${isChannel ? '📢 Channel' : '👥 Group'} Details:</b>\n\n` +
                          `🆔 ID: <code>${chat.id}</code>\n` +
                          `📛 Title: ${chat.title}\n` +
                          `🔗 Username: @${chat.username || 'Private'}\n` +
                          `👥 Total Members: ${memberCount}\n` +
                          `📝 Description: ${chat.description || 'No description'}\n`;

            const inlineBtn = {
                reply_markup: {
                    inline_keyboard: [[
                        { text: isChannel ? '📢 Join Channel' : '👥 Join Group', url: `t.me/${chat.username}` }
                    ]]
                }
            };
            bot.sendMessage(chatId, infoMsg, { parse_mode: 'HTML', ...inlineBtn });
        } catch (e) {
            bot.sendMessage(chatId, "❌ এই চ্যাটটির তথ্য বের করা সম্ভব হয়নি। বোটটিকে সেখানে অ্যাডমিন হিসেবে থাকতে হবে অথবা সেটি পাবলিক হতে হবে।");
        }
    }

    // 5: My Info
    if (msg.text === '🆔 My Info') {
        const infoMsg = `<b>🆔 Your Information:</b>\n\n` +
                        `👤 Full Name: ${msg.from.first_name} ${msg.from.last_name || ''}\n` +
                        `🔗 Username: @${msg.from.username || 'N/A'}\n` +
                        `🆔 ID: <code>${msg.from.id}</code>\n` +
                        `💎 Premium: ${msg.from.is_premium ? 'Yes ✅' : 'No ❌'}`;
        
        bot.sendMessage(chatId, infoMsg, { parse_mode: 'HTML' });
    }
});

// Server listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
