import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const mockData = [
  { time: '2023-01-01', open: 100, high: 120, low: 90, close: 110 },
  { time: '2023-01-02', open: 110, high: 130, low: 105, close: 125 },
  // Add more data...
];

export default function TradingChart() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#FFFFFF' },
        textColor: '#2D3748',
      },
      grid: {
        vertLines: { color: '#E2E8F0' },
        horzLines: { color: '#E2E8F0' },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#48BB78',    // Green for bullish
      downColor: '#FC8181',  // Red for bearish
      wickUpColor: '#48BB78',
      wickDownColor: '#FC8181',
    });

    candlestickSeries.setData(mockData);

    // Handle resizing
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
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-[#46708D]">Trading Chart</h2>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
}