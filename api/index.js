const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is missing.');
}

const bot = new Telegraf(BOT_TOKEN);

// ইন-মেমোরি স্টোরেজ (প্রোডাকশনে স্থায়ী ডেটার জন্য Vercel KV বা MongoDB ব্যবহার করতে পারেন)
const users = {};
const userState = {};

// ইউজার ডেটা লোড বা ইনিশিয়ালাইজ করার ফাংশন
function getUser(userId, fullName) {
  if (!users[userId]) {
    users[userId] = {
      name: fullName,
      balance: 0,
      referrals: 0,
      refRate: 10,
      refBonus: 0,
      currentTask: null
    };
  }
  return users[userId];
}

// ১. /start কমান্ড ও ওয়েলকাম মেসেজ
bot.start((ctx) => {
  const fullName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  getUser(ctx.from.id, fullName);

  const welcomeText = `স্বাগতম **${fullName}**! 🎉\nআমাদের আর্নিং বোটে আপনাকে স্বাগতম। নিচে দেওয়া মেনু থেকে আপনার পছন্দমতো অপশন সিলেক্ট করুন:`;
  
  return ctx.replyWithMarkdown(welcomeText, Markup.keyboard([
    ['Task', 'Balance'],
    ['Rates']
  ]).resize());
});

// ২. Task বাটন হ্যান্ডলার
bot.hears('Task', (ctx) => {
  const userId = ctx.from.id;
  const fullName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  const user = getUser(userId, fullName);

  // রেন্ডম ইমেল ও পাসওয়ার্ড জেনারেট করা
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const emailName = `user_${randomNum}`;
  const email = `${emailName}@gmail.com`;
  const password = `Pass#${Math.floor(100000 + Math.random() * 900000)}`;

  user.currentTask = { email, password };

  const taskMsg = `🎯 **New Task Details:**\n\n` +
    `📧 **Email:** \`${email}\`\n` +
    `🔑 **Password:** \`${password}\`\n\n` +
    `উপরে দেওয়া ইনফো দিয়ে একটি একাউন্ট খুলুন। একাউন্ট খোলার পর নিচের **Verified** বাটনে ক্লিক করুন!`;

  // কিবোর্ড পরিবর্তন করে Verified ও Cancel বাটন দেখানো
  return ctx.replyWithMarkdown(taskMsg, Markup.keyboard([
    ['Verified', 'Cancel']
  ]).resize());
});

// ৩. Verified বাটন হ্যান্ডলার
bot.hears('Verified', (ctx) => {
  const userId = ctx.from.id;
  const user = users[userId];

  if (!user || !user.currentTask) {
    return ctx.reply('⚠️ কোনো অ্যাক্টিভ টাস্ক নেই! আগে "Task" বাটন থেকে টাস্ক নিন।');
  }

  // রিয়েল-টাইম চেক সিমুলেশন (সফল বা ব্যর্থ)
  const isSuccess = Math.random() > 0.2; // ৮০% সফলতার সুযোগ

  if (isSuccess) {
    const reward = 87; // ইমেল প্রতি রেট ৮৭ টাকা
    user.balance += reward;
    user.currentTask = null;

    ctx.reply(`✅ **Task Verified Successfully!**\n\nআপনার একাউন্ট তৈরি সফল হয়েছে। আপনার মূল ব্যালেন্সে **${reward} টাকা** যোগ করা হয়েছে!`, 
      Markup.keyboard([['Task', 'Balance'], ['Rates']]).resize()
    );
  } else {
    ctx.reply(`❌ **Verification Failed!**\n\nসঠিকভাবে একাউন্ট তৈরি করা হয়নি বা চেক করা যায়নি। দয়া করে সঠিকভাবে একাউন্ট খুলে আবার Verified এ ক্লিক করুন।`,
      Markup.keyboard([['Verified', 'Cancel']]).resize()
    );
  }
});

// ৪. Cancel / Cencen বাটন হ্যান্ডলার
bot.hears(/cancel|cencen/i, (ctx) => {
  const userId = ctx.from.id;
  if (users[userId]) {
    users[userId].currentTask = null;
  }
  delete userState[userId];

  return ctx.reply('মূল মেনুতে ফিরে আসা হয়েছে:', Markup.keyboard([
    ['Task', 'Balance'],
    ['Rates']
  ]).resize());
});

// ৫. Balance বাটন হ্যান্ডলার
bot.hears('Balance', (ctx) => {
  const userId = ctx.from.id;
  const fullName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  const user = getUser(userId, fullName);

  const balanceText = `💰 **User Profile & Balance**\n\n` +
    `👤 Name: ${user.name}\n` +
    `💳 Balance: **${user.balance} Taka**\n` +
    `👥 Referral Count: **${user.referrals}**\n` +
    `💸 Per Referral Rate: **10 Taka**\n` +
    `🎁 Total Referral Bonus: **${user.refBonus} Taka**\n` +
    `🔒 Withdraw Limit: **1000 Taka**`;

  return ctx.replyWithMarkdown(balanceText, Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Copy Referral Link', 'copy_ref')],
    [Markup.button.callback('💰 Check Total Balance', 'check_bal')],
    [Markup.button.callback('Bkash', 'w_bkash'), Markup.button.callback('Nagad', 'w_nagad')],
    [Markup.button.callback('Cancel', 'w_cancel')]
  ]));
});

// ৬. Rates বাটন হ্যান্ডলার
bot.hears('Rates', (ctx) => {
  const ratesText = `📊 **Current Task Rates List:**\n\n` +
    `🔹 Facebook per account: **8.67 taka**\n` +
    `🔹 Email per account: **87 taka**\n` +
    `🔹 Instagram per account: **45 taka**`;

  return ctx.replyWithMarkdown(ratesText, Markup.keyboard([
    ['Task', 'Balance'],
    ['Rates']
  ]).resize());
});

// ৭. ইনলাইন বাটন অ্যাকশন হ্যান্ডলারসমূহ
bot.action('copy_ref', async (ctx) => {
  const userId = ctx.from.id;
  const refLink = `https://t.me/${ctx.botInfo.username}?start=${userId}`;
  await ctx.answerCbQuery('Referral link copied!');
  return ctx.reply(`আপনার ইউনিক রেফারেল লিংক:\n\`${refLink}\``, { parse_mode: 'Markdown' });
});

bot.action('check_bal', async (ctx) => {
  const user = users[ctx.from.id];
  const bal = user ? user.balance : 0;
  await ctx.answerCbQuery();
  return ctx.reply(`বর্তমান মোট ব্যালেন্স: *${bal} টাকা*`, { parse_mode: 'Markdown' });
});

// বিকাশ উইথড্র
bot.action('w_bkash', async (ctx) => {
  const userId = ctx.from.id;
  const user = users[userId];
  if (!user || user.balance < 1000) {
    await ctx.answerCbQuery('Limit not reached!');
    return ctx.reply(`❌ উইথড্র করার জন্য সর্বনিম্ন ব্যালেন্স **১০০০ টাকা** হতে হবে। আপনার বর্তমান ব্যালেন্স: **${user ? user.balance : 0} টাকা**।`);
  }
  userState[userId] = { method: 'bkash', step: 'waiting_number' };
  await ctx.answerCbQuery();
  return ctx.reply('📱 আপনার বিকাশ পার্সোনাল নম্বরটি প্রদান করুন:');
});

// নগদ উইথড্র
bot.action('w_nagad', async (ctx) => {
  const userId = ctx.from.id;
  const user = users[userId];
  if (!user || user.balance < 1000) {
    await ctx.answerCbQuery('Limit not reached!');
    return ctx.reply(`❌ উইথড্র করার জন্য সর্বনিম্ন ব্যালেন্স **১০০০ টাকা** হতে হবে। আপনার বর্তমান ব্যালেন্স: **${user ? user.balance : 0} টাকা**।`);
  }
  userState[userId] = { method: 'nagad', step: 'waiting_number' };
  await ctx.answerCbQuery();
  return ctx.reply('📱 আপনার নগদ পার্সোনাল নম্বরটি প্রদান করুন:');
});

// উইথড্র মেনু ক্যানসেল
bot.action('w_cancel', async (ctx) => {
  const userId = ctx.from.id;
  delete userState[userId];
  await ctx.answerCbQuery('Cancelled');
  return ctx.reply('মূল মেনুতে ফিরে আসা হলো।', Markup.keyboard([['Task', 'Balance'], ['Rates']]).resize());
});

// মোবাইল নম্বর ইনপুট রিসিভ করার টেক্সট হ্যান্ডলার
bot.on('text', (ctx, next) => {
  const userId = ctx.from.id;
  if (userState[userId] && userState[userId].step === 'waiting_number') {
    const number = ctx.message.text.trim();
    const method = userState[userId].method.toUpperCase();
    delete userState[userId];

    return ctx.reply(`✅ **Withdraw Request Submitted Successfully!**\n\nMethod: ${method}\nNumber: \`${number}\`\nStatus: ⏳ **Pending**\n\nএডমিন যাচাই করে দ্রুত টাকা পাঠিয়ে দেবেন।`, 
      { parse_mode: 'Markdown', ...Markup.keyboard([['Task', 'Balance'], ['Rates']]).resize() }
    );
  }
  return next();
});

// ৮. Vercel Serverless Webhook Handler Export
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } else {
      res.status(200).send('Telegram Bot Webhook is running successfully on Vercel!');
    }
  } catch (e) {
    console.error('Error handling update:', e);
    res.status(500).send('Error processing update');
  }
};
