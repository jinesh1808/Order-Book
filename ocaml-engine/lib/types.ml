type side = Buy | Sell

type tick = {
  t_symbol: string;
  t_price: float;
  t_size: float;
  t_side: side;
  t_timestamp: int;
}

type book_level = {
  l_price: float;
  l_size: float;
}

type book_snapshot = {
  s_symbol: string;
  s_bids: book_level list;
  s_asks: book_level list;
  s_timestamp: int;
}
