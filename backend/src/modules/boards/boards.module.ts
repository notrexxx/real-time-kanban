import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { Board } from './entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardsGateway } from './boards.gateway';

@Module({

  imports: [TypeOrmModule.forFeature([Board, User])],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsGateway],
})
export class BoardsModule {}