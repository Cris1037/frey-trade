'use client';
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useTheme } from '../app/_utils/theme-context';

export default function TradingChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { theme } = useTheme();

  // Create / recreate chart when data changes
  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    const isDark = theme !== 'light';
    const textColor   = isDark ? '#94A3B8' : '#475569';
    const gridColor   = isDark ? 'rgba(59,130,246,0.08)'  : 'rgba(100,116,139,0.12)';
    const borderColor = isDark ? 'rgba(30,58,95,0.5)'     : 'rgba(203,213,225,0.8)';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: 'transparent' },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: true },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update colors when theme changes without recreating the chart
  useEffect(() => {
    if (!chartRef.current) return;
    const isDark = theme !== 'light';
    chartRef.current.applyOptions({
      layout: { textColor: isDark ? '#94A3B8' : '#475569' },
      grid: {
        vertLines: { color: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(100,116,139,0.12)' },
        horzLines: { color: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(100,116,139,0.12)' },
      },
      rightPriceScale: { borderColor: isDark ? 'rgba(30,58,95,0.5)' : 'rgba(203,213,225,0.8)' },
      timeScale:       { borderColor: isDark ? 'rgba(30,58,95,0.5)' : 'rgba(203,213,225,0.8)' },
    });
  }, [theme]);

  return <div ref={containerRef} className="w-full h-[380px]" />;
}
