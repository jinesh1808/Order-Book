import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { BinanceClient } from './feeds/binanceClient';
import { OCamlBridge } from './engine/ocamlBridge';
import { BookGateway } from './sockets/bookGateway';

const app = express();
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

// Components
const symbol = 'btcusdt';
const binanceClient = new BinanceClient(symbol);
const ocamlBridge = new OCamlBridge(symbol);
const bookGateway = new BookGateway(io);

// Wiring
binanceClient.on('tick', (tick) => {
  ocamlBridge.sendTick(tick);
});

ocamlBridge.on('snapshot', (snapshot) => {
  bookGateway.broadcastSnapshot(snapshot);
});

// Start services
ocamlBridge.start();
binanceClient.connect();

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
