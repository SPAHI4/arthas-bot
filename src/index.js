import Telegraf from 'telegraf';
import 'reflect-metadata';

import commandInline from './sounds/inline'
import soundsList from './sounds/soundsList'
import selfGreeting from './greeting/selfGreeting';
import userGreeting from './greeting/userGreeting';
import otvetochka from './greeting/otvetochka';
import azino from './azino/azino';
import { karmaMinus, karmaPlus, MINUS_TRIGGERS, PLUS_TRIGGERS, topLaddera } from './karma/index';
import { getUsername, limiter } from './utils';
import {connectionMiddleware, getConnection} from './db/connection';


const app = new Telegraf(process.env.BOT_TOKEN);

console.log('Я вернулся из небытия... ДА ДА Я');

app.use(connectionMiddleware);
app.use(selfGreeting);


if (!process.env.IS_EVIL) {
	app.use(userGreeting);
	app.use((ctx, next) => {
		if (ctx.message && +ctx.message.chat.id !== +(-1001059804134)) {
			console.log(getUsername(ctx.message.from), ctx.message.text);
		}
		next();
	});
	app.hears(message => message && MINUS_TRIGGERS.includes(message.toUpperCase()), limiter.middleware(), karmaMinus);
	app.hears(message => message && PLUS_TRIGGERS.includes(message.toUpperCase()), limiter.middleware(), karmaPlus);

	app.on('inline_query', commandInline);

	app.command('soundslist', soundsList);
	app.command('topladder', limiter.middleware(), topLaddera);
	process.env.AZINO_ENABLED && app.command('azino777', limiter.middleware(), azino);
}
if (process.env.IS_EVIL) {
	app.hears(new RegExp(MINUS_TRIGGERS.join('|'), 'i'), limiter.middleware(), karmaMinus);
	app.hears(['-','–'], limiter.middleware(), karmaMinus); // FIXME
	app.hears('даун', otvetochka);
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
