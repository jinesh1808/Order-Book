Overall Architecture
[Finnhub WebSocket] → [Node.js Backend] → [OCaml Order Book Engine] → [Socket.IO] → [React Frontend]
Real trade ticks feed your Node server, which pipes them into the OCaml simulator (as a subprocess or via a thin RPC layer), which maintains the actual book state and emits depth updates back out to the browser in real time.
APIs to use
1. Finnhub (free tier) — real-time trade prices

WebSocket: wss://ws.finnhub.io?token=YOUR_API_KEY
Subscribe: {"type":"subscribe","symbol":"AAPL"}
Free tier covers US equities trades — get a key at finnhub.io, takes 2 minutes

2. Binance WebSocket (free, no key) — if you want a real live order book to cross-check your simulator against, or as a fallback demo

wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms

You'll use Finnhub for realistic price motion, and your OCaml engine generates the synthetic bid/ask ladder around that price — that's the part that shows systems thinking.
Backend structure (Node.js)
backend/
├── src/
│   ├── server.ts              # Express + Socket.IO entry point
│   ├── feeds/
│   │   └── finnhubClient.ts   # connects to Finnhub WS, normalizes ticks
│   ├── engine/
│   │   ├── ocamlBridge.ts     # spawns OCaml process, sends ticks via stdin, reads book state via stdout (JSON lines)
│   │   └── types.ts           # shared types: Tick, BookLevel, BookSnapshot
│   ├── sockets/
│   │   └── bookGateway.ts     # broadcasts book updates to connected clients
│   └── routes/
│       └── health.ts
├── package.json
└── tsconfig.json
OCaml bridge pattern: compile your simulator to a standalone binary, spawn it with child_process.spawn, write ticks to its stdin as JSON lines, read book snapshots from stdout as JSON lines. This is the cleanest way to keep your OCaml logic pure and testable independently, while Node just handles I/O plumbing — exactly the kind of separation of concerns worth mentioning in an interview.
OCaml engine structure
ocaml-engine/
├── bin/
│   └── main.ml            # reads stdin loop, calls Book.apply_tick, prints snapshot
├── lib/
│   ├── book.ml             # core order book type + matching/level logic
│   ├── book.mli            # explicit interface — signals intentional API design
│   ├── level.ml             # price level aggregation
│   └── types.ml
├── test/
│   └── book_test.ml         # use OUnit or expect tests
└── dune-project
Keep book.mli disciplined — Jane Street reviewers notice deliberate module interfaces far more than clever implementation tricks.
Frontend structure (React)
frontend/
├── src/
│   ├── App.tsx
│   ├── hooks/
│   │   └── useOrderBookSocket.ts   # Socket.IO client, subscribes to book stream
│   ├── components/
│   │   ├── OrderBookTable.tsx      # bid/ask ladder, depth bars
│   │   ├── SpreadIndicator.tsx
│   │   ├── PriceChart.tsx          # recharts/lightweight-charts sparkline
│   │   ├── SymbolSelector.tsx
│   │   └── Layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── styles/
│   │   └── tokens.css              # dark theme, monospace numerals, tabular-nums
│   └── types/
│       └── book.ts
├── index.html
└── vite.config.ts
Premium look, concretely

Dark theme (near-black #0a0a0c, not pure black), green/red for bid/ask with low saturation — trading terminals avoid neon
Monospace font for all numbers (font-variant-numeric: tabular-nums) so digits don't jitter as they update
Depth bars behind price rows (horizontal bar width = relative size) — this single detail sells the "real terminal" feel
Subtle flash animation on row update (bg flash fading over ~300ms), not jarring color pops
Use lightweight-charts (by TradingView) for the price chart — free, and looks exactly like a real terminal