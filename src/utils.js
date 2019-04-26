import rateLimit from 'telegraf-ratelimit';
import { sample } from 'lodash';
import env from 'env-var';

const BOT_TOKEN = env.get('BOT_TOKEN').required().asString();
const IS_PROD = process.env.NODE_ENV === 'production';

const BOT_ID = BOT_TOKEN.split(':')[ 0 ];

export const formatFloats = function d2(strs, ...args) {
	var result = strs[0];
	for (var i = 0; i < args.length; ++i) {
		var n = args[i];
		if (Number(n) == n) {
			result += Number(args[i]).toFixed(2);
		} else {
			result += args[i];
		}
		result += strs[i+1];
	}
	return result;
};


export const isMe = (user) => Number(user.id) === Number(BOT_ID);

export const getName = user => {
	return user.username || `${user.first_name || ''} ${user.last_name || ''}`;
};

export const getMention = user => {
	return `<a href="tg://user?id=${user.id}">${getName(user)}</a>`;
};

export const limiter = rateLimit({
	window: 5000,
	limit: 2,
	onLimitExceeded: (ctx, next) => ctx.reply('Не так быстро плес'),
});

export const esc = (strings, ...values) => {
	let str = '';
	strings.forEach((s, i) => {
		str += s + (values[ i ] ? String(values[ i ]).replace(/(?=[*_`\[])/g, '\\') : '');
	});
	return str;
};

export const getOrCreateUser = async ({ userRepository }, { from, chat }) => {
	// .save method has an issue with duplicate primary keys
	let user = await userRepository.findOne(
		{
			id: from.id,
			chatId: chat.id,
		},
	);

	if (!user) {
		// some kind of bugs in babel transpiling, should work with typescript
		await userRepository.insert({
			id: from.id,
			chatId: chat.id,
			karma: IS_PROD ? 0 : 100,
		});
		user = await userRepository.findOne(
			{
				id: from.id,
				chatId: chat.id,
			},
		);
	}

	user.username = from.username;
	user.firstName = from.first_name;
	user.lastName = from.last_name;

	return user;
};

export const withUser = async (ctx, next) => {
	const { message } = ctx;
	const user = await getOrCreateUser(ctx, message);
	ctx.user = user;
	next();
};

export const withReplyUser = async (ctx, next) => {
	const { message } = ctx;
	const replyUser = await getOrCreateUser(ctx, message.reply_to_message);

	ctx.replyUser = replyUser;
	next();
};

export const replyOnly = (texts = []) => ({ message, replyWithHTML }, next) => {
	if (!message.reply_to_message) return;
	if (message.reply_to_message.from.id === message.from.id) {
		return replyWithHTML(sample(texts), { reply_to_message_id: message.id });
	}

	next();
};

export const extra = (ctx, next) => {
	ctx.replyWithHTML = (text, ...opts) => ctx.replyWithHTML(formatFloats`${text}`, ...opts);

	ctx.replyWithHTMLQuote = (text, opts = {}) =>
		ctx.replyWithHTML(text, { reply_to_message_id: ctx.message.message_id, ...opts });

	next();
};