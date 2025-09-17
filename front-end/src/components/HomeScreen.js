import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import JourneyMap from './JourneyMap';

const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapSectionRef = useRef(null);

  const handleCreatePlan = () => {
    navigate('/plan-trip');
  };

  useEffect(() => {
    if (location.state?.scrollToMap && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, scrollToMap: false },
      });
    }
  }, [location, navigate]);

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="header">
        <h1 className="greeting">Hello, NAME</h1>
        <p className="welcome">Welcome to Cotrip</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="search for something" />
          <button className="filter-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Explore New Section */}
        <div className="section">
          <h2 className="section-title">Explore new</h2>
          <div className="explore-grid">
            <div className="explore-card city">
              <img src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=200&fit=crop" alt="City" />
            </div>
            <div className="explore-card nature">
              <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop" alt="Nature" />
            </div>
          </div>
        </div>

        {/* Recent Trips Section */}
        <div className="section">
          <h2 className="section-title">Recent Trips</h2>
          <div className="recent-trips">
            <div className="trip-card">
              <img src="https://images.unsplash.com/photo-1513326738677-b964603b136d?w=300&h=200&fit=crop" alt="Moscow" />
              <div className="trip-info">
                <h3>Moscow</h3>
              </div>
            </div>
            <div className="trip-card">
              <img src="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=300&h=200&fit=crop" alt="Beijing" />
              <div className="trip-info">
                <h3>Beijing</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Route Section */}
        <div className="section" ref={mapSectionRef}>
          <div className="section-header">
            <h2 className="section-title">Trip Route</h2>
            <span className="section-subtitle">Auto-refreshes every 15 min</span>
          </div>
          <JourneyMap height={240} />
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="floating-add-btn" onClick={handleCreatePlan}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Bottom Navigation Bar */}
      <BottomNav active="home" />

      <style jsx>{`
        .home-screen {
          height: 100vh;
          background-color: #f8f9fa;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          position: relative;
        }

        .header {
          padding: 48px 20px 20px;
          text-align: left;
        }

        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #000;
          margin: 0 0 8px 0;
        }

        .welcome {
          font-size: 16px;
          color: #8e8e93;
          margin: 0;
        }

        .search-section {
          padding: 0 20px 20px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 25px;
          padding: 12px 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          gap: 12px;
        }

        .search-bar svg {
          color: #8e8e93;
          flex-shrink: 0;
        }

        .search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #8e8e93;
          background: none;
        }

        .search-bar input::placeholder {
          color: #8e8e93;
        }

        .filter-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #8e8e93;
        }

        .main-content {
          flex: 1;
          padding: 0 20px 100px 20px;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 28px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 12px;
          color: #8e8e93;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #000;
          margin: 0;
        }

        .explore-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .explore-card {
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }

        .explore-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .recent-trips {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .trip-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .trip-card img {
          width: 100%;
          height: 100px;
          object-fit: cover;
        }

        .trip-info {
          padding: 12px;
        }

        .trip-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #000;
        }

        .floating-add-btn {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 56px;
          height: 56px;
          background-color: #F4A460;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(244, 164, 96, 0.4);
          transition: all 0.2s ease;
          color: white;
        }

        .floating-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(244, 164, 96, 0.5);
        }

        .floating-add-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .greeting {
            font-size: 24px;
          }

          .header {
            padding: 40px 16px 16px;
          }

          .search-section {
            padding: 0 16px 16px;
          }

          .main-content {
            padding: 0 16px 100px 16px;
          }

          .floating-add-btn {
            right: 16px;
            bottom: 90px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;
