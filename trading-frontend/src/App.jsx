import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "../src/components/Auth";
import Portfolio from "../src/components/Portfolio";
import Trade from "../src/components/Trade";
import OrderHistory from "./components/OrderHistory";
import News from './components/News';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/history" element={<OrderHistory />} />
          <Route path="/news" element={<News />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
