open Types

(** Core Order Book State *)
type t

(** Creates a new empty order book for a symbol *)
val empty : string -> t

(** Applies a trade tick to generate a synthetic order book around the latest price. 
    Returns the updated order book snapshot. *)
val apply_tick : t -> tick -> book_snapshot
