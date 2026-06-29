import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/");
  };

  useEffect(() => {
    const loadOrderHistory = async () => {
      try {
        const data = await fetchWithAuth("/trades/history");
        // Sort orders by executed_at descending so newest are on top
        const sortedOrders = data.sort(
          (a, b) => new Date(b.executed_at) - new Date(a.executed_at),
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Failed to fetch order history", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrderHistory();
  }, []);

  return (
    <div>
      <nav style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/trade">Trade</Link>
          <Link to="/history" style={{ color: "var(--text-primary)" }}>
            History
          </Link>
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
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2>Order History</h2>
          <div className="subtitle">
            A complete log of your simulator transactions
          </div>
        </div>

        {loading ? (
          <div className="subtitle" style={{ textAlign: "center" }}>
            Loading transaction history...
          </div>
        ) : orders.length === 0 ? (
          <p
            className="subtitle"
            style={{ textAlign: "center", marginTop: "30px" }}
          >
            You haven't placed any orders yet. Ready to jump in?
          </p>
        ) : (
          <ul className="holdings-list">
            {orders.map((order, index) => {
              // CHANGE: Look for 'type' instead of 'action'
              const isBuy = order.type?.toLowerCase() === "buy";

              // CHANGE: Look for 'executed_at' instead of 'timestamp'
              const orderDate = order.executed_at
                ? new Date(order.executed_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Unknown Date";

              const totalExecutionValue = order.shares * order.price;

              return (
                <li
                  key={order.id || index}
                  className="holding-card"
                  style={{
                    borderLeft: `4px solid ${isBuy ? "var(--profit-green)" : "#EF476F"}`,
                  }}
                >
                  <div className="holding-left">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{order.ticker}</h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: isBuy
                            ? "rgba(0, 219, 101, 0.1)"
                            : "rgba(239, 71, 111, 0.1)",
                          color: isBuy ? "var(--profit-green)" : "#EF476F",
                        }}
                      >
                        {order.type} {/* Show Buy/Sell type here */}
                      </span>
                    </div>
                    <p style={{ margin: "5px 0 0 0" }}>
                      {order.shares} shares @ ${order.price.toFixed(2)}
                    </p>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {orderDate}
                    </span>
                  </div>

                  <div
                    className="holding-right"
                    style={{ justifyContent: "center" }}
                  >
                    <p className="value" style={{ margin: 0 }}>
                      ${totalExecutionValue.toFixed(2)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
