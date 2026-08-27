import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { BinanceClient } from './feeds/binanceClient';
import { OCamlBridge } from './engine/ocamlBridge';
import { BookGateway } from './sockets/bookGateway';
import { MarketMaker } from './engine/marketMaker';
import { Order, Trade } from './engine/types';
import db from './db';

// User ID -> array of timestamps (jab order place kiya)
const userOrderTimestamps = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();//present time
  const oneSecondAgo = now - 1000;

  //now finding older timestamps for this user
  const timestamps = userOrderTimestamps.get(userId) || [];

  // sirf woh timestamps rakh raha hu jo last 1 second ke andar hain
  const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
  //if in the past 5 secs there are already 5 ormore than , then reject
  if (recentTimestamps.length >= 5) {
    return true;//rate is limited
  }
  //new timestamps for current orders 
  recentTimestamps.push(now);
  userOrderTimestamps.set(userId, recentTimestamps);

  return false;//then proceed this order

}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// "DB" tables removed in favor of SQLite
let lastKnownPrice = 0;

// Components
const symbol = 'btcusdt';
const binanceClient = new BinanceClient(symbol);
const ocamlBridge = new OCamlBridge(symbol);
const bookGateway = new BookGateway(io);

// Reusable order placement function
function placeOrder(user_id: string, side: 'buy' | 'sell', price: number, size: number, orderId: string) {
  const newOrder: Order = {
    id: orderId,
    user_id,
    side,
    price,
    size,
    timestamp: Date.now(),
    status: 'open',
  };

  const stmt = db.prepare('INSERT INTO orders (id, user_id, side, price, size, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(newOrder.id, newOrder.user_id, newOrder.side, newOrder.price, newOrder.size, newOrder.timestamp, newOrder.status);

  ocamlBridge.sendOrder(user_id, side, price, size, orderId);
  return newOrder;
}

const marketMaker = new MarketMaker(
  () => lastKnownPrice,
  placeOrder
);

app.post('/orders', (req, res) => {
  const { user_id, side, price, size } = req.body;
  if (!user_id || !side || !price || !size) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (isRateLimited(user_id)) {
    return res.status(429).json({ error: 'Too many orders, please slow down' });
  }
  //price validation and size validation 
  const numPrice = Number(price);
  const numSize = Number(size);
  if (numSize < 0.0001 || numSize > 2) {// order ka limit
    return res.status(400).json({ error: 'Order size must be between 0.0001 and 2' });
  }
  if (lastKnownPrice > 0) {
    const maxDeviation = lastKnownPrice * 0.2;//20% ka range
    if (Math.abs(numPrice - lastKnownPrice) > maxDeviation) {
      return res.status(400).json({ error: 'Price too far from current market price' });
    }
  }
  const orderId = uuidv4();
  const newOrder = placeOrder(user_id, side, Number(price), Number(size), orderId);
  res.json(newOrder);
});

app.get('/api/trades/history', (req, res) => {
  try {
    const trades = db.prepare(
      'SELECT price, size, timestamp FROM trades ORDER BY timestamp ASC LIMIT 200'
    ).all();
    res.json(trades);
  } catch (err) {
    console.error('Error fetching trade history:', err);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});
app.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY timestamp DESC').all();
  res.json(orders);
});

function resetBook(){
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM trades').run();
    console.log('Book reset: orders and trades cleared');
}



// Wiring
let tickCount = 0;
binanceClient.on('tick', (tick) => {
  lastKnownPrice = tick.price;
  tickCount++;
  if (tickCount % 10 === 0) console.log('Ticks received:', tickCount, 'Latest price:', tick.price);
  ocamlBridge.sendTick(tick);
});

ocamlBridge.on('snapshot', (snapshot) => {
  if (tickCount % 10 === 0) console.log('Snapshot received from OCaml');
  bookGateway.broadcastSnapshot(snapshot);
});

ocamlBridge.on('trades', (trades: Trade[]) => {
  const insertTrade = db.prepare('INSERT INTO trades (maker_order_id, taker_order_id, price, size, timestamp) VALUES (?, ?, ?, ?, ?)');
  const updateOrder = db.prepare(`
    UPDATE orders 
    SET size = size - ?, 
        status = CASE WHEN (size - ?) <= 0.000001 THEN 'filled' ELSE status END 
    WHERE id = ?
  `);

  db.transaction(() => {
    trades.forEach(trade => {
      // Save trade
      insertTrade.run(trade.maker_order_id, trade.taker_order_id, trade.price, trade.size, trade.timestamp);
      lastKnownPrice = trade.price;

      // Update maker and taker orders
      updateOrder.run(trade.size, trade.size, trade.maker_order_id);
      updateOrder.run(trade.size, trade.size, trade.taker_order_id);
    });
  })();

  // Broadcast fills to frontend
  io.emit('fills', trades);
});

// Start services
ocamlBridge.start();
binanceClient.connect();
marketMaker.start();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  binanceClient.disconnect();
  ocamlBridge.stop();
  process.exit(0);
});
