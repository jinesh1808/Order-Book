import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { BookSnapshot } from '../types/book';

// Basic Trade interface
export interface Trade {
  maker_order_id: string;
  taker_order_id: string;
  price: number;
  size: number;
  timestamp: number;
}

export function useOrderBookSocket(symbol: string) {
  const [snapshot, setSnapshot] = useState<BookSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fills, setFills] = useState<Trade[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/trades')
      .then(res => res.json())
      .then((data: Trade[]) => {
        // data comes ordered by timestamp DESC, we need it ASC for chart if we want chronological,
        // but for fills list we want DESC. The fills list does fills.slice().reverse().
        // Wait, the fills list maps it as fills.slice().reverse() so it expects fills to be ASC (oldest first).
        // Let's reverse the data from API (which is DESC) so it becomes ASC.
        setFills(data.reverse());
      })
      .catch(console.error);

    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe', symbol);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('book', (data: BookSnapshot) => {
      console.log('Received book snapshot:', data);
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

    socket.on('fills', (trades: Trade[]) => {
      setFills(prev => [...prev, ...trades].slice(-50)); // Keep last 50 fills
    });

    return () => {
      socket.emit('unsubscribe', symbol);
      socket.disconnect();
    };
  }, [symbol]);

  return { snapshot, isConnected, fills };
}
