import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColumnEntity } from './entities/column.entity';
import { CreateColumnDto } from './dto/create-column.dto';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(ColumnEntity)
    private columnsRepository: Repository<ColumnEntity>,
  ) {}

  async create(createColumnDto: CreateColumnDto) {
    const newColumn = this.columnsRepository.create({
      title: createColumnDto.title,
      board: { id: createColumnDto.boardId }
    });
    return this.columnsRepository.save(newColumn);
  }
}