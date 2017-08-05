import Telegraf from 'telegraf';

import commandInline from './inline'


const app = new Telegraf(process.env.BOT_TOKEN);

console.log('Я вернулся из небытия... ДА ДА Я');

app.on('inline_query', commandInline);

app.telegram.getMe().then((botInfo) => {
    app.options.username = botInfo.username
});

app.startPolling();