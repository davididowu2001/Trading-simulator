import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function LiveChart({ ticker }) {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // 1. Grab the token from localStorage
    const token = localStorage.getItem('jwt');

    // 2. Pass the token safely as a query parameter (Fixed route!)
    const ws = new WebSocket(`ws://localhost:8080/ws/prices?token=${token}`); 

    // 3. As soon as the socket opens, send the ticker string
    ws.onopen = () => {
      setConnectionStatus('Connected');
      ws.send(ticker); 
    };

    // 4. Receive the continuous streaming JSON data from Go
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setCurrentPrice(data.price);

      setChartData((prevData) => {
        const updatedData = [...prevData, { time: data.timestamp, price: data.price }];
        
        if (updatedData.length > 30) {
          updatedData.shift();
        }
        return updatedData;
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setConnectionStatus('Connection Error');
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [ticker]); 

  return (
    <div className="trade-panel" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{ticker} Live Data</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{connectionStatus}</span>
        </div>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--profit-green)' }}>
          {currentPrice ? `$${currentPrice.toFixed(2)}` : '---'}
        </span>
      </div>

      <div style={{ width: '100%', height: '220px', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="var(--text-secondary)" 
              fontSize={11} 
              tickLine={false}
              orientation="right"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#0A7CFF" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}