import { Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, updateData: { title: string }) {
    const column = await this.columnsRepository.findOne({ where: { id } });
    
    if (!column) {
      throw new NotFoundException(`Column with ID "${id}" not found`);
    }

    column.title = updateData.title;
    return this.columnsRepository.save(column);
  }

  async remove(id: string) {
    const result = await this.columnsRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Column with ID "${id}" not found`);
    }
    
    return { success: true, message: 'Column deleted successfully' };
  }
}