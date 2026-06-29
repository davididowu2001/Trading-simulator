import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "../api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function LiveChart({ ticker }) {
  const [activeTab, setActiveTab] = useState("LIVE");
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  const wsRef = useRef(null);

  // Helper function to handle tab switching cleanly
  const handleTabClick = (tab) => {
    if (tab === activeTab) return; // Do nothing if clicking the same tab

    setActiveTab(tab);
    setChartData([]); // Clear chart immediately to prevent cascading render warnings
    setConnectionStatus(
      tab === "LIVE" ? "Connecting..." : `Loading ${tab} data...`,
    );
  };

  // 1. Handle WebSocket for the "LIVE" tab
  useEffect(() => {
    if (activeTab !== "LIVE") return;

    const token = localStorage.getItem("jwt");
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const wsBase = apiBase
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    const ws = new WebSocket(`${wsBase}/ws/prices?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("Live Market");
      ws.send(ticker);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentPrice(data.price);

      setChartData((prevData) => {
        const updatedData = [
          ...prevData,
          { time: data.timestamp, price: data.price },
        ];
        if (updatedData.length > 30) updatedData.shift();
        return updatedData;
      });
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setConnectionStatus("Connection Error");
    };

    ws.onclose = () => {
      setConnectionStatus("Disconnected");
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [ticker, activeTab]);

  // 2. Handle REST API for Historical Tabs ("3M", "ALL")
  useEffect(() => {
    if (activeTab === "LIVE") return;

    // Use a flag to prevent setting state if the component unmounts mid-fetch
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const data = await fetchWithAuth(
          `/stocks/history?ticker=${ticker}&range=${activeTab}`,
        );
        if (!isMounted) return;

        const sortedData = data.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const formattedData = sortedData.map((item) => ({
          time: item.date,
          price: item.close,
        }));

        setChartData(formattedData);

        if (formattedData.length > 0) {
          setCurrentPrice(formattedData[formattedData.length - 1].price);
        }
        setConnectionStatus("Market Closed / Historical");
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch historical data", error);
          setConnectionStatus("Error loading history");
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [ticker, activeTab]);

  const getTabStyle = (tabName) => ({
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
    backgroundColor:
      activeTab === tabName ? "var(--profit-green)" : "transparent",
    color: activeTab === tabName ? "#000" : "var(--text-secondary)",
    transition: "all 0.2s ease",
  });

  return (
    <div className="trade-panel" style={{ padding: "20px", marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{ticker}</h3>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {connectionStatus}
          </span>
        </div>
        <span
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "var(--text-primary)",
          }}
        >
          {currentPrice ? `$${currentPrice.toFixed(2)}` : "---"}
        </span>
      </div>

      <div style={{ width: "100%", height: "220px", marginTop: "20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
              }}
              itemStyle={{ color: "var(--text-primary)" }}
              labelFormatter={(label) => `Time/Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={activeTab === "LIVE" ? "#0A7CFF" : "#9D4EDD"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <button
          style={getTabStyle("LIVE")}
          onClick={() => handleTabClick("LIVE")}
        >
          LIVE
        </button>
        <button style={getTabStyle("3M")} onClick={() => handleTabClick("3M")}>
          3M
        </button>
        <button
          style={getTabStyle("ALL")}
          onClick={() => handleTabClick("ALL")}
        >
          MAX
        </button>
      </div>
    </div>
  );
}
