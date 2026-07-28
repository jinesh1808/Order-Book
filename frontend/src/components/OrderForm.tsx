import { useState } from 'react';
import type { FormEvent } from 'react';

export function OrderForm({ lastPrice }: { lastPrice?: number }) {
  const [userId] = useState(() => `user_${Math.floor(Math.random() * 10000)}`);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>(lastPrice?.toString() || '');
  const [size, setSize] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!price || !size) return;

    setErrorMsg(null);// Har naye submit se pehle purana error clear kar do

    try {
      const res = await fetch('http://localhost:3001/orders', {//we are now storing response in res
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          side,
          price: Number(price),
          size: Number(size),
        })
      });
      // Response body ko JSON mein convert kar rahe hain (backend ka reply padhne ke liye)
      const data = await res.json();

      if (data.error) {
        // Agar backend ne error bheja (rate limit/price/size), usse UI mein dikhao
        setErrorMsg(data.error);
      } else {
        // Sab theek hai, form clear kar do jaisa pehle hota tha
        setSize('');
      }
      // Optionally reset form
      setSize('');
    } catch (err) {
      console.error('Failed to submit order', err);
      // Network fail hone pe bhi user ko kuch dikhe
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-hover)' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>Place Order (User: {userId})</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setSide('buy')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: side === 'buy' ? 'var(--color-bid)' : 'var(--bg-hover)',
            color: side === 'buy' ? '#fff' : 'var(--text-primary)'
          }}>
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: side === 'sell' ? 'var(--color-ask)' : 'var(--bg-hover)',
            color: side === 'sell' ? '#fff' : 'var(--text-primary)'
          }}>
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Agar errorMsg mein kuch hai, ek red banner dikhao. Agar null hai, kuch render nahi hoga  */}
        {/* imp to display the error */}
        {errorMsg && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '13px'
          }}>
            {errorMsg}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--bg-hover)',
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Size</label>
          <input
            type="number"
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--bg-hover)',
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '4px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: side === 'buy' ? 'var(--color-bid)' : 'var(--color-ask)',
            color: '#fff'
          }}>
          {side === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
        </button>
      </form>
    </div>
  );
}
