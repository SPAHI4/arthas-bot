import sounds from './sounds'

export default (ctx) => {
    ctx.reply(Object.keys(sounds).join('\r\n'));
}