import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';


@UseGuards(AuthGuard('jwt'))
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() createBoardDto: CreateBoardDto, @Request() req: any) {

    return this.boardsService.create(createBoardDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {

    return this.boardsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {

    return this.boardsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @Request() req: any) {

    return this.boardsService.update(id, updateBoardDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
   
    return this.boardsService.remove(id, req.user.id);
  }

  @Post(':id/collaborators')
  addCollaborator(@Param('id') id: string, @Body('email') email: string, @Request() req: any) {

    return this.boardsService.addCollaborator(id, email, req.user.id);
  }
}