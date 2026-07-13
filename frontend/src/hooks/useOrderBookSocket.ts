import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BookSnapshot } from '../types/book';

export function useOrderBookSocket(symbol: string) {
  const [snapshot, setSnapshot] = useState<BookSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe', symbol);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('book', (data: BookSnapshot) => {
      // Calculate totals for depth bars
      let bidTotal = 0;
      data.bids = data.bids.map(b => {
        bidTotal += b.size;
        return { ...b, total: bidTotal };
      });

      let askTotal = 0;
      data.asks = data.asks.map(a => {
        askTotal += a.size;
        return { ...a, total: askTotal };
      });

      setSnapshot(data);
    });

    return () => {
      socket.emit('unsubscribe', symbol);
      socket.disconnect();
    };
  }, [symbol]);

  return { snapshot, isConnected };
}
