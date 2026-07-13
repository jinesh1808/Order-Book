open Engine.Types

let rec loop book =
  try
    let line = input_line stdin in
    Scanf.sscanf line "%s %f %f %s %d" (fun symbol price size side_str timestamp ->
      let side = if side_str = "buy" then Buy else Sell in
      let tick = { t_symbol=symbol; t_price=price; t_size=size; t_side=side; t_timestamp=timestamp } in
      let snapshot = Engine.Book.apply_tick book tick in
      
      let level_to_json lvl =
        Printf.sprintf "{\"price\":%f,\"size\":%f}" lvl.l_price lvl.l_size
      in
      let bids_json = String.concat "," (List.map level_to_json snapshot.s_bids) in
      let asks_json = String.concat "," (List.map level_to_json snapshot.s_asks) in
      let json = 
        Printf.sprintf 
          "{\"symbol\":\"%s\",\"bids\":[%s],\"asks\":[%s],\"timestamp\":%d}"
          snapshot.s_symbol bids_json asks_json snapshot.s_timestamp
      in
      print_endline json;
      flush stdout;
      loop book
    )
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
