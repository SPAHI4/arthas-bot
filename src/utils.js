const BOT_ID = process.env.BOT_TOKEN.split(':')[0];

export const isMe = (user) => Number(user.id) === Number(BOT_ID);

export const getUsername = (user) => {
    if (user.username) return '@' + user.username;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.first_name;
};