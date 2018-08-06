import { random, sample } from 'lodash';
import { differenceInMinutes } from 'date-fns';
import { compose } from 'telegraf';
import { pluralize } from 'numeralize-ru';

import { User } from '../db/entity/User';
import { esc, limiter, replyOnly, withUser } from '../utils';

const IS_PROD = process.env.NODE_ENV === 'production';
export const CASINO_COOLDOWN = 10;
const REQUIRED_KARMA = 1;
const BET = 5;

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

const casinoImpl = async ({ message, reply, replyWithHTML, replyWithHTMLQuote, userRepository, user }) => {

	try {

		if (isBusy) {
			return replyWithHTMLQuote('Падажжи ебана!');
		}

		isBusy = true; // на разные чаты пофиг

		if (IS_PROD && user.lastCasino && differenceInMinutes(new Date(), user.lastCasino) < CASINO_COOLDOWN) {
			isBusy = false;
			return replyWithHTMLQuote(sample([
				`АВТИКИ ПОКА ЗАКРЫТЫ ДЛЯ ТЕБЯ`,
				`НОТ ЭНАФ МАНА`,
			]));
		}

		if (REQUIRED_KARMA > user.karma) {
			isBusy = false;
			return replyWithHTMLQuote(`Соре, нужно <b>${REQUIRED_KARMA}</b> ${pluralize(REQUIRED_KARMA, 'рофланкойн', 'рофланкойна', 'рофланкойнов')}, у тебя <b>${user.karma}</b>`);
		}

		user.lastCasino = new Date();
		await userRepository.save(user);

		let strings = [ ...sample(texts) ];
		const [ winString, loseString ] = strings.pop();
		let delay = 1000;

		strings.forEach(string => {
			setTimeout(() => {
				replyWithHTML(string);
			}, delay);
			delay += 2500;
		});

		setTimeout(async () => {
			const isWin = random(1, 100) <= 49; // 49%
			const endCallback = async usr => {
				await userRepository.save(usr);
				isBusy = false;
			}

			if (isWin) {
				if (!random(0, 10)) {
					const win = BET * 3;
					user.karma += win;
					replyWithHTML(`Ебааать, бонус от Коци! Легчайшие +${win} для ${user.getMention()}! Мое увожение`);
				} else {
					const win = BET;
					user.karma += win;
					replyWithHTML(`${winString(win, user.karma)}, ${user.getMention()}`);
				}
				await endCallback(user);
			} else {
				const lose = BET;
				user.karma -= lose;
				replyWithHTML(`${loseString(lose, user.karma)}, ${user.getMention()}`);
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
	casinoImpl,
]);