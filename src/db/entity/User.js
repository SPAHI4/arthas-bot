import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, Index, PrimaryIndex } from 'typeorm';
import { Chat } from './Chat';

@Entity()
export class User {

	@PrimaryColumn('string')
	id = undefined;

	@PrimaryColumn('string')
	chatId = undefined;

	@Column('string')
	username = '';

	@Column({
		type: 'float',
		default: 0,
		nullable: true,
	})
	karma = 0;

	@Column({
		type: 'datetime',
		nullable: true,
	})
	lastVote = undefined;

}