import React, { useEffect, useRef, useState } from 'react';
import { BookLevel } from '../types/book';
import '../styles/tokens.css';

interface Props {
  type: 'bid' | 'ask';
  levels: BookLevel[];
  maxTotal: number;
}

const Row = React.memo(({ level, type, maxTotal }: { level: BookLevel, type: 'bid'|'ask', maxTotal: number }) => {
  const [flash, setFlash] = useState('');
  const prevSize = useRef(level.size);

  useEffect(() => {
    if (level.size !== prevSize.current) {
      setFlash(type === 'bid' ? 'flash-bid' : 'flash-ask');
      const timer = setTimeout(() => setFlash(''), 300);
      prevSize.current = level.size;
      return () => clearTimeout(timer);
    }
  }, [level.size, type]);

  const depthPercent = maxTotal > 0 ? ((level.total || 0) / maxTotal) * 100 : 0;

  return (
    <div className={`depth-bar-container ${flash}`} style={{ display: 'flex', padding: '4px 8px', fontSize: '13px' }}>
      <div className={`depth-bar ${type}`} style={{ width: `${depthPercent}%` }} />
      <div className="row-content tabular-nums" style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        {type === 'bid' ? (
          <>
            <span style={{ color: 'var(--text-primary)' }}>{level.size.toFixed(4)}</span>
            <span style={{ color: 'var(--color-bid)' }}>{level.price.toFixed(2)}</span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--color-ask)' }}>{level.price.toFixed(2)}</span>
            <span style={{ color: 'var(--text-primary)' }}>{level.size.toFixed(4)}</span>
          </>
        )}
      </div>
    </div>
  );
});

export const OrderBookTable: React.FC<Props> = ({ type, levels, maxTotal }) => {
  // Asks are usually displayed from highest price to lowest price above the spread.
  // Wait, standard view: Asks on top (highest at top, lowest at bottom), Bids on bottom (highest at top, lowest at bottom).
  // But our levels array from OCaml might be in some order. We will sort them here just in case.
  const sortedLevels = [...levels].sort((a, b) => 
    type === 'ask' ? b.price - a.price : b.price - a.price
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '4px 8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
        {type === 'bid' ? (
          <>
            <span>Size</span>
            <span style={{ marginLeft: 'auto' }}>Price</span>
          </>
        ) : (
          <>
            <span>Price</span>
            <span style={{ marginLeft: 'auto' }}>Size</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {sortedLevels.map(level => (
          <Row key={level.price} level={level} type={type} maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
};
