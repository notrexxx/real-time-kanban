import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path if needed
import { ColumnEntity } from '../../columns/entities/column.entity'; // Adjust path if needed

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;


  @ManyToOne(() => User, (user) => user.boards, { onDelete: 'CASCADE' })
  user: User;


  @ManyToMany(() => User)
  @JoinTable({
    name: 'board_collaborators', 
    joinColumn: { name: 'boardId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  collaborators: User[];

  @OneToMany(() => ColumnEntity, (column) => column.board, { cascade: true })
  columns: ColumnEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}