import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Open the CORS gates so the frontend can connect
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
  }

  // When a frontend sends this signal, broadcast it to everyone else
  @SubscribeMessage('board-updated')
  handleBoardUpdate(@MessageBody() data: { boardId: string }) {
    this.server.emit(`board-updated-${data.boardId}`);
  }
}