open Types
open Matcher

type t = book_state
(* creating reset function *)
let reset t =
  t.bids <- BidMap.empty;
  t.asks <- AskMap.empty;
  t.last_price <- 0.0;
  get_snapshot t

let empty _symbol = {
  bids = BidMap.empty;
  asks = AskMap.empty;
  last_price = 0.0;
}

let get_snapshot t =
  let bid_levels = 
    BidMap.fold (fun price queue acc ->
      let total_size = List.fold_left (fun sum o -> sum +. o.o_size) 0.0 (Fifo.to_list queue) in
      if total_size > 0.0 then { l_price = price; l_size = total_size } :: acc else acc
    ) t.bids [] |> List.rev
  in
  let ask_levels = 
    AskMap.fold (fun price queue acc ->
      let total_size = List.fold_left (fun sum o -> sum +. o.o_size) 0.0 (Fifo.to_list queue) in
      if total_size > 0.0 then { l_price = price; l_size = total_size } :: acc else acc
    ) t.asks [] |> List.rev
  in
  {
    s_symbol = "btcusdt"; (* Or keep it in the book state, but since it's hardcoded for now, this is fine, or we can add it to book_state *)
    s_bids = bid_levels;
    s_asks = ask_levels;
    s_timestamp = int_of_float (Unix.gettimeofday () *. 1000.);
  }

let apply_tick t tick =
  t.last_price <- tick.t_price;
  get_snapshot t

let cancel_order t order_id =
  let clean_bid_map = BidMap.map (fun q -> Fifo.remove q (fun o -> o.o_id = order_id)) t.bids in
  let clean_ask_map = AskMap.map (fun q -> Fifo.remove q (fun o -> o.o_id = order_id)) t.asks in
  
  (* Clean up empty levels *)
  let clean_bid_map = BidMap.filter (fun _ q -> not (Fifo.is_empty q)) clean_bid_map in
  let clean_ask_map = AskMap.filter (fun _ q -> not (Fifo.is_empty q)) clean_ask_map in
  
  t.bids <- clean_bid_map;
  t.asks <- clean_ask_map;
  get_snapshot t

let add_limit_order t order =
  let trades, rem_order_opt = Matcher.match_order t order in
  
  (match rem_order_opt with
   | Some rem_order ->
       (match rem_order.o_side with
        | Buy ->
            let existing = match BidMap.find_opt rem_order.o_price t.bids with Some q -> q | None -> Fifo.empty in
            t.bids <- BidMap.add rem_order.o_price (Fifo.enqueue existing rem_order) t.bids
        | Sell ->
            let existing = match AskMap.find_opt rem_order.o_price t.asks with Some q -> q | None -> Fifo.empty in
            t.asks <- AskMap.add rem_order.o_price (Fifo.enqueue existing rem_order) t.asks)
   | None -> ());
   
  (trades, get_snapshot t)
