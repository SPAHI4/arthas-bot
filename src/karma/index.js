import { sample, random } from 'lodash';
import { User } from '../db/entity/User';
import { getUsername } from '../utils';

export const PLUS_TRIGGERS = ['+', 'СПС', 'ДЯКУЮ', 'ОРУ', 'ПЛЮС', '👍', 'ТУПА ЛИКЕ'];
export const MINUS_TRIGGERS = ['-', 'МИНУС', 'ДАУН', '👎'];


export const karmaPlus = async (ctx) => {
	const { message, reply, userRepository } = ctx;
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
		return reply(`найс трай, очередняра`);
	}

	if (userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return reply(`НОТ РЕДИ`);
	}

	if (userFrom.karma < -10) {
		return reply(`карма меньше 10... земля тебе пухом, братишка`);
	}

	const oldKarma = userTo.karma;
	userTo.karma += 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	reply(sample([
		`_${userFrom.username}_ (${userFrom.karma}) дал рофлан _${userTo.username}_ (${oldKarma} → *${userTo.karma}*)`,
	]));
};

export const karmaMinus = async ctx => {
	const { message, reply, userRepository } = ctx;
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
		return reply(`найс трай, очередняра`);
	}

	if (process.env.NODE_ENV === 'production' && userFrom.lastVote && (new Date().valueOf() - userFrom.lastVote.valueOf()) < 1000 * 60 * 5) {
		return reply(`НОТ РЕДИ`);
	}

	if (userFrom.karma < -10) {
		return reply(`карма меньше 10... земля тебе пухом, братишка`);
	}

	if (!random(0, 5)) {
		userTo.username = getUsername(message.reply_to_message.from, false);

		const oldKarma = userFrom.karma;
		userFrom.karma -= 3;
		userFrom.username = getUsername(message.from, false);

		await userRepository.persist([ userTo, userFrom ]);

		return reply(`гуччи линзы _${userTo.username}_ отразили хейт _${userFrom.username}_ (${oldKarma} → *${userFrom.karma}*)`);
	}

	const oldKarma = userTo.karma;
	userTo.karma -= 1;
	userTo.username = getUsername(message.reply_to_message.from, false);

	userFrom.lastVote = new Date();
	userFrom.username = getUsername(message.from, false);

	await userRepository.persist([ userTo, userFrom ]);

	reply(sample([
		`_${userFrom.username}_ (${userFrom.karma}) залил соляры _${userTo.username}_ (${oldKarma} → *${userTo.karma}*)`,
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
		.setLimit(10)
		.getMany();

	top = top.map((user, i) => `${getIcon(i + 1)} ${user.username} (**${user.karma || 0}**)`).join('\n');
	console.log(top);
	return ctx.reply(`Топ-3 ладдера по версии этого чятика:\n\n${top}`);
}