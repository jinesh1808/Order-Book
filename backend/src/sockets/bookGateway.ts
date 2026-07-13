import { Server, Socket } from 'socket.io';
import { BookSnapshot } from '../engine/types';

export class BookGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe', (symbol: string) => {
        socket.join(symbol);
        console.log(`Client ${socket.id} subscribed to ${symbol}`);
      });

      socket.on('unsubscribe', (symbol: string) => {
        socket.leave(symbol);
        console.log(`Client ${socket.id} unsubscribed from ${symbol}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public broadcastSnapshot(snapshot: BookSnapshot) {
    this.io.to(snapshot.symbol).emit('book', snapshot);
  }
}
