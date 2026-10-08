import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import { Tick, BookSnapshot } from './types';

export class OCamlBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private symbol: string;

  constructor(symbol: string) {
    super();
    this.symbol = symbol;
  }

  public start() {
    const enginePath = path.resolve(__dirname, '../../../ocaml-engine/_build/default/bin/main.exe');

    // Spawn the process
    this.process = spawn(enginePath, [this.symbol], {
      stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
    });

    if (!this.process || !this.process.stdout) {
      console.error('Failed to spawn OCaml engine');
      return;
    }

    let buffer = '';

    this.process.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');

      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'book') {
            this.emit('snapshot', parsed.data as BookSnapshot);
          } else if (parsed.type === 'trades') {
            this.emit('trades', parsed.data); // will type correctly later
          }
        } catch (e) {
          console.error('Failed to parse message from OCaml engine:', e, line);
        }
      }
    });

    this.process.on('close', (code) => {
      console.log(`OCaml engine exited with code ${code}`);
      // Engine band ho gaya (crash ya kill), to handle ko null kar do.
      // Ab sendOrder/cancelOrder/reset ke `this.process &&` checks false honge
      // aur band process ke stdin me write karke EPIPE error nahi aayega.
      this.process = null;
    });
  }

  public sendTick(tick: Tick) {
    if (this.process && this.process.stdin && !this.process.killed) {
      const line = `${tick.symbol} ${tick.price} ${tick.size} ${tick.side} ${tick.timestamp}\n`;
      this.process.stdin.write(line);
    }
  }

  public sendOrder(userId: string, side: 'buy' | 'sell', price: number, size: number, orderId: string) {
    if (this.process && this.process.stdin && !this.process.killed) {
      const line = `ORDER ${userId} ${side} ${price} ${size} ${orderId}\n`;
      this.process.stdin.write(line);
    }
  }

  public cancelOrder(orderId: string) {
    if (this.process && this.process.stdin && !this.process.killed) {
      const line = `CANCEL ${orderId}\n`;
      this.process.stdin.write(line);
    }
  }
  //resetting orderbook
  // /n is important , as ocaml reads line by line , else it will keep waiting and wont go ahead 
  public reset() {
    if (this.process && this.process.stdin && !this.process.killed) {
      this.process.stdin.write('RESET\n');
    }
  }

  public stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
