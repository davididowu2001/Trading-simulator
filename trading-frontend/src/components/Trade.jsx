import { useState, useEffect } from "react";
import LiveChart from "./LiveChart";
import { fetchWithAuth } from "../api";
import { Link, useNavigate } from "react-router-dom";

// A curated list of popular stocks for the "Discover" page
const POPULAR_STOCKS = [
  { symbol: "AAPL", description: "APPLE INC" },
  { symbol: "TSLA", description: "TESLA INC" },
  { symbol: "NVDA", description: "NVIDIA CORP" },
  { symbol: "MSFT", description: "MICROSOFT CORP" },
  { symbol: "AMZN", description: "AMAZON.COM INC" },
  { symbol: "GOOGL", description: "ALPHABET INC-CL A" },
];

export default function Trade() {
  const [ticker, setTicker] = useState("");
  const [stockInfo, setStockInfo] = useState(null);
  const [shares, setShares] = useState(1);
  const [historicalData, setHistoricalData] = useState({
    oneDay: null,
    threeMonths: null,
  });
  const navigate = useNavigate();

  // Fetch history when stockInfo changes
  useEffect(() => {
    if (stockInfo) {
      const loadHistory = async () => {
        try {
          // Fetch 1D and 3M data concurrently
          const [res1D, res3M] = await Promise.all([
            fetchWithAuth(
              `/stocks/history?ticker=${stockInfo.symbol}&range=1D`,
            ),
            fetchWithAuth(
              `/stocks/history?ticker=${stockInfo.symbol}&range=3M`,
            ),
          ]);

          // Alpha Vantage array places the oldest date at the end, or newest at the start depending on your backend loop.
          const oneDayPrice =
            res1D?.length > 0 ? res1D[res1D.length - 1].close : null;
          const threeMonthPrice =
            res3M?.length > 0 ? res3M[res3M.length - 1].close : null;

          setHistoricalData({
            oneDay: oneDayPrice,
            threeMonths: threeMonthPrice,
          });
        } catch (error) {
          console.error("Failed to load historical data", error);
        }
      };
      loadHistory();
    }
  }, [stockInfo]);

  const handleSearch = async () => {
    try {
      const data = await fetchWithAuth(`/stocks/search?q=${ticker}`);
      if (data && data.length > 0) {
        setStockInfo(data[0]);
      } else {
        alert("No stocks found for that search.");
      }
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const executeTrade = async (action) => {
    try {
      const endpoint = action === "buy" ? "/trade/buy" : "/trade/sell";
      await fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify({
          ticker: stockInfo.symbol,
          shares: Number(shares),
        }),
      });
      alert(
        `Successfully ${action === "buy" ? "bought" : "sold"} ${shares} shares of ${stockInfo.symbol}`,
      );
      // Navigate back to portfolio after a successful trade
      navigate("/portfolio");
    } catch (error) {
      alert(`Trade failed: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/");
  };

  return (
    <div>
      <nav style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/trade" style={{ color: "var(--text-primary)" }}>
            Trade
          </Link>
          <Link to="/history">History</Link>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          Sign Out
        </button>
      </nav>

      <div className="container">
        {/* Toggle View: Show Market if no stock is selected, otherwise show Trade Panel */}
        {!stockInfo ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h2>Discover Markets</h2>
              <div className="subtitle">
                Search or select a popular asset to trade
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginBottom: "40px",
              }}
            >
              <input
                placeholder="Search any ticker (e.g. META)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                style={{ width: "100%", maxWidth: "400px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch}>Search</button>
            </div>

            <h3
              style={{
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "10px",
              }}
            >
              Trending Stocks
            </h3>
            <div className="market-grid">
              {POPULAR_STOCKS.map((stock) => (
                <div
                  key={stock.symbol}
                  className="market-card"
                  onClick={() => setStockInfo(stock)}
                >
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>
                    {stock.symbol}
                  </h3>
                  <p
                    style={{
                      margin: "0",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                    }}
                  >
                    {stock.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            <button
              onClick={() => {
                setStockInfo(null);
                setShares(1);
                // Clear the state here so React updates everything in one batch
                setHistoricalData({ oneDay: null, threeMonths: null });
              }}
              style={{
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                padding: "0",
                marginBottom: "20px",
              }}
            >
              ← Back to Market
            </button>

            <LiveChart key={stockInfo.symbol} ticker={stockInfo.symbol} />

            <div className="trade-panel" style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "28px" }}>
                    {stockInfo.symbol}
                  </h3>
                  <p className="subtitle" style={{ margin: "0 0 25px 0" }}>
                    {stockInfo.description}
                  </p>
                </div>

                {/* Historical Price Display */}
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>
                    1D Ago:{" "}
                    {historicalData.oneDay ? (
                      <strong style={{ color: "var(--text-primary)" }}>
                        ${historicalData.oneDay.toFixed(2)}
                      </strong>
                    ) : (
                      "Loading..."
                    )}
                  </div>
                  <div>
                    3M Ago:{" "}
                    {historicalData.threeMonths ? (
                      <strong style={{ color: "var(--text-primary)" }}>
                        ${historicalData.threeMonths.toFixed(2)}
                      </strong>
                    ) : (
                      "Loading..."
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "25px",
                }}
              >
                <label
                  style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                >
                  Number of Shares
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  style={{ width: "100%", fontSize: "20px", padding: "15px" }}
                />
              </div>

              <div
                className="button-group"
                style={{ display: "flex", gap: "15px", width: "100%" }}
              >
                <button
                  onClick={() => executeTrade("buy")}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--profit-green)",
                    color: "#000",
                    padding: "15px",
                  }}
                >
                  Buy
                </button>
                <button
                  onClick={() => executeTrade("sell")}
                  style={{
                    flex: 1,
                    backgroundColor: "#EF476F",
                    color: "#FFF",
                    padding: "15px",
                  }}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
