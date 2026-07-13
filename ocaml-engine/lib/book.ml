open Types

type t = {
  symbol: string;
  mutable last_price: float;
}

let empty symbol = {
  symbol;
  last_price = 0.0;
}

let generate_levels center_price side depth =
  let spread = 0.1 in
  let price_step = 0.5 in
  let rec aux d acc =
    if d = 0 then List.rev acc
    else
      let dist = float_of_int (depth - d + 1) in
      let price = 
        match side with
        | Buy -> center_price -. (spread /. 2.0) -. (dist *. price_step)
        | Sell -> center_price +. (spread /. 2.0) +. (dist *. price_step)
      in
      let hash = Hashtbl.hash price in
      let base_size = float_of_int (hash mod 100) /. 10.0 +. 0.5 in
      let noise = (Random.float 0.4) -. 0.2 in
      let size = max 0.01 (base_size +. noise) in
      aux (d - 1) ({l_price=price; l_size=size} :: acc)
  in
  aux depth []

let apply_tick t tick =
  t.last_price <- tick.t_price;
  let bids = generate_levels tick.t_price Buy 15 in
  let asks = generate_levels tick.t_price Sell 15 in
  {
    s_symbol = t.symbol;
    s_bids = bids;
    s_asks = asks;
    s_timestamp = tick.t_timestamp;
  }
