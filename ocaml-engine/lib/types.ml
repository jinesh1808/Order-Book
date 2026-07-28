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

type order = {
  o_id: string;
  o_user: string;
  o_side: side;
  o_price: float;
  o_size: float;
  o_timestamp: int;
}

type trade = {
  tr_maker_order_id: string;
  tr_taker_order_id: string;
  tr_price: float;
  tr_size: float;
  tr_timestamp: int;
}
