

// export default App;
import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import './App.css'; // For basic styling

function App() {
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null); // For modal/tooltip

  const API_URL = 'https://pancakeswapsignal.onrender.com/api/signals'; // Your backend API

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSignals(data);
    } catch (err) {
      console.error("Failed to fetch signals:", err);
      setError("Failed to load signals. Please ensure the backend is running and accessible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals(); // Fetch immediately on mount

    // Changed interval to match backend's likely refresh rate (e.g., 30 seconds for 100 tokens + delay)
    // Adjust this to match your backend's config.refreshIntervalMs
    const intervalId = setInterval(fetchSignals, 5000); // Fetch every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleShowDetails = (signal) => {
    setSelectedSignal(signal);
  };

  const handleCloseDetails = () => {
    setSelectedSignal(null);
  };

  // --- NEW: Memoized sorted signals ---
  const sortedSignals = useMemo(() => {
    // Define the order of signal types
    const signalOrder = {
      'Buy': 1,
      'Hold': 2,
      'Sell': 3, // Assuming 'Sell' should be before 'Error' but after 'Buy/Hold'
      'Error': 4 // Errors go last
      // Add other signal types if you have them, e.g., 'Neutral', 'Insufficient Data'
    };

    return [...signals].sort((a, b) => {
      const orderA = signalOrder[a.signal] || 99; // Default to a high number if signal type is unknown
      const orderB = signalOrder[b.signal] || 99;

      if (orderA === orderB) {
        // Secondary sort: if signal types are the same, sort by pair name alphabetically
        return a.pairName.localeCompare(b.pairName);
      }
      return orderA - orderB;
    });
  }, [signals]); // Recalculate only when 'signals' state changes
  // --- END NEW ---

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trading Signal Dashboard</h1>
      </header>

      <main>
        {loading && <p>Loading signals...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && signals.length === 0 && (
          <p>No signals available. Waiting for data from backend.</p>
        )}

        {!loading && !error && signals.length > 0 && (
          <div className="signals-table-container">
            <table>
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Signal</th>
                  <th>Current Price (USD)</th>
                  <th>Current Volume (24h)</th>
                  <th>Current Liquidity (USD)</th>
                  <th>RSI</th>
                  <th>MACD</th>
                  <th>Last Buy Price</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {/* Use sortedSignals here */}
                {sortedSignals.map((signal, index) => (
                  <tr key={signal.pairName || index} className={signal.signal === 'Buy' ? 'buy-signal' : ''}>
                    <td>{signal.pairName}</td>
                    <td className={`signal-status ${signal.signal.toLowerCase()}`}>
                      {signal.signal}
                    </td>
                    <td>{signal.currentPrice !== 'N/A' ? `$${parseFloat(signal.currentPrice).toFixed(8)}` : 'N/A'}</td>
                    <td>{signal.currentVolume !== 'N/A' ? `$${parseFloat(signal.currentVolume).toFixed(2)}` : 'N/A'}</td>
                    <td>{signal.currentLiquidity !== 'N/A' ? `$${parseFloat(signal.currentLiquidity).toFixed(2)}` : 'N/A'}</td>
                    <td>{signal.rsi !== 'N/A' ? parseFloat(signal.rsi).toFixed(2) : 'N/A'}</td>
                    <td><td>
  {signal.macd && typeof signal.macd.MACD === 'number' ? parseFloat(signal.macd.MACD).toFixed(2) : 'N/A'}
</td></td>
                    <td>
                      {signal.lastBuySignal ? `$${signal.lastBuySignal.price} (${new Date(signal.lastBuySignal.timestamp).toLocaleTimeString()})` : 'N/A'}
                    </td>
                    <td>
                      <button onClick={() => handleShowDetails(signal)}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selectedSignal && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedSignal.pairName} Signal Details</h2>
            <ul>
              {selectedSignal.signalDetails && selectedSignal.signalDetails.map((detail, idx) => ( // Add check for signalDetails
                <li key={idx}>{detail}</li>
              ))}
            </ul>
            <button onClick={handleCloseDetails}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;