export ctx => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply('У тебя погоняло даун');
  }
}
