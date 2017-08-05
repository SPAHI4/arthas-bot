import {isMe} from '../utils';

export default async (ctx, next) => {
    if (ctx.message && ctx.message.new_chat_member && isMe(ctx.message.new_chat_member)) {
        ctx.reply('Я вернулся из небытия! ДА ДА, Я!');
    }
    next();
}