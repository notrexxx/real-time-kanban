import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEntity } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(CardEntity)
    private cardsRepository: Repository<CardEntity>,
  ) {}

  async create(createCardDto: CreateCardDto) {
    const newCard = this.cardsRepository.create({
      title: createCardDto.title,
      description: createCardDto.description,
      column: { id: createCardDto.columnId }
    });
    return this.cardsRepository.save(newCard);
  }
}