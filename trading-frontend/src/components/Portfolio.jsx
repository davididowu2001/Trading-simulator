import  { useEffect, useState } from 'react';
import { fetchWithAuth } from '../api';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom'

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await fetchWithAuth('/portfolio');
        setPortfolio(data);
      } catch (error) {
        console.error('Failed to fetch portfolio', error);
      }
    };
    loadPortfolio();
  }, []);

  if (!portfolio) return <div className="container">Loading portfolio...</div>;

  // 1. Calculate Totals
  const validPositions = portfolio.positions?.filter(stock => stock.ticker !== "") || [];
  const holdingsValue = validPositions.reduce((sum, stock) => sum + stock.current_value, 0);
  const totalAccountValue = portfolio.balance + holdingsValue;

  // 2. Prepare Chart Data (Cash + Each Stock)
  const chartData = [
    { name: 'Available Cash', value: portfolio.balance },
    ...validPositions.map(stock => ({
      name: stock.ticker,
      value: stock.current_value
    }))
  ].filter(item => item.value > 0); // Hide empty slices

  // T212-style color palette for the chart
  const COLORS = ['#8B95A1', '#0A7CFF', '#00DB65', '#9D4EDD', '#FF9F1C', '#EF476F'];

  return (
    <div>
     <nav style={{ justifyContent: 'space-between', alignItems: 'center' }}>
     <div style={{ display: 'flex', gap: '20px' }}>
       <Link to="/portfolio" style={{ color: 'var(--text-primary)' }}>Portfolio</Link>
       <Link to="/trade">Trade</Link>
       <Link to="/history">History</Link>
     </div>
     <button 
       onClick={handleLogout} 
       style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
     >
       Sign Out
     </button>
   </nav>
      <div className="container">
        {/* Top Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="subtitle" style={{ marginBottom: '5px' }}>Total Portfolio Value</div>
          <h2 style={{ fontSize: '36px', margin: '0' }}>${totalAccountValue.toFixed(2)}</h2>
        </div>

        {/* Chart Section */}
        <div className="chart-container" style={{ height: '250px', marginBottom: '40px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Investments List Section */}
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
          Investments
        </h3>
        
        <ul className="holdings-list">
          {/* Always show cash as the first "holding" */}
          <li className="holding-card" style={{ borderLeft: `4px solid ${COLORS[0]}` }}>
            <div className="holding-left">
              <h3>Available Cash</h3>
              <p>Ready to invest</p>
            </div>
            <div className="holding-right">
              <p className="value">${portfolio.balance.toFixed(2)}</p>
            </div>
          </li>

          {/* Map through the stocks */}
          {validPositions.map((stock, index) => {
            // Calculate if the stock is up or down
            const totalReturn = stock.current_value - (stock.shares * stock.average_price);
            const returnPercent = (totalReturn / (stock.shares * stock.average_price)) * 100;
            const isPositive = totalReturn >= 0;

            return (
              <li key={stock.ticker} className="holding-card" style={{ borderLeft: `4px solid ${COLORS[(index + 1) % COLORS.length]}` }}>
                <div className="holding-left">
                  <h3>{stock.ticker}</h3>
                  <p>{stock.shares} shares @ ${stock.average_price.toFixed(2)}</p>
                </div>
                <div className="holding-right">
                  <p className="value">${stock.current_value.toFixed(2)}</p>
                  <p className="price" style={{ color: isPositive ? 'var(--profit-green)' : '#EF476F' }}>
                    {isPositive ? '+' : ''}${totalReturn.toFixed(2)} ({isPositive ? '+' : ''}{returnPercent.toFixed(2)}%)
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {validPositions.length === 0 && (
          <p className="subtitle" style={{ textAlign: 'center', marginTop: '30px' }}>
            No stocks in your portfolio yet. Hit the Trade tab to get started!
          </p>
        )}
      </div>
    </div>
  );
}