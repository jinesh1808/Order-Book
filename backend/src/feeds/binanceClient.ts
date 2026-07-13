import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Tick } from '../engine/types';

export class BinanceClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private symbol: string;

  constructor(symbol: string = 'btcusdt') {
    super();
    this.symbol = symbol.toLowerCase();
  }

  public connect() {
    // Connect to Binance trade stream
    const url = `wss://stream.binance.com:9443/ws/${this.symbol}@trade`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log(`Connected to Binance for ${this.symbol}`);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.e === 'trade') {
          const tick: Tick = {
            symbol: this.symbol.toUpperCase(),
            price: parseFloat(parsed.p),
            size: parseFloat(parsed.q),
            side: parsed.m ? 'sell' : 'buy', // m = is the buyer the market maker?
            timestamp: parsed.T
          };
          this.emit('tick', tick);
        }
      } catch (e) {
        console.error('Failed to parse Binance message', e);
      }
    });

    this.ws.on('close', () => {
      console.log('Binance WS closed. Reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('Binance WS Error:', err);
      this.ws?.close();
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
