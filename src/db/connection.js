import { createConnection } from 'typeorm';
import env from 'env-var';

import { User } from './entity/User';
import { UserGlobal } from './entity/UserGlobal';
import { Chat } from './entity/Chat'

const DATABASE_URL = env.get('DATABASE_URL').required().asString();

let connection;

export const options = {
	type: 'postgres',
	url: DATABASE_URL,
	ssl: true,
	extra: {
		ssl: {
			rejectUnauthorized: false,
		},
	},
	entities: [
		User,
	],
	logger: "debug",
	logging: "all",
	synchronize: true,
	logNotifications: true,
	connectTimeoutMS: 10000,
};

export const getConnection = async () => {
	if (connection && connection.isConnected) {
		return connection;
	} else {
		console.log('Preparing connection');
		connection = await createConnection(options);
		console.log('DB connected');
		return connection;
	}
};

export const connectionMiddleware = async (ctx, next) => {
	ctx.connection = await getConnection();
	ctx.userRepository = ctx.connection.getRepository(User);
	next();
};