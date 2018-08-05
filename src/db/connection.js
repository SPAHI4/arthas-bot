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
	entities: [
		User,
	],
	logging: {
		logQueries: process.env.NODE_ENV !== 'production',
		logFailedQueryError: true,
	},
	synchronize: true,
};

export const getConnection = async () => {
	if (connection && connection.isConnected) {
		return Promise.resolve(connection);
	} else {
		connection = await createConnection(options);
		return connection;
	}
};

export const connectionMiddleware = async (ctx, next) => {
	ctx.connection = await getConnection();
	ctx.userRepository = ctx.connection.getRepository(User);
	next();
};