import RateLimit from 'telegraf-ratelimit';

const BOT_ID = process.env.BOT_TOKEN.split(':')[0];

export const isMe = (user) => Number(user.id) === Number(BOT_ID);

export const getUsername = (user, showAt = true) => {
	if (user.username) return (showAt ? '@' : '') + user.username;
	if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
	if(user.first_name) return user.first_name;
	if(user.last_name) return user.last_name;
	return user.id;
};

export const limiter = new RateLimit({
	window: 5000,
	limit: 2,
	onLimitExceeded: (ctx, next) => ctx.reply('Не так быстро плес'),
});