import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
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
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' }, 
    });
  }

  async findOne(id: string, userId: string) {
    const board = await this.boardsRepository.findOne({
      where: { id, user: { id: userId } },
      // TypeORM v0.3+ strictly requires this object syntax for relations
      relations: {
        columns: true, 
      }, 
    });
    
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string) {
    await this.boardsRepository.update({ id, user: { id: userId } }, updateBoardDto);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const result = await this.boardsRepository.delete({ id, user: { id: userId } });
    if (result.affected === 0) {
      throw new NotFoundException('Board not found or unauthorized');
    }
    return { message: 'Board deleted successfully' };
  }
}