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


if (!process.env.IS_EVIL) {
	app.use(userGreeting);
	app.hears(new RegExp(PLUS_TRIGGERS.join('|'), 'i'), limiter.middleware(), karmaPlus);

	app.on('inline_query', commandInline);

	app.command('soundslist', soundsList);
	app.command('topladder', limiter.middleware(), topLaddera);
}
if (process.env.IS_EVIL) {
	app.hears(new RegExp(MINUS_TRIGGERS.join('|'), 'i'), limiter.middleware(), karmaMinus);
}


app.telegram.getMe().then((botInfo) => {
	app.options.username = botInfo.username;
});


getConnection().then(conn => {
	console.log('Database connected');
	app.startPolling();
}).catch(e => {
	console.error(e);
});
