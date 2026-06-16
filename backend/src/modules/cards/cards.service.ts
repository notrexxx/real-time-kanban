import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEntity } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

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

  // 1. NEW BULK REORDER METHOD
  async reorder(cards: { id: string; order: number; columnId: string }[]) {
    // Update every affected card in the database at the exact same time
    await Promise.all(
      cards.map(card => 
        this.cardsRepository.update(card.id, { 
          order: card.order, 
          column: { id: card.columnId } as any
        })
      )
    );
    return { success: true };
  }

  async update(id: string, updateCardDto: UpdateCardDto) {
    const card = await this.cardsRepository.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');

    if (updateCardDto.columnId) {
      card.column = { id: updateCardDto.columnId } as any;
    }
    
    if (updateCardDto.title) card.title = updateCardDto.title;
    if (updateCardDto.description) card.description = updateCardDto.description;
    if (updateCardDto.order !== undefined) card.order = updateCardDto.order;

    return this.cardsRepository.save(card);
  }
}