import { createConnection } from 'typeorm';
import { User } from './entity/User';
import { Chat } from './entity/Chat';

let connection;

const options = {
	driver: {
		type: 'postgres',
		url: process.env.DATABASE_URL,
	},
	entities: [
		User,
	],
	logging: {
		logQueries: process.env.NODE_ENV !== 'production',
		logFailedQueryError: true,
	},
	autoSchemaSync: true,
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