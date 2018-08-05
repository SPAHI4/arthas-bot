import { sample, random } from 'lodash';
import { compose } from 'telegraf';
import { differenceInMinutes } from 'date-fns';

import { User } from '../db/entity/User';
import { esc, limiter, replyOnly, withReplyUser, withUser } from '../utils';

const IS_PROD = process.env.NODE_ENV === 'production';

export const PLUS_TRIGGERS = [ '+', 'СПС', 'ДЯКУЮ', 'ОРУ', 'LUL', 'ПЛЮС', '👍', 'ТУПА ЛИКЕ', 'ТУТ СЫГЛЫ', 'ТУТ СЫГЛЫ+++', 'КЛЕВЫЙ НИК', 'СПРАВЕДЛИВО', 'СОГЛЫ' ];
export const MINUS_TRIGGERS = [ '-', 'МИНУС', 'СОСИ', 'ДЕБИЛ', 'ДИНАХ', '👎', 'САСАТ', 'ДЕБИК' ];
export const KARMA_POMOIKA = -10;
export const VOTE_COOLDOWN = 5;


const karmaPlusImpl = async (ctx) => {
	const { message, replyWithHTML, replyWithHTMLQuote, userRepository } = ctx;
	let userTo = ctx.replyUser;
	let userFrom = ctx.user;

	if (IS_PROD && differenceInMinutes(userFrom.lastVote, new Date()) < VOTE_COOLDOWN) {
		return replyWithHTMLQuote(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
		]));
	}

	if (userFrom.karma < KARMA_POMOIKA) {
		return replyWithHTMLQuote(`карма меньше ${KARMA_POMOIKA}... земля тебе пухом, братишка`);
	}

	const oldKarma = userTo.karma;
	userTo.karma += 1;

	userFrom.lastVote = new Date();

	await userRepository.persist([ userTo, userFrom ]);

	replyWithHTML(sample([
		`<i>${userFrom.username}</i> (${userFrom.karma}) дал 💲 <b>рофланкойн</b> <i>${userTo.username}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
	]));
};

export const karmaPlus = compose([
	limiter,
	replyOnly([
		`найс трай, очередняра`,
	]),
	withUser,
	withReplyUser,
	karmaPlusImpl,
]);


const karmaMinusImpl = async ctx => {
	const { message, replyWithHTML, replyWithHTMLQuote, userRepository } = ctx;
	let userTo = ctx.replyUser;
	let userFrom = ctx.user;

	if (IS_PROD && differenceInMinutes(userFrom.lastVote, new Date()) < VOTE_COOLDOWN) {
		return replyWithHTMLQuote(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
			`ЗЭТ ВОЗ ЭН ЭРРОР`,
		]));
	}

	if (userFrom.karma < KARMA_POMOIKA) {
		return replyWithHTMLQuote(`карма меньше ${KARMA_POMOIKA}... земля тебе пухом, братишка`);
	}

	if (!random(0, 5)) {
		userTo.karma += 3;

		const oldKarma = userFrom.karma;
		userFrom.karma -= Math.max(Math.floor(userFrom.karma / 10), 3);
		userFrom.lastVote = new Date();

		await userRepository.persist([ userTo, userFrom ]);

		return replyWithHTML(`гуччи линзы <i>${userTo.getMention()}</i> отразили хейт <i>${userFrom.getMention()}</i> (${oldKarma} → <b>${userFrom.karma}</b>)`);
	}

	const oldKarma = userTo.karma;
	userTo.karma -= 1;

	userFrom.lastVote = new Date();

	await userRepository.persist([ userTo, userFrom ]);

	replyWithHTML(sample([
		`<i>${userFrom.getMention()}</i> (${userFrom.karma}) залил соляры <i>${userTo.getMention()}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
	]));
};

export const karmaMinus = compose([
	limiter,
	replyOnly([
		`Ты что, долбоеб? Нажмите на паузу, у вас долбоеб cам себе минусы ставит.`,
	]),
	withUser,
	withReplyUser,
	karmaMinusImpl,
]);

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
		.orderBy('user.karma', 'DESC')
		// .setLimit(10)
		.getMany();

	top = top.map((user, i) => `${getIcon(i + 1)} ${user.getName()} (<b>${user.karma || 0}</b>)`);

	let display = top.slice(0, 5);
	if (top.length) {
		display.push('\n...\n');
		display.push(...top.slice(-3));
	}

	return ctx.replyWithHTML(`Топ-3 ладдера по версии этого чятика:\n\n${display.join('\n')}`);
};
