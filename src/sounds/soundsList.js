import sounds from './sounds'

export default (ctx) => {
    ctx.reply(`Список всех фраз для инлайн режима: @HailrakeBot

${Object.keys(sounds).join('\r\n')}`);
}
