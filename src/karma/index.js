import { sample, random } from 'lodash';
import { User } from '../db/entity/User';
import { esc, getUsername } from '../utils';

export const PLUS_TRIGGERS = ['СПС', 'ДЯКУЮ', 'ОРУ', 'LUL', 'ПЛЮС', '👍', 'ТУПА ЛИКЕ', 'ТУТ СЫГЛЫ'];
export const MINUS_TRIGGERS = ['МИНУС', 'СОСИ', 'ДЕБИЛ', 'ДИНАХ', '👎'];


export const karmaPlus = async (ctx) => {
	const { message, replyWithHTML, userRepository } = ctx;
	if (!message.reply_to_message) return;
	let userTo = await userRepository.findOne(
		{
			id: message.reply_to_message.from.id,
			chatId: message.reply_to_message.chat.id,
		},
	) || userRepository.create({
		id: message.reply_to_message.from.id,
		chatId: message.reply_to_message.chat.id,
	});
	let userFrom = await userRepository.findOne(
		{
			id: message.from.id,
			chatId: message.chat.id,
		},
	) || userRepository.create({
		id: message.from.id,
		chatId: message.chat.id,
	});

	if (userTo.id === userFrom.id) {
		return replyWithHTML(sample([
			`найс трай, очередняра`,
			`You not blowing up, you blowing yourself, you Marlyn Manson (c)`,
		]));
	}

	if (process.env.NODE_ENV === 'production' && userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return replyWithHTML(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
		]));
	}

	if (userFrom.karma < -10) {
		return replyWithHTML(`карма меньше 10... земля тебе пухом, братишка`);
	}

	const oldKarma = userTo.karma;
	userTo.karma += 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	replyWithHTML(sample([
		`<i>${userFrom.username}</i> (${userFrom.karma}) дал 💲 <b>рофланкойн</b> <i>${userTo.username}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
	]));
};

export const karmaMinus = async ctx => {
	const { message, replyWithHTML, userRepository } = ctx;
	if (!message.reply_to_message) return;
	let userTo = await userRepository.findOne(
		{
			id: message.reply_to_message.from.id,
			chatId: message.reply_to_message.chat.id,
		},
	) || userRepository.create({
		id: message.reply_to_message.from.id,
		chatId: message.reply_to_message.chat.id,
	});
	let userFrom = await userRepository.findOne(
		{
			id: message.from.id,
			chatId: message.chat.id,
		},
	) || userRepository.create({
		id: message.from.id,
		chatId: message.chat.id,
	});

	if (userTo.id === userFrom.id) {
		return replyWithHTML(`Ты что, долбоеб? Нажмите на паузу, у вас долбоеб зам себе минусы ставит.`);
	}

	if (process.env.NODE_ENV === 'production' && userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return replyWithHTML(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
		]));
	}

	if (userFrom.karma < -10) {
		return replyWithHTML(`карма меньше 10... земля тебе пухом, братишка`);
	}

	if (!random(0, 5)) {
		userTo.username = getUsername(message.reply_to_message.from, false);
		userTo.karma += 3;

		const oldKarma = userFrom.karma;
		userFrom.karma -= Math.max(Math.floor(userFrom.karma / 10), 3);
		userFrom.username = getUsername(message.from, false);
		userFrom.lastVote = new Date();

		await userRepository.persist([ userTo, userFrom ]);

		return replyWithHTML(`гуччи линзы <i>${userTo.username}</i> отразили хейт <i>${userFrom.username}</i> (${oldKarma} → <b>${userFrom.karma}</b>)`);
	}

	const oldKarma = userTo.karma;
	userTo.karma -= 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	replyWithHTML(sample([
		`<i>${userFrom.username}</i> (${userFrom.karma}) залил соляры <i>${userTo.username}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
	]));
};

const getIcon = i => {
	if (i === 1) {
		return '🥇';
	}
	if (i === 2) {
		return '🥈';
	}
	if (i === 3) {
		return '🥉';
	} else {
		return `${i}.`;
	}
}

export const topLaddera = async ctx => {
	let top = await ctx.userRepository
		.createQueryBuilder('user')
		.where('user.chatId = :chatId', { chatId: ctx.message.chat.id })
		.orderBy("user.karma", "DESC")
		// .setLimit(10)
		.getMany();

	top = top.map((user, i) => `${getIcon(i + 1)} ${user.username} (<b>${user.karma || 0}</b>)`);
	
	let display = top.slice(0, 5);
	if (top.length) {
	    display.push('\n...\n');
	    display.push(...top.slice(-3));
	}
		
	return ctx.replyWithHTML(`Топ-3 ладдера по версии этого чятика:\n\n${display.join('\n')}`);
}
