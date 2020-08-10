import Telegraf from 'telegraf';
import 'reflect-metadata';
import env from 'env-var';
import { sample } from 'lodash';
import 'full-icu';

import commandInline from './sounds/inline'
import soundsList from './sounds/soundsList'
import selfGreeting from './greeting/selfGreeting';
import userGreeting from './greeting/userGreeting';
import otvetochka from './greeting/otvetochka';
import azino from './azino/azino';
import { karmaMinus, karmaPlus, topLaddera } from './karma/index';
import { PLUS_TRIGGERS, MINUS_TRIGGERS } from './karma/triggers'
import { limiter, getName, withUser, withReplyUser, replyOnly, extra } from './utils';
import { connectionMiddleware, getConnection } from './db/connection';

const IS_EVIL = env.get('IS_EVIL').required().asBool();

const app = new Telegraf(process.env.BOT_TOKEN);

console.log('Я вернулся из небытия... ДА ДА Я');

app.use(extra);
app.use(connectionMiddleware);
app.use(selfGreeting);

if (!IS_EVIL) {
	const AZINO_ENABLED = env.get('AZINO_ENABLED').required().asBool();
	const PRIDE_ID = env.get('PRIDE_ID').required().asString();
	app.use(userGreeting);
	app.use((ctx, next) => {
		if (ctx.message && String(ctx.message.chat.id) !== PRIDE_ID) {
			console.log(getName(ctx.message.from), ctx.message.text);
		}
		next();
	});
	app.hears(
		message => message && PLUS_TRIGGERS.includes(message.toUpperCase()),
		karmaPlus,
	);

	app.on('inline_query', commandInline);

	app.command('soundslist', limiter, soundsList);
	app.command('topladder', limiter, topLaddera);
	AZINO_ENABLED && app.command('azino777', limiter, azino);
}
if (IS_EVIL) {
	app.hears(
		message => message && MINUS_TRIGGERS.includes(message.toUpperCase()),
		karmaMinus,
	);
	app.hears('даун', otvetochka);
	app.hears(message => message && (message.includes('Alex mode:') || message.includes('Daler mode:')) , ctx => ctx.replyWithHTMLQuote(`пашол нахуй`));
} else {
	app.hears('Антон', ctx => {
		ctx.replyWithHTMLQuote('а?')
		setTimeout(() => ctx.replyWithHTMLQuote('че звал сларк?'), 1000);
	});
}


app.telegram.getMe().then((botInfo) => {
	app.options.username = botInfo.username;

	app.mention(botInfo.username, ctx => {
		return ctx.replyWithHTMLQuote(sample([
			`нахуя ты это высрал`,
			`держи в курсе`,
		]))
	})
});

// TODO: wrap every message into transaction
getConnection().then(conn => {
	console.log('Database connected');
	app.startPolling();
}).catch(e => {
	console.error(e);
});
