export interface BookLevel {
  price: number;
  size: number;
  total?: number;
}

export interface BookSnapshot {
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
  timestamp: number;
}
