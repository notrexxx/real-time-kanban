import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { User } from '../users/entities/user.entity'; 
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createBoardDto: CreateBoardDto, userId: string) {
    const newBoard = this.boardsRepository.create({
      ...createBoardDto,
      user: { id: userId }, 
    });
    return this.boardsRepository.save(newBoard);
  }

  async findAll(userId: string) {
    return this.boardsRepository.find({
      where: [
        { user: { id: userId } },
        { collaborators: { id: userId } }
      ],
      // FIXED: We must explicitly include the user (Owner) data so the frontend can filter the lists!
      relations: {
        user: true, 
      },
      order: { createdAt: 'ASC' }, 
    });
  }

  async findOne(id: string, userId: string) {
    const board = await this.boardsRepository.findOne({
      where: [
        { id, user: { id: userId } },
        { id, collaborators: { id: userId } }
      ],
      relations: {
        columns: { cards: true },
        collaborators: true, 
        user: true, 
      },
    });
    
    if (!board) throw new NotFoundException('Board not found or you are not authorized to view it');
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string) {
    const board = await this.boardsRepository.findOne({ where: { id, user: { id: userId } } });
    if (!board) throw new NotFoundException('Only the owner can update board details');
    
    await this.boardsRepository.update({ id }, updateBoardDto);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const result = await this.boardsRepository.delete({ id, user: { id: userId } });
    if (result.affected === 0) {
      throw new NotFoundException('Board not found or unauthorized (Only owners can delete boards)');
    }
    return { message: 'Board deleted successfully' };
  }

  async addCollaborator(boardId: string, email: string, ownerId: string) {
    const board = await this.boardsRepository.findOne({ 
      where: { id: boardId, user: { id: ownerId } },
      relations: { collaborators: true } 
    });

    if (!board) throw new NotFoundException('Board not found or you are not the owner.');

    const guestUser = await this.usersRepository.findOne({ where: { email } });
    if (!guestUser) throw new NotFoundException('User with this email does not exist.');

    if (guestUser.id === ownerId) throw new BadRequestException('You cannot invite yourself.');

    const isAlreadyCollaborator = board.collaborators.some(c => c.id === guestUser.id);
    if (!isAlreadyCollaborator) {
      board.collaborators.push(guestUser);
      await this.boardsRepository.save(board);
    }

    return { message: 'Collaborator added successfully', user: { email: guestUser.email } };
  }
}