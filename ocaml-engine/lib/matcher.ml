open Types

module Float = struct
  type t = float
  let compare a b = compare a b
end

module BidMap = Map.Make(struct
  type t = float
  let compare a b = compare b a (* Descending order for bids *)
end)

module AskMap = Map.Make(Float) (* Ascending order for asks *)

module Fifo = struct
  type 'a t = { front: 'a list; back: 'a list }
  let empty = { front = []; back = [] }
  let enqueue q x = { q with back = x :: q.back }
  let rec dequeue q =
    match q.front with
    | x :: xs -> Some (x, { q with front = xs })
    | [] -> 
      match q.back with
      | [] -> None
      | _ -> dequeue { front = List.rev q.back; back = [] }
  let to_list q = q.front @ List.rev q.back
  let remove q pred = 
    let filtered = to_list q |> List.filter (fun x -> not (pred x)) in
    { front = filtered; back = [] }
  let is_empty q = q.front = [] && q.back = []
end

type book_state = {
  mutable bids: order Fifo.t BidMap.t;
  mutable asks: order Fifo.t AskMap.t;
  mutable last_price: float;
}

let match_order state (incoming: order) : trade list * order option =
  let rec process_buy order trades =
    match AskMap.min_binding_opt state.asks with
    | None -> (List.rev trades, Some order)
    | Some (best_ask_price, ask_queue) ->
        if order.o_price >= best_ask_price then
          match Fifo.dequeue ask_queue with
          | None ->
              state.asks <- AskMap.remove best_ask_price state.asks;
              process_buy order trades
          | Some (maker_order, rest_queue) ->
              let exec_price = best_ask_price in
              let exec_size = min order.o_size maker_order.o_size in
              let trade = {
                tr_maker_order_id = maker_order.o_id;
                tr_taker_order_id = order.o_id;
                tr_price = exec_price;
                tr_size = exec_size;
                tr_timestamp = order.o_timestamp;
              } in
              let new_trades = trade :: trades in
              let rem_maker_size = maker_order.o_size -. exec_size in
              let rem_taker_size = order.o_size -. exec_size in
              
              if rem_maker_size > 0.000001 then (
                let new_maker = { maker_order with o_size = rem_maker_size } in
                (* Prepend remaining maker size so it keeps its time priority! *)
                (* Fifo doesn't natively support prepend, but since it's just the front we can do this directly: *)
                let new_queue = { rest_queue with front = new_maker :: rest_queue.front } in
                state.asks <- AskMap.add best_ask_price new_queue state.asks
              ) else (
                if Fifo.is_empty rest_queue then
                  state.asks <- AskMap.remove best_ask_price state.asks
                else
                  state.asks <- AskMap.add best_ask_price rest_queue state.asks
              );
              
              state.last_price <- exec_price;
              
              if rem_taker_size > 0.000001 then
                process_buy { order with o_size = rem_taker_size } new_trades
              else
                (List.rev new_trades, None)
        else
          (List.rev trades, Some order)
  in

  let rec process_sell order trades =
    match BidMap.min_binding_opt state.bids with
    | None -> (List.rev trades, Some order)
    | Some (best_bid_price, bid_queue) ->
        if order.o_price <= best_bid_price then
          match Fifo.dequeue bid_queue with
          | None ->
              state.bids <- BidMap.remove best_bid_price state.bids;
              process_sell order trades
          | Some (maker_order, rest_queue) ->
              let exec_price = best_bid_price in
              let exec_size = min order.o_size maker_order.o_size in
              let trade = {
                tr_maker_order_id = maker_order.o_id;
                tr_taker_order_id = order.o_id;
                tr_price = exec_price;
                tr_size = exec_size;
                tr_timestamp = order.o_timestamp;
              } in
              let new_trades = trade :: trades in
              let rem_maker_size = maker_order.o_size -. exec_size in
              let rem_taker_size = order.o_size -. exec_size in
              
              if rem_maker_size > 0.000001 then (
                let new_maker = { maker_order with o_size = rem_maker_size } in
                let new_queue = { rest_queue with front = new_maker :: rest_queue.front } in
                state.bids <- BidMap.add best_bid_price new_queue state.bids
              ) else (
                if Fifo.is_empty rest_queue then
                  state.bids <- BidMap.remove best_bid_price state.bids
                else
                  state.bids <- BidMap.add best_bid_price rest_queue state.bids
              );
              
              state.last_price <- exec_price;
              
              if rem_taker_size > 0.000001 then
                process_sell { order with o_size = rem_taker_size } new_trades
              else
                (List.rev new_trades, None)
        else
          (List.rev trades, Some order)
  in

  match incoming.o_side with
  | Buy -> process_buy incoming []
  | Sell -> process_sell incoming []
