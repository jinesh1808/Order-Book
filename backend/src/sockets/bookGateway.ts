import { Server, Socket } from 'socket.io';
import { BookSnapshot } from '../engine/types';

export class BookGateway {
  private io: Server; //encapsulation applied

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
    console.log(`Broadcasting snapshot globally with ${snapshot.bids.length} bids and ${snapshot.asks.length} asks`);
    this.io.emit('book', snapshot);
  }
  // io private hai, isliye server.ts se seedha nahi chhu sakte.
  // Ye method class ke andar hai, to this.io use kar sakta hai.
  // Saare connected clients ko 'reset' event bhejta hai.
  public broadcastReset() {
    this.io.emit('reset');
  }
}
