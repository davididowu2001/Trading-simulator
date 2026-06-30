import { useState, useEffect } from "react";
import { fetchWithAuth } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { Search, ExternalLink, Newspaper } from "lucide-react"; // Assuming you installed lucide-react earlier!

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tickerQuery, setTickerQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // Tracks what is currently being viewed
  const navigate = useNavigate();

  const loadNews = async (query = "") => {
    setLoading(true);
    try {
      // FIX: Added &dates=3M to match your backend API requirement
      const endpoint = query ? `/news?ticker=${query}&dates=3M` : "/news";

      const data = await fetchWithAuth(endpoint);
      setNews(data || []);
      setActiveSearch(query);
    } catch (error) {
      console.error("Failed to load news", error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Load general news on first mount
  useEffect(() => {
    loadNews();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadNews(tickerQuery.toUpperCase());
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/");
  };

  // Helper to format Unix timestamps (e.g., 1782847269) into readable dates
  const formatTime = (unixTime) => {
    const date = new Date(unixTime * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Universal Navigation */}
      <nav
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/trade">Trade</Link>
          <Link to="/news" style={{ color: "var(--text-primary)" }}>
            News
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

      <div
        className="container"
        style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}
      >
        {/* Header & Search Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2>
            <Newspaper
              style={{
                display: "inline",
                marginBottom: "-4px",
                marginRight: "8px",
              }}
            />
            Market News
          </h2>
          <div className="subtitle" style={{ marginBottom: "20px" }}>
            {activeSearch
              ? `Showing latest updates for ${activeSearch}`
              : "Top stories driving the market today"}
          </div>

          <form
            onSubmit={handleSearch}
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <div
              style={{ position: "relative", width: "100%", maxWidth: "400px" }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                placeholder="Search news by ticker (e.g. AAPL)"
                value={tickerQuery}
                onChange={(e) => setTickerQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px 12px 40px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                borderRadius: "8px",
                padding: "0 20px",
                backgroundColor: "var(--profit-green)",
                color: "#000",
              }}
            >
              Search
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setTickerQuery("");
                  loadNews("");
                }}
                style={{
                  borderRadius: "8px",
                  padding: "0 15px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* News Feed */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              marginTop: "40px",
            }}
          >
            Loading latest headlines...
          </div>
        ) : news.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              marginTop: "40px",
            }}
          >
            No news found. Try another search.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {news.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="holding-card" // Reusing your existing card styles
                style={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  padding: "20px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* News Image */}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.headline}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      flexShrink: 0,
                    }}
                    onError={(e) => (e.target.style.display = "none")} // Hide broken images gracefully
                  />
                )}

                {/* News Content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        color: "var(--text-secondary)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.source}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {formatTime(item.datetime)}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.headline}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.summary}
                  </p>
                </div>

                {/* External Link Icon */}
                <div
                  style={{
                    color: "var(--text-secondary)",
                    alignSelf: "flex-start",
                  }}
                >
                  <ExternalLink size={18} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
