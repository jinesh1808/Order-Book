import { v4 as uuidv4 } from 'uuid';

export class MarketMaker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly botUserId = 'bot_market_maker';

  constructor(
    private getReferencePrice: () => number,
    private placeOrder: (userId: string, side: 'buy' | 'sell', price: number, size: number, orderId: string) => void
  ) {}

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Market Maker bot started');

    // Run every 2 seconds
    this.intervalId = setInterval(() => {
      const refPrice = this.getReferencePrice();
      if (!refPrice || refPrice <= 0) return;

      // 1. Post resting orders to build depth (liquidity provision)
      this.postRestingOrders(refPrice);

      // 2. Occasionally post a crossing order to simulate active trading
      if (Math.random() < 0.2) { // 20% chance every 2 seconds
        this.postCrossingOrder(refPrice);
      }
    }, 2000);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Market Maker bot stopped');
  }

  private postRestingOrders(refPrice: number) {
    // Post 2 random buy orders below the ref price
    for (let i = 0; i < 2; i++) {
      const offset = (Math.random() * 50) + 1; // 1 to 51 dollars away
      const price = Number((refPrice - offset).toFixed(2));
      const size = Number((Math.random() * 0.5 + 0.01).toFixed(4));
      this.placeOrder(this.botUserId, 'buy', price, size, uuidv4());
    }

    // Post 2 random sell orders above the ref price
    for (let i = 0; i < 2; i++) {
      const offset = (Math.random() * 50) + 1; // 1 to 51 dollars away
      const price = Number((refPrice + offset).toFixed(2));
      const size = Number((Math.random() * 0.5 + 0.01).toFixed(4));
      this.placeOrder(this.botUserId, 'sell', price, size, uuidv4());
    }
  }

  private postCrossingOrder(refPrice: number) {
    // To cross, we submit a buy order slightly ABOVE the ref price, or a sell slightly BELOW.
    // This assumes there's liquidity there.
    const isBuy = Math.random() > 0.5;
    const size = Number((Math.random() * 0.2 + 0.01).toFixed(4));
    
    if (isBuy) {
      const price = Number((refPrice + 10).toFixed(2)); // aggressive buy
      this.placeOrder(this.botUserId, 'buy', price, size, uuidv4());
    } else {
      const price = Number((refPrice - 10).toFixed(2)); // aggressive sell
      this.placeOrder(this.botUserId, 'sell', price, size, uuidv4());
    }
  }
}
