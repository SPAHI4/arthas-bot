import { sample } from 'lodash';
import { User } from '../db/entity/User';
import { getUsername } from '../utils';

export const PLUS_TRIGGERS = ['+', 'СПС', 'ДЯКУЮ', 'ОРУ', 'ПЛЮС', '👍', 'ТУПА ЛИКЕ'];
export const MINUS_TRIGGERS = ['-', 'ДАУН', '👎'];


export const karmaPlus = async (ctx) => {
	const { message, replyWithMarkdown, userRepository } = ctx;
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
		return replyWithMarkdown(`найс трай, очередняра`);
	}

	if (userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return replyWithMarkdown(`НОТ РЕДИ`);
	}

/*	if (userFrom.karma < 10) {
		return replyWithMarkdown(`карма меньше 10... земля тебе пухом, братишка`);
	}*/

	const oldKarma = userTo.karma;
	userTo.karma += 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	replyWithMarkdown(sample([
		`_${userFrom.username}_ (${userFrom.karma}) дал рофлан _${getUsername(message.reply_to_message.from)}_ (${oldKarma} => *${userTo.karma}*)`,
	]));
};

export const karmaMinus = async ctx => {
	const { message, replyWithMarkdown, userRepository } = ctx;
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
		return replyWithMarkdown(`найс трай, очередняра`);
	}

	if (userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return replyWithMarkdown(`НОТ РЕДИ`);
	}

/*	if (userFrom.karma < 10) {
		return replyWithMarkdown(`карма меньше 10... земля тебе пухом, братишка`);
	}*/

	const oldKarma = userTo.karma;
	userTo.karma -= 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	replyWithMarkdown(sample([
		`_${userFrom.username}_ (${userFrom.karma}) залил соляры _${getUsername(message.reply_to_message.from)}_ (${oldKarma} => *${userTo.karma}*)`,
	]));
};