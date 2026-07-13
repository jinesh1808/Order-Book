import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { BookSnapshot } from '../types/book';

interface Props {
  snapshot: BookSnapshot | null;
}

export const PriceChart: React.FC<Props> = ({ snapshot }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#8c8c9a',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const series = chart.addLineSeries({
      color: '#4d88ff',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (snapshot && seriesRef.current) {
      // Approximate mid price
      const bestBid = snapshot.bids[0]?.price || 0;
      const bestAsk = snapshot.asks[0]?.price || 0;
      if (bestBid && bestAsk) {
        const mid = (bestBid + bestAsk) / 2;
        // Lightweight charts requires time in seconds
        seriesRef.current.update({
          time: Math.floor(snapshot.timestamp / 1000) as any,
          value: mid,
        });
      }
    }
  }, [snapshot]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
};
