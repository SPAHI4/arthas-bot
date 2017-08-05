import {getUsername, isMe} from '../utils';
import {sample} from 'lodash';

export default async (ctx, next) => {
    if (ctx.message && ctx.message.new_chat_member && !isMe(ctx.message.new_chat_member)) {
        const username = getUsername(ctx.message.new_chat_member);
        ctx.reply(sample([
            `Добре почантек, ${username}`,
            `Кулиалити, ${username}`,
            `Да, это ${username}`,
            `Вот и новый челикслав подъехал, ${username}`,
        ]));
    }
    next();
}