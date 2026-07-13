import React from 'react';
import { useOrderBookSocket } from './hooks/useOrderBookSocket';
import { OrderBookTable } from './components/OrderBookTable';
import { PriceChart } from './components/PriceChart';
import './styles/tokens.css';

function App() {
  const { snapshot, isConnected } = useOrderBookSocket('btcusdt');

  // Compute maximum depth total for scaling bars
  const maxBidTotal = snapshot?.bids[snapshot.bids.length - 1]?.total || 0;
  const maxAskTotal = snapshot?.asks[snapshot.asks.length - 1]?.total || 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', gap: '20px', boxSizing: 'border-box' }}>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-hover)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Synthetic Order Book</h1>
          <span style={{
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: isConnected ? 'rgba(0, 184, 117, 0.2)' : 'rgba(255, 77, 77, 0.2)',
            color: isConnected ? 'var(--color-bid)' : 'var(--color-ask)'
          }}>
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Symbol: <strong style={{ color: 'var(--text-primary)' }}>BTC/USDT</strong>
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, gap: '24px', minHeight: 0 }}>
        {/* Left Column: Order Book */}
        <section style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--bg-hover)', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <OrderBookTable type="ask" levels={snapshot?.asks || []} maxTotal={maxTotal} />
            <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px solid var(--bg-hover)', borderBottom: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-base)', fontWeight: 600, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {snapshot?.asks[0]?.price.toFixed(2) || '---.--'}
              </span>
            </div>
            <OrderBookTable type="bid" levels={snapshot?.bids || []} maxTotal={maxTotal} />
          </div>
        </section>

        {/* Right Column: Charts and Info */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--bg-hover)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>Price Chart</h2>
            <div style={{ flex: 1 }}>
              <PriceChart snapshot={snapshot} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
