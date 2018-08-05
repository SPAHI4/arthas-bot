import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { Chat } from './Chat';

@Entity()
export class UserGlobal {

	@PrimaryColumn('varchar', { length: 255 })
	id = undefined;

}