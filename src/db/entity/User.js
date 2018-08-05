import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { Chat } from './Chat';

@Entity()
export class User {

	@PrimaryColumn('varchar', { length: 255 })
	id = undefined;

	@PrimaryColumn('varchar', { length: 255 })
	chatId = undefined;

	@Column('varchar')
	username = '';

	@Column('varchar')
	firstName = '';

	@Column('varchar')
	lastName = '';

	@Column({
		type: 'float',
		default: 0,
		nullable: true,
	})
	karma = 0;

	@Column({
		type: 'timestamp',
		nullable: true,
	})
	lastVote = undefined;

	@Column({
		type: 'timestamp',
		nullable: true,
	})
	lastCasino = undefined;

	getName() {
		return this.username || `${this.firstName} ${this.lastName}`;
	}

	getMention() {
		return  `<a href="tg://user?id=${this.id}">${this.getName()}</a>`;
	}

}