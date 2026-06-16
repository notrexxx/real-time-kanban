import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Board } from '../../boards/entities/board.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; 

  @OneToMany(() => Board, (board) => board.user, { cascade: true })
  boards: Board[];


  @ManyToMany(() => Board, (board) => board.collaborators)
  sharedBoards: Board[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}