open Types

module Float : Map.OrderedType with type t = float
module BidMap : Map.S with type key = float
module AskMap : Map.S with type key = float

(** A pure functional FIFO queue *)
module Fifo : sig
  type 'a t
  val empty : 'a t
  val enqueue : 'a t -> 'a -> 'a t
  val dequeue : 'a t -> ('a * 'a t) option
  val to_list : 'a t -> 'a list
  val remove : 'a t -> ('a -> bool) -> 'a t
  val is_empty : 'a t -> bool
end

type book_state = {
  mutable bids: order Fifo.t BidMap.t;
  mutable asks: order Fifo.t AskMap.t;
  mutable last_price: float;
}

(** Match an incoming order against the book. 
    Returns the generated trades and the remainder of the order (if not fully filled). 
    Mutates the book_state to reflect matches. *)
val match_order : book_state -> order -> trade list * order option
