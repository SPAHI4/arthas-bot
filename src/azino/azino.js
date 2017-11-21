import { User } from '../db/entity/User';
import { esc, getUsername } from '../utils';
import {random,sample} from 'lodash';

let isBusy = false;

const REQUIRED_KARMA = 5;
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
 Теперь у тебя ${all}`,
			(lose, all) => `Не вкачал талант, даун, <b>-${lost}</b>!
 Теперь у тебя <b>${all}</b>`,
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
 
 Теперь у тебя ${all}`,
			(lose, all) => `Поймал, проверяй,  Изи сабжи для величайшего (меня). <b>-${lost}</b>!
 У тебя осталось <b>${all}</b>`,
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
 
 Теперь у тебя ${all}`,
			(lose, all) => `(нет)

 минус <b>${lost}</b>, земля тебе пухом
 
 У тебя осталось <b>${all}</b>`,
		],
	],
	[
		'СТАВКИ СДЕЛАНЫ',
		'ОТКРЫВАЕМ ИГРУ',
		'...',
		'ШЕСТЬ!',
		[
			(win, all) => `ВЫ ВЫИГРАЛИ! <b>+${win}</b>!
 Теперь у тебя ${all}`,
			(lose, all) => `-стрим
 
 Мистер плюсовый, теперь у тебя ${all}`,
		]
	],
];

export default async ({ message, reply, replyWithHTML, userRepository }) => {
	if (isBusy) {
		return reply('Падажжи ебана!');
	}

	const user = await userRepository.findOne(
		{
			id: message.from.id,
			chatId: message.chat.id,
		},
	) || userRepository.create({
		id: message.from.id,
		chatId: message.chat.id,
	});

	if (REQUIRED_KARMA > user.karma) {
		return replyWithHTML(`Соре, нужно <b>${REQUIRED_KARMA}</b> рофланкоинов, у тебя <b>${user.karma}</b>`);
	}

	isBusy = true; // на разные чаты пофиг
	const [...strings, [winString, loseString]] = sample(...texts);
	let delay = 1000;
	strings.forEach(string => {
		setTimeout(() => {
			replyWithHTML(string);
		}, delay);
		delay += 1500;
	});

	const isWin = random(1, 100) <= 49; // 49%
	const endCallback = async usr => {
		await userRepository.persist(usr);
		isBusy = false;
	}

	if (isWin) {
		const win = BET * 2;
		user.karma += win;
		setTimeout(() => {
			replyWithHTML(winString(win, user.karma));
			endCallback(user);
		}, delay + 500);
	} else {
		const lose = BET * 2;
		user.karma -= lost;
		setTimeout(() => {
			replyWithHTML(loseString(lose, user.karma));
			endCallback(user);
		}, delay + 500);
	}
}