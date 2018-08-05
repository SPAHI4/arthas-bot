export default ctx => {
  if (!ctx.message.reply_to_message) {
    return ctx.replyWithHTMLQuote('У тебя погоняло даун');
  }
}
