import { User } from '../db/entity/User';
import { esc, getUsername } from '../utils';
import { random, sample } from 'lodash';

let isBusy = false;

const REQUIRED_KARMA = 1;
const BET = 5;

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
 Теперь у тебя ${all} рофланиумов`,
			(lose, all) => `Не вкачал талант, даун, <b>-${lose}</b>!
 Теперь у тебя <b>${all}</b> рофланиумов`,
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
 
 Теперь у тебя ${all} рофликов`,
			(lose, all) => `Поймал, проверяй,  Изи сабжи для величайшего (меня). <b>-${lose}</b>!
 У тебя осталось <b>${all}</b> рофликов`,
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
 
 Теперь у тебя ${all} рофланкоинов`,
			(lose, all) => `(нет)

 минус <b>${lose}</b>, земля тебе пухом
 
 У тебя осталось <b>${all}</b> рофланкоинов`,
		],
	],
	[
		'СТАВКИ СДЕЛАНЫ',
		'ОТКРЫВАЕМ ИГРУ',
		'...',
		'ШЕСТЬ!',
		[
			(win, all) => `ВЫ ВЫИГРАЛИ! <b>+${win}</b>!
 Теперь у тебя ${all} сабжей`,
			(lose, all) => `-стрим

<b>-${lose}</b>

 Мистер плюсовый (минусовый), теперь у тебя ${all} сабжей`,
		],
	],
];

export default async ({ message, reply, replyWithHTML, userRepository }) => {

	if (isBusy) {
		return reply('Падажжи ебана!');
	}

	isBusy = true; // на разные чаты пофиг

	const user = await userRepository.findOne(
		{
			id: message.from.id,
			chatId: message.chat.id,
		},
	) || userRepository.create({
		id: message.from.id,
		chatId: message.chat.id,
	});

	if (process.env.NODE_ENV === 'production' && user.lastVote && (new Date().valueOf() - user.lastVote.valueOf()) < 1000 * 60 * 5) {
		isBusy = false;
		return replyWithHTML(sample([
			`НОТ РЕДИ`,
			`НОТ ЭНАФ МАНА`,
		]));
	}

	if (REQUIRED_KARMA > user.karma) {
		isBusy = false;
		return replyWithHTML(`Соре, нужно <b>${REQUIRED_KARMA}</b> рофланкоинов, у тебя <b>${user.karma}</b>`);
	}

	user.username = getUsername(message.from, false);
	user.lastVote = new Date();
	await userRepository.persist(user);

	let strings = [...sample(texts)];
	const [winString, loseString] = strings.pop();
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
			await userRepository.persist(usr);
			isBusy = false;
		}

		if (isWin) {
			const win = BET;
			user.karma += win;
			replyWithHTML(`${winString(win, user.karma)}, ${getUsername(user)}`);
			await endCallback(user);
		} else {
			const lose = BET;
			user.karma -= lose;
			replyWithHTML(`${loseString(lose, user.karma)}, ${getUsername(user)}`);
			await endCallback(user);
		}
	}, delay + 2500);
}