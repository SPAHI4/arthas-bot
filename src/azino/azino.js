import { random, sample } from 'lodash';
import { differenceInMinutes } from 'date-fns';
import { compose } from 'telegraf';
import { pluralize } from 'numeralize-ru';
import commandParts from 'telegraf-command-parts';

import { User } from '../db/entity/User';
import { esc, limiter, replyOnly, withUser } from '../utils';

const IS_PROD = process.env.NODE_ENV === 'production';
export const CASINO_COOLDOWN = 90;
const REQUIRED_KARMA = 1;
const DEFAULT_BET = 5;

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
			(win, all) => `Ебать, изи <b>+${win}</b>! На лакерычах.
 Теперь у тебя ${all} ${pluralize(all, 'рофланиум', 'рофланиума', 'рофланиумов')}`,
			(lose, all) => `Не вкачал талант, даун, <b>-${lose}</b>!
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
			(win, all) => `ДА ПОЧЕМУУУ БЛЯТЬ!

 <b>+${win}</b>!
 
 Теперь у тебя ${all} ${pluralize(all, 'рофлик', 'рофлика', 'рофликов')}`,
			(lose, all) => `Поймал, проверяй,  Изи сабжи для величайшего (меня). <b>-${lose}</b>!
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
			(win, all) => `АЙСФРАУД ГДЕ БАЛАНС?

 <b>+${win}</b>!
 
 Теперь у тебя ${all} ${pluralize(all, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}`,
			(lose, all) => `(нет)

 минус <b>${lose}</b>, земля тебе пухом
 
 У тебя осталось <b>${all}</b> ${pluralize(all, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}`,
		],
	],
	[
		'СТАВКИ СДЕЛАНЫ',
		'ОТКРЫВАЕМ ИГРУ',
		'...',
		'ШЕСТЬ!',
		[
			(win, all) => `ВЫ ВЫИГРАЛИ! <b>+${win}</b>!
 Теперь у тебя ${all} ${pluralize(all, 'сабж', 'сабжа', 'сабжей')}`,
			(lose, all) => `ТАЗАШО

-стрим

<b>-${lose}</b>

 Мистер плюсовый (минусовый), теперь у тебя ${all} ${pluralize(all, 'сабж', 'сабжа', 'сабжей')}`,
		],
	],
];

const casinoImpl = async ({ message, reply, replyWithHTML, replyWithHTMLQuote, userRepository, user, contextState }) => {

	try {

		if (isBusy) {
			return replyWithHTMLQuote('Падажжи ебана!');
		}

		isBusy = true; // на разные чаты пофиг

		if (IS_PROD && user.lastCasino && differenceInMinutes(new Date(), user.lastCasino) < CASINO_COOLDOWN) {
			isBusy = false;
			const waitingTime = `ПРИХОДИ ЧЕРЕЗ ${differenceInMinutes(new Date(), user.lastCasino)} ${pluralize(all, 'МИНУТУ', 'МИНУТЫ', 'МИНУТ')}`;
			return replyWithHTMLQuote(sample([
				`АВТИКИ ПОКА ЗАКРЫТЫ ДЛЯ ТЕБЯ, ${waitingTime}`,
				`НОТ ЭНАФ МАНА, ${waitingTime}`,
			]));
		}

		if (REQUIRED_KARMA > user.karma) {
			isBusy = false;
			return replyWithHTMLQuote(`Соре, нужно <b>${REQUIRED_KARMA}</b> ${pluralize(REQUIRED_KARMA, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}, у тебя <b>${user.karma}</b>`);
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
		} else if (Number(USER_BET) > 0) {
			const tBet = Math.round(Number(USER_BET));
			const maxBet = Math.floor(user.karma * 0.33);
			if (tBet > maxBet) {
				isBusy = false;
				return replyWithHTMLQuote(`Соре, максимальная ставка для тебя: <b>${maxBet}</b>`);
			}
			else BET = tBet;
		}


		user.lastCasino = new Date();
		await userRepository.save(user);

		replyWithHTML(`Такс такс такс... Ставка: <b>${BET}</b>`);

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
						`Ебааать, бонус от TTR! Легчайшие +${win} для ${user.getMention()}! Мое увожение PogChamp`,
						`Вы получаете грант от США
						 +${win} для ${user.getMention()}! roflanTsar`,
						`Я СНОВА ЖИВУ! 
						 +${win} для ${user.getMention()}! roflanZdarova`,
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
					replyWithHTML(sample([`Всем привет! Я - Алексей Вильнюсов, и сегодня я научу вас зарабатывать! 
					Для этого нужен вступительный взнос, и я забираю у вас <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						`Привет! Это Навальный! Ваш донат для ФБК успешно принят!
					Спасибо за <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
						`Кхе-кхе, доброго времени суток! Хочешь как на Украине? Тогда плоти нолог!
					Я забираю у тебя <b>${lose}</b> ${pluralize(lose, 'сабж', 'сабжа', 'сабжей')}, ${user.getMention()} <b>(${user.karma})</b>`,
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
