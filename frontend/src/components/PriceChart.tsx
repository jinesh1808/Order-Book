import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries, type UTCTimestamp, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { BookSnapshot } from '../types/book';
import type { Trade } from '../hooks/useOrderBookSocket';

interface Props {
  snapshot: BookSnapshot | null;
  initialTrades?: Trade[];
}

export const PriceChart: React.FC<Props> = ({ snapshot, initialTrades }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const initializedRef = useRef(false);

  // 1. Chart ek hi baar create kar (mount pe)
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: containerRef.current.clientWidth,
      height: 300,
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#4d88ff',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // 2. Purana history load kar (ek hi baar)
  useEffect(() => {
    if (initialTrades && initialTrades.length > 0 && !initializedRef.current && seriesRef.current) {
      const sorted = [...initialTrades].sort((a, b) => a.timestamp - b.timestamp);
      const formatted = sorted.map(t => ({
        time: Math.floor(t.timestamp / 1000) as UTCTimestamp,
        value: t.price,
      }));
      seriesRef.current.setData(formatted);
      initializedRef.current = true;
    }
  }, [initialTrades]);

  // 3. Live snapshot aane pe naya point add kar
  useEffect(() => {
    if (snapshot && seriesRef.current && initializedRef.current) {
      const bestBid = snapshot.bids[0]?.price || 0;
      const bestAsk = snapshot.asks[0]?.price || 0;
      if (bestBid && bestAsk) {
        const mid = (bestBid + bestAsk) / 2;
        seriesRef.current.update({
          time: Math.floor(snapshot.timestamp / 1000) as UTCTimestamp,
          value: mid,
        });
      }
    }
  }, [snapshot]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  );
};