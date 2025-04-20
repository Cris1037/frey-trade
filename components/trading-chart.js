//components/TradingChart.jsx
'use client';
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function TradingChart({ data }) {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data?.length) return;

    const chart = createChart(chartContainerRef.current, {
      width: 900,
      height: 500,
      layout: {
        background: { color: '#123A41' },
        textColor: '#C4BB96',
      },
      grid: {
        vertLines: { color: '#C4BB96' },
        horzLines: { color: '#C4BB96' },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#48BB78',
      downColor: '#FC8181',
      wickUpColor: '#48BB78',
      wickDownColor: '#FC8181',
    });

    candlestickSeries.setData(data);

    const resizeHandler = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth
      });
    };

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-900 h-[500px]" />;
}