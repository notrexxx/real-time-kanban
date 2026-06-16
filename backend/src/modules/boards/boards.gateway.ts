import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class BoardsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleDisconnect(client: Socket) {
    client.broadcast.emit('user-disconnected', client.id);
  }

  @SubscribeMessage('board-updated')
  handleBoardUpdate(@MessageBody() payload: { boardId: string }) {
    this.server.emit(`board-updated-${payload.boardId}`);
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; x: number; y: number; email: string }
  ) {
    client.broadcast.emit(`cursor-updated-${payload.boardId}`, {
      socketId: client.id,
      x: payload.x,
      y: payload.y,
      email: payload.email,
    });
  }

  @SubscribeMessage('card-lock')
  handleCardLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; cardId: string; email: string }
  ) {
    client.broadcast.emit(`card-locked-${payload.boardId}`, {
      cardId: payload.cardId,
      email: payload.email,
    });
  }

  @SubscribeMessage('card-unlock')
  handleCardUnlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; cardId: string }
  ) {
    client.broadcast.emit(`card-unlocked-${payload.boardId}`, {
      cardId: payload.cardId,
    });
  }
}