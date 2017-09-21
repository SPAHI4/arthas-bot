import Telegraf from 'telegraf';
import 'reflect-metadata';

import commandInline from './sounds/inline'
import soundsList from './sounds/soundsList'
import selfGreeting from './greeting/selfGreeting';
import userGreeting from './greeting/userGreeting';
import { karmaMinus, karmaPlus, MINUS_TRIGGERS, PLUS_TRIGGERS, topLaddera } from './karma/index';
import { limiter } from './utils';
import {connectionMiddleware, getConnection} from './db/connection';


const app = new Telegraf(process.env.BOT_TOKEN);

console.log('Я вернулся из небытия... ДА ДА Я');

app.use(connectionMiddleware);
app.use(selfGreeting);
app.use(limiter.middleware());


if (!process.env.IS_EVIL) {
	app.use(userGreeting);
	app.hears(PLUS_TRIGGERS, karmaPlus);
}
if (process.env.IS_EVIL || process.env.NODE_ENV !== 'production') {
	app.hears(MINUS_TRIGGERS, karmaMinus);
}

app.on('inline_query', commandInline);

app.command('sounds_list', soundsList);
app.command('topLadder', topLaddera);


app.telegram.getMe().then((botInfo) => {
	app.options.username = botInfo.username;
});

app.startPolling();

getConnection().then(conn => {
	console.log('Database connected');
}).catch(e => {
	console.error(e);
});