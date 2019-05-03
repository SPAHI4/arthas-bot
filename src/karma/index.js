import { sample, random } from 'lodash';
import { compose } from 'telegraf';
import { differenceInMinutes } from 'date-fns';
import { PLUS_TRIGGERS, MINUS_TRIGGERS } from './triggers';
import { pluralize } from 'numeralize-ru';

import { formatFloats, limiter, replyOnly, withReplyUser, withUser } from '../utils';

const IS_PROD = process.env.NODE_ENV === 'production';

export const KARMA_POMOIKA = -20;
export const VOTE_COOLDOWN = 5;


const karmaPlusImpl = async (ctx) => {
	const { message, replyWithHTML, replyWithHTMLQuote, userRepository } = ctx;
	let userTo = ctx.replyUser;
	let userFrom = ctx.user;

	const timeDiff = differenceInMinutes(new Date(), userFrom.lastVote);

	if (IS_PROD && userFrom.lastVote && timeDiff < VOTE_COOLDOWN) {
		const timeLeft = (VOTE_COOLDOWN - timeDiff) || 1;
		const timeoutMessage = `\n ⏳ жди ${timeLeft} ${pluralize(timeLeft, 'минуту', 'минуты', 'минут')}`;
		return replyWithHTMLQuote(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
		]) + timeoutMessage);
	}

	if (userFrom.karma < KARMA_POMOIKA) {
		return replyWithHTMLQuote(formatFloats`баланс рофлов меньше ${KARMA_POMOIKA}... земля тебе пухом, братишка`);
	}

	const oldKarma = userTo.karma;
	userFrom.lastVote = new Date();
	userTo.karma += userFrom.getVotePoint();
	userFrom.karma -= userFrom.getVotePoint() * 0.2;

	await userRepository.save([ userTo, userFrom ]);

	replyWithHTML(sample([
		formatFloats`<i>${userFrom.getName()}</i> (${userFrom.karma}) дал 💲 <b>рофланкойн</b> <i>${userTo.getName()}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
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
	const { replyWithHTML, replyWithHTMLQuote, userRepository } = ctx;
	let userTo = ctx.replyUser;
	let userFrom = ctx.user;

	const timeDiff = differenceInMinutes(new Date(), userFrom.lastVote);

	if (IS_PROD && userFrom.lastVote && timeDiff < VOTE_COOLDOWN) {
		const timeLeft = (VOTE_COOLDOWN - timeDiff) || 1;
		const timeoutMessage = `\n ⏳ ${timeLeft} жди ${pluralize(timeLeft, 'минуту', 'минуты', 'минут')}`;
		return replyWithHTMLQuote(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
			`ЗЭТ ВОЗ ЭН ЭРРОР`,
		]) + timeoutMessage);
	}

	if (userFrom.karma < KARMA_POMOIKA) {
		return replyWithHTMLQuote(`баланс ${KARMA_POMOIKA}... лежать + лежать`);
	}


	if (!random(0, 5)) {
		const oldUserFromKarma = userFrom.karma;
		const oldUserToKarma = userTo.karma;
		
		userTo.karma += userFrom.getVotePoint();
		userFrom.karma -= Math.max(Math.floor(userFrom.karma / 4), 5);
		userFrom.lastVote = new Date();

		await userRepository.save([ userTo, userFrom ]);

		return replyWithHTML(formatFloats`гуччи линзы <i>${userTo.getName()}</i> (${oldUserToKarma} → <b>${userTo.karma}</b>) отразили хейт <i>${userFrom.getName()}</i> (${oldUserFromKarma} → <b>${userFrom.karma}</b>)`);
	}

	const oldKarma = userTo.karma;
	userTo.karma -= userFrom.getVotePoint();
	userFrom.karma -= userFrom.getVotePoint() * 0.2;

	userFrom.lastVote = new Date();

	await userRepository.save([ userTo, userFrom ]);

	replyWithHTML(sample([
		formatFloats`<i>${userFrom.getName()}</i> (${userFrom.karma}) залил соляры <i>${userTo.getName()}</i> (${oldKarma} → <b>${userTo.karma}</b>)`,
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
		return `${i.toString()}.`;
	}
}

export const topLaddera = async ctx => {
	const topCount = 5;
	const users = await ctx.userRepository
		.createQueryBuilder('user')
		.where('user.chatId = :chatId', { chatId: ctx.message.chat.id })
		.orderBy('user.karma', 'DESC')
		// .setLimit(10)
		.getMany();

	const getUserString = (user, i) => formatFloats`${getIcon(i + 1)} ${String(ctx.message.from.id) === String(user.id) ? `<b>${user.getName()}</b>` : user.getName()} (<b>${user.karma || 0}</b>)`;
	let top = users.map(getUserString);

	let content = top.slice(0, topCount);
	const displayedUsers = [...users.slice(0, topCount), ...users.slice(-3)];
	if (!displayedUsers.some(user => String(user.id) === String(ctx.message.from.id))) {
		const userIndex = users.findIndex(user => String(user.id) === String(ctx.message.from.id));
		if (userIndex !== -1) {
			userIndex > topCount && content.push('...\n');
			content.push(getUserString(users[userIndex], userIndex));
		}
	}

	if (top.length) {
		content.push('...\n Херальды 🤢');
		content.push(...top.slice(-3));
	}

	return ctx.replyWithHTML(`Топ-3 ладдера по версии этого чятика:\n\n Имморталы 😎 \n${content.join('\n')}`);
};
