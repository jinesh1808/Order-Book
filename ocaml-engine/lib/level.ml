open Types

let update_level (price: float) (size: float) (levels: book_level list) : book_level list =
  let rec aux acc remaining =
    match remaining with
    | [] ->
        if size > 0.0 then List.rev ({l_price=price; l_size=size} :: acc) else List.rev acc
    | lvl :: rest ->
        if lvl.l_price = price then
          if size > 0.0 then List.rev_append acc ({l_price=price; l_size=size} :: rest)
          else List.rev_append acc rest
        else
          aux (lvl :: acc) rest
  in
  aux [] levels
