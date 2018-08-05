import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { Chat } from './Chat';

@Entity()
export class User {

	@PrimaryColumn('varchar', { length: 255 })
	id = undefined;

	@PrimaryColumn('varchar', { length: 255 })
	chatId = undefined;

	@Column('varchar', { nullable: true })
	username = undefined;

	@Column('varchar', { nullable: true })
	firstName = undefined;

	@Column('varchar', { nullable: true })
	lastName = undefined;

	@Column({
		type: 'float',
		default: 0,
		nullable: true,
	})
	karma = undefined;

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