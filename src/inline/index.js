import sounds from './sounds'

const CHUNK_COUNT = 25;

export default async (ctx) => {
    return ctx.answerInlineQuery(
        Object
            .keys(sounds)
            .map((text, idx) => ({
                type: 'voice',
                title: text,
                voice_url: sounds[text],
                id: idx.toString(),
            }))
            .filter(item => item.title.toUpperCase().includes(ctx.update.inline_query.query.toUpperCase()))
            .slice(Number(ctx.update.inline_query.offset || 0), CHUNK_COUNT)
        ,
        {
            next_offset: (Number(ctx.update.inline_query.offset) + CHUNK_COUNT).toString(),
            switch_pm_text: "Список всех фраз",
            switch_pm_parameter: "sounds-list"
        },
    );
}
