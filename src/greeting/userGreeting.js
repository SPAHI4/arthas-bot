import { getMention, isMe } from '../utils';
import { sample } from 'lodash';

export default async (ctx, next) => {
	if (ctx.message && ctx.message.new_chat_member && !isMe(ctx.message.new_chat_member)) {
		const username = getMention(ctx.message.new_chat_member);
		ctx.replyWithHTML(sample([
			`А я все думал, когда же ты появишься, ${username}!`,
			`Добре почантек, ${username}`,
			`Кулиалити, ${username}`,
			`Да, это ${username}`,
			`Вот и новый челикслав подъехал, ${username}`,
			`Кулиссимо, сказал Паписсимо, ${username}`,
			`Оп-па, ${username}`,
		]));
	}
	next();
}
