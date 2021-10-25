import { random, sample } from 'lodash';
import { differenceInMinutes } from 'date-fns';
import { compose } from 'telegraf';
import { pluralize } from 'numeralize-ru';
import commandParts from 'telegraf-command-parts';

import { User } from '../db/entity/User';
import { esc, formatFloats, getName, limiter, replyOnly, withUser } from '../utils';

const IS_PROD = process.env.NODE_ENV === 'production';
const REQUIRED_KARMA = 2;
const DEFAULT_BET = 2;

const getCooldown = ctx => {
	const PRIDE_ID = env.get('PRIDE_ID').required().asString();
	if (ctx.message && String(ctx.message.chat.id) !== PRIDE_ID) {
		return 30;
	}

	return 90;
}

let isBusy = false;

const texts = [
	[
		`Поднял бабла -
Стали другими дела`,
		`Стали считаться со мной
Знают, кто теперь я`,
		`Поднял бабла -
Машина в линию дала`,
		`У тебя талант, братан.
Какой?`,
		`Играть онлайн!`,
		[
			(win, all) => formatFloats`Ебать, изи <b>+${win}</b>! На лакерычах.
 Теперь у тебя ${all} ${pluralize(all, 'рофланиум', 'рофланиума', 'рофланиумов')}`,
			(lose, all) => formatFloats`Не вкачал талант, даун, <b>-${lose}</b>!
 Теперь у тебя <b>${all}</b> ${pluralize(all, 'рофланиум', 'рофланиума', 'рофланиумов')}`,
		],
	],
	[
		`Все говорят: 
		"АК, а как поднять бабла? Куда нажать?"`,
		`AZINO Три топора`,
		`Я трачу и не плачу
То, что поднял вчера`,
		`Поймал удачу и
Держу за оба крыла`,
		[
			(win, all) => formatFloats`ДА ПОЧЕМУУУ БЛЯТЬ!

 <b>+${win}</b>!
 
 Теперь у тебя ${all} ${pluralize(all, 'рофлик', 'рофлика', 'рофликов')}`,
			(lose, all) => formatFloats`Поймал, проверяй,  Изи сабжи для величайшего (меня). <b>-${lose}</b>!
 У тебя осталось <b>${all}</b> ${pluralize(all, 'рофлик', 'рофлика', 'рофликов')}`,
		],
	],
	[
		`AZINO Три топора`,
		`Началась игра!`,
		`Все по-чесноку`,
		`Если поднял
Отгрузят бабла`,
		[
			(win, all) => formatFloats`АЙСФРАУД ГДЕ БАЛАНС?

 <b>+${win}</b>!
 
 Теперь у тебя ${all} ${pluralize(all, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}`,
			(lose, all) => formatFloats`(нет)

 ЭТО МНЕ? ЭТО МНЕ? ЭТО МНЕ? минус <b>${lose}</b>
 
 У тебя осталось <b>${all}</b> ${pluralize(all, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}`,
		],
	],
	[
		'СТАВКИ СДЕЛАНЫ',
		'ОТКРЫВАЕМ ИГРУ',
		'...',
		'ШЕСТЬ!',
		[
			(win, all) => formatFloats`ВЫ ВЫИГРАЛИ! <b>+${win}</b>!
 Теперь у тебя ${all} ${pluralize(all, 'сабж', 'сабжа', 'сабжей')}`,
			(lose, all) => formatFloats`ТАЗАШО

-стрим

<b>-${lose}</b>

 Здарова, шнырь-курьер! теперь у тебя ${all} ${pluralize(all, 'сабж', 'сабжа', 'сабжей')}`,
		],
	],
];

const casinoImpl = async ({ message, reply, replyWithHTML, replyWithHTMLQuote, userRepository, user, contextState }) => {

	try {

		if (isBusy) {
			return replyWithHTMLQuote('Падажжи ебана!');
		}

		isBusy = true; // на разные чаты пофиг

		if (IS_PROD && user.lastCasino && differenceInMinutes(new Date(), user.lastCasino) < getCooldown(ctx)) {
			isBusy = false;
			const timeDiff = getCooldown(ctx) - differenceInMinutes(new Date(), user.lastCasino);
			const waitingTime = `\n ⏳ жди ${timeDiff} ${pluralize(timeDiff, 'минуту', 'минуты', 'минут')}`;
			return replyWithHTMLQuote(sample([
				`АВТИКИ ПОКА ЗАКРЫТЫ ДЛЯ ТЕБЯ, ${waitingTime}`,
				`НОТ ЭНАФ МАНА, ${waitingTime}`,
			]));
		}

		if (REQUIRED_KARMA > user.karma) {
			isBusy = false;
			return replyWithHTMLQuote(formatFloats`Соре, нужно <b>${REQUIRED_KARMA}</b> ${pluralize(REQUIRED_KARMA, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}, у тебя <b>${user.karma}</b>`);
		}

		let strings = [ ...sample(texts) ];
		const [ winString, loseString ] = strings.pop();
		let delay = 1000;

		const args = contextState?.command?.args;

		let hasPromocode;
		let BET = DEFAULT_BET;
		let [USER_BET, PROMOCODE] = args ? args.split(' ') : [];
		if (PROMOCODE === 'ARTHAS') {
			hasPromocode = true;
		}
		if (USER_BET === 'ARTHAS') {
			hasPromocode = true;
		} else {
			const maxBet = Math.floor(user.karma * 0.33);
			const tBet = ['все', 'all', 'вабанк', 'vabank', 'max', 'макс'].includes(USER_BET) ? maxBet : Math.abs(Math.round(Number(USER_BET)));

			if (tBet > maxBet) {
				isBusy = false;
				return replyWithHTMLQuote(formatFloats`Соре, максимальная ставка для тебя: <b>${maxBet}</b>`);
			}
			else BET = tBet || DEFAULT_BET;
		}


		user.lastCasino = new Date();
		await userRepository.save(user);

		replyWithHTML(formatFloats`Такс такс такс... Ставка: <b>${BET}</b>`);

		// fix to remove multiple messages
		strings = [strings.join((`\n`))];

		strings.forEach(string => {
			setTimeout(() => {
				replyWithHTML(string);
			}, delay);
			delay += 2500;
		});

		setTimeout(async () => {
			const isWin = random(1, 100) <= 48; // 49%
			const endCallback = async usr => {
				await userRepository.save(usr);
				isBusy = false;
			}

			if (isWin) {
				if (!random(0, 7)) {
					const win = BET * random(2, 4);
					user.karma += win;
					replyWithHTML(sample([
						formatFloats`Ебааать, бонус от TTR! Легчайшие +${win} для ${user.getMention()}! Мое увожение PogChamp`,
						formatFloats`Вы получаете грант от США
						 +${win} для ${user.getMention()}! roflanTsar`,
						formatFloats`Я СНОВА ЖИВУ! 
						 +${win} для ${user.getMention()}! roflanZdarova`,
						formatFloats`DING DING DING! Найс мультикаст
						 +${win} для ${user.getMention()}! Good idea (cuz it was mine)`,
					]));
				} else {
					let win = BET;
					if (hasPromocode) win += 0.3;
					user.karma += win;
					replyWithHTML(`${winString(win, user.karma)}, ${user.getMention()}`);
				}
				await endCallback(user);
			} else {
				if (!random(0, 9)) {
					const lose = BET * random(2, 4);
					user.karma -= lose;
					replyWithHTML(sample([formatFloats`Всем привет! Я - Алексей Вильнюсов, и сегодня я научу вас зарабатывать! 
					Для этого нужен вступительный взнос, и я забираю у вас <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						formatFloats`Привет! Это Навальный! Ваш донат для ФБК <i>(ПРИЗНАННАЯ НА ТЕРРИТОРИИ РФ ЭКСТРЕМИСТСКАЯ ОРГАНИЗАЦИЯ)</i> успешно принят!
					Спасибо за <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						formatFloats`Кхе-кхе, доброго времени суток! Хочешь как на Украине? Тогда плоти нолог!
					Я забираю у тебя <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						formatFloats`Это Варламов! А велодорожки где?
					Налог на многоэташки <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						formatFloats`АХА ХАХАХА! Я ТУТ ПРИТАИЛСЯ! ПРИТАИЛСЯ НА КРЫСИЧАХ! АХАХАХХА!
					ПЛАТИ ДАНЬ <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
					]));
				} else {
					const lose = BET;
					user.karma -= lose;
					replyWithHTML(`${loseString(lose, user.karma)}, ${user.getMention()}`);
				}
				await endCallback(user);
			}
		}, delay + 2500);

	} catch (e) {
		isBusy = false;
		console.error(e);
	}
};

export default compose([
	withUser,
	commandParts(),
	casinoImpl,
]);
