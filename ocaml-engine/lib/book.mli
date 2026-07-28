open Types

(** Core Order Book State *)
type t

(** Creates a new empty order book for a symbol *)
val empty : string -> t

(** Add a limit order to the book, returning generated trades and updated book snapshot *)
val add_limit_order : t -> order -> trade list * book_snapshot

(** Cancel an order by id, returning updated book snapshot *)
val cancel_order : t -> string -> book_snapshot

(** Applies a trade tick. For a pure real book, this might just update reference price 
    or act as a market order. We'll just update last price for now and return snapshot. *)
val apply_tick : t -> tick -> book_snapshot

(** Get current snapshot *)
val get_snapshot : t -> book_snapshot
