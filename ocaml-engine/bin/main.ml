open Engine.Types

let print_snapshot snapshot =
  let level_to_json lvl =
    Printf.sprintf "{\"price\":%f,\"size\":%f}" lvl.l_price lvl.l_size
  in
  let bids_json = String.concat "," (List.map level_to_json snapshot.s_bids) in
  let asks_json = String.concat "," (List.map level_to_json snapshot.s_asks) in
  let json = 
    Printf.sprintf 
      "{\"type\":\"book\",\"data\":{\"symbol\":\"%s\",\"bids\":[%s],\"asks\":[%s],\"timestamp\":%d}}"
      snapshot.s_symbol bids_json asks_json snapshot.s_timestamp
  in
  print_endline json

let print_trades trades =
  if trades <> [] then
    let trade_to_json tr =
      Printf.sprintf "{\"maker_order_id\":\"%s\",\"taker_order_id\":\"%s\",\"price\":%f,\"size\":%f,\"timestamp\":%d}"
        tr.tr_maker_order_id tr.tr_taker_order_id tr.tr_price tr.tr_size tr.tr_timestamp
    in
    let trades_json = String.concat "," (List.map trade_to_json trades) in
    let json = Printf.sprintf "{\"type\":\"trades\",\"data\":[%s]}" trades_json in
    print_endline json

let rec loop book =
  try
    let line = input_line stdin in
    let tokens = String.split_on_char ' ' line in
    match tokens with
    | "ORDER" :: user_id :: side_str :: price_str :: size_str :: order_id :: _ ->
        let side = if side_str = "buy" then Buy else Sell in
        let price = float_of_string price_str in
        let size = float_of_string size_str in
        let timestamp = int_of_float (Unix.gettimeofday () *. 1000.) in
        let order = {
          o_id = order_id;
          o_user = user_id;
          o_side = side;
          o_price = price;
          o_size = size;
          o_timestamp = timestamp;
        } in
        let (trades, snapshot) = Engine.Book.add_limit_order book order in
        print_trades trades;
        print_snapshot snapshot;
        flush stdout;
        loop book
    | "CANCEL" :: order_id :: _ ->
        let snapshot = Engine.Book.cancel_order book order_id in
        print_snapshot snapshot;
        flush stdout;
        loop book
    | symbol :: price_str :: size_str :: side_str :: timestamp_str :: _ ->
        (* Binace tick *)
        let price = float_of_string price_str in
        let size = float_of_string size_str in
        let side = if side_str = "buy" then Buy else Sell in
        let timestamp = int_of_string timestamp_str in
        let tick = { t_symbol=symbol; t_price=price; t_size=size; t_side=side; t_timestamp=timestamp } in
        let snapshot = Engine.Book.apply_tick book tick in
        print_snapshot snapshot;
        flush stdout;
        loop book
    | _ -> loop book
  with
  | End_of_file -> ()
  | e -> 
      Printf.eprintf "Error: %s\n" (Printexc.to_string e);
      flush stderr;
      loop book

let () =
  let symbol = 
    if Array.length Sys.argv > 1 then Sys.argv.(1) else "btcusdt"
  in
  let book = Engine.Book.empty symbol in
  loop book
