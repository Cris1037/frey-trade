'use client';
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useTheme } from '../app/_utils/theme-context';

export default function PortfolioHistoryChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { theme } = useTheme();

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

    // Data is already formatted with time as YYYY-MM-DD
    const chartData = data.map((item) => ({
      time: item.time,
      value: item.value,
    }));

    const lineSeries = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2,
    });

    lineSeries.setData(chartData);
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
  }, [data, theme]);

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
