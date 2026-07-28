export interface Tick {
  symbol: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface BookLevel {
  price: number;
  size: number;
}

export interface BookSnapshot {
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
  timestamp: number;
}

export interface Order {
  id: string;
  user_id: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  timestamp: number;
  status: 'open' | 'filled' | 'canceled';
}

export interface Trade {
  maker_order_id: string;
  taker_order_id: string;
  price: number;
  size: number;
  timestamp: number;
}
