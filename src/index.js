import Telegraf from 'telegraf';

import commandInline from './inline'


const app = new Telegraf(process.env.BOT_TOKEN);


app.on('inline_query', commandInline);

app.telegram.getMe().then((botInfo) => {
    app.options.username = botInfo.username
});

app.startPolling();