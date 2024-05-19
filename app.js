const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const cron = require('node-cron');
const {getRaidSeasonStatus, getClanWarStatus} = require("./coc-api-data");
dotenv.config();

const token = process.env.TELEGRAM_TG_TOKEN;

const bot = new TelegramBot(token);

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const availableCommands = ['/raid - информация о текущем рейде', '/war - информация о текущей войне']

    const commands = availableCommands.join('\n');
    await bot.sendMessage(chatId, `Мои команды:\n${commands}`);
});

bot.onText(/\/raid/, async (msg) => {
    const msgText = await getRaidSeasonStatus()
    await bot.sendMessage(msg.chat.id, msgText, {parse_mode:"HTML"});
});

bot.onText(/\/war/, async (msg) => {
    const msgText = await getClanWarStatus()
    await bot.sendMessage(msg.chat.id, msgText);
});

bot.onText(/\/debug/, async (msg) => {
    console.log(msg);
});


bot.startPolling().then(() => {
    console.log('Bot started');

    cron.schedule('10 12 * * 1', async () => {
        const msgText = await getRaidSeasonStatus()
        const chatId = process.env.GROUP_CHAT_ID;
        await bot.sendMessage(chatId, msgText);
    }, {
        scheduled: true,
    });
});

