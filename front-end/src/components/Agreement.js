import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Agreement = () => {
  const [locations, setLocations] = useState([]);
  const [confirmedLocations, setConfirmedLocations] = useState([]);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("frame8.myJourney.v1");
    if (stored) {
      try {
        // Ensure it’s parsed as array (or wrap single object into array)
        const parsed = JSON.parse(stored);
        setLocations(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (err) {
        console.error("Invalid localStorage data", err);
      }
    }
  }, []);

  const handleConfirm = (loc) => {
    setConfirmedLocations((prev) => [...prev, loc]);
    setLocations((prev) => prev.filter((l) => l.name !== loc.name));
  };

  const handleReject = (loc) => {
    setLocations((prev) => prev.filter((l) => l.name !== loc.name));
  };

  return (
    <div style={styles.container}>
      {locations.map((loc, idx) => (
        <div key={idx} style={styles.card}>
          {loc.image && (
            <img src={loc.image} alt={loc.name} style={styles.image} />
          )}
          <h3 style={styles.name}>{loc.name}</h3>
          <p style={styles.meta}>
            <strong>{loc.price}</strong> | ⭐ {loc.rating}
          </p>
          <div style={styles.buttonRow}>
            <button style={styles.confirmBtn} onClick={() => handleConfirm(loc)}>
              Confirm
            </button>
            <button style={styles.rejectBtn} onClick={() => handleReject(loc)}>
              Reject
            </button>
            <button style={styles.detailsBtn}>Details</button>
          </div>
        </div>
      ))}

      {confirmedLocations.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h4>✅ Confirmed Locations</h4>
          <ul>
            {confirmedLocations.map((loc, idx) => (
              <li key={idx}>{loc.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Simple inline styles (replace with CSS classes if you prefer)
const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    padding: "1rem",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "1rem",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  image: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "0.75rem",
  },
  name: {
    margin: "0.5rem 0",
    fontSize: "1.1rem",
    textAlign: "center",
  },
  meta: {
    margin: "0.25rem 0 1rem 0",
    fontSize: "0.9rem",
    color: "#555",
  },
  buttonRow: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "auto",
  },
  confirmBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rejectBtn: {
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  detailsBtn: {
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Agreement;