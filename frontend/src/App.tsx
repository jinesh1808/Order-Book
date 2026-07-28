import { useOrderBookSocket } from './hooks/useOrderBookSocket';
import { OrderBookTable } from './components/OrderBookTable';
import { PriceChart } from './components/PriceChart';
import { OrderForm } from './components/OrderForm';
import './styles/tokens.css';

function App() {
  const { snapshot, isConnected, fills } = useOrderBookSocket('btcusdt');

  // Compute maximum depth total for scaling bars
  const maxBidTotal = snapshot && snapshot.bids.length > 0 ? snapshot.bids[snapshot.bids.length - 1]?.total || 0 : 0;
  const maxAskTotal = snapshot && snapshot.asks.length > 0 ? snapshot.asks[snapshot.asks.length - 1]?.total || 0 : 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const lastPrice = snapshot?.asks?.[0]?.price || snapshot?.bids?.[0]?.price || undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', gap: '20px', boxSizing: 'border-box' }}>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-hover)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Real Order Book</h1>
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
                {lastPrice?.toFixed(2) || '---.--'}
              </span>
            </div>
            <OrderBookTable type="bid" levels={snapshot?.bids || []} maxTotal={maxTotal} />
          </div>
        </section>

        {/* Right Column: Charts and Order Form */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 2, backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--bg-hover)', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>Price Chart</h2>
              <div style={{ flex: 1 }}>
                <PriceChart snapshot={snapshot} initialTrades={fills} />
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <OrderForm lastPrice={lastPrice} />
            </div>
          </div>
          
          {/* Fills List */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--bg-hover)', padding: '16px', flex: 1, minHeight: '200px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>Recent Fills</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fills.slice().reverse().map((fill, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: '4px', border: '1px solid var(--bg-hover)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Price: <strong style={{ color: 'var(--text-primary)' }}>{fill.price.toFixed(2)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Size: <strong style={{ color: 'var(--text-primary)' }}>{fill.size.toFixed(4)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(fill.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {fills.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  No fills yet
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
