import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import infoIcon from '../assets/icons/info.png';
import purseIcon from '../assets/icons/purse.png';

const DestinationSelection = () => {
  const navigate = useNavigate();
  const [currentSwipeCount, setCurrentSwipeCount] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const MAX_SWIPES = 20;
  const SWIPE_THRESHOLD = 100;
  
  // Your Google Places API key
  const GOOGLE_PLACES_API_KEY = 'AIzaSyCu1wvtBH6Lmgr-eqVfKTU76Sm6oNSMnJo';

  // LocalStorage keys
const LS_JOURNEY_KEY = "frame8.myJourney.v1";
const LS_VOTE_KEY    = "frame8.votes.v1"; // { interested:[], notInterested:[] }

// Helpers to safely read/write JSON from localStorage
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/** Save a vote (interested or notInterested) */
function recordVote(place, interested) {
  const data = readJSON(LS_VOTE_KEY, { interested: [], notInterested: [] });
  const bucket = interested ? "interested" : "notInterested";
  // Simple deduplication using name+address key
  const key = `${place.name}__${place.address}`;
  const exists = (arr) => arr.some(x => `${x.name}__${x.address}` === key);
  if (!exists(data[bucket])) {
    data[bucket].push({ ...place, votedAt: new Date().toISOString() });
  }
  writeJSON(LS_VOTE_KEY, data);
}

/** Add a place to the journey (only for "interested" swipes) */
function addToJourney(place) {
  const journey = readJSON(LS_JOURNEY_KEY, []);
  // Prevent duplicates based on name+address
  const key = `${place.name}__${place.address}`;
  const exists = journey.some(x => `${x.name}__${x.address}` === key);
  if (!exists) {
    journey.push({
      ...place,
      addedAt: new Date().toISOString()
      // Optionally include fields like start/end time or day here
    });
    writeJSON(LS_JOURNEY_KEY, journey);
  }
}

  // Fetch places from Google Places API
  const fetchPlacesFromGoogle = useCallback(async () => {
    console.log('Starting to fetch places from Google API...');
    setIsLoading(true);
    try {
      const allDestinations = [];
      
      // Fetch Hotels (5)
      console.log('Fetching hotels...');
      const hotels = await searchPlaces('hotels in Brisbane', 'lodging');
      allDestinations.push(...hotels.slice(0, 5));
      
      // Fetch Restaurants (5)
      console.log('Fetching restaurants...');
      const restaurants = await searchPlaces('restaurants in Brisbane', 'restaurant');
      allDestinations.push(...restaurants.slice(0, 5));
      
      // Fetch Attractions (10)
      console.log('Fetching attractions...');
      const attractions = await searchPlaces('tourist attractions in Brisbane', 'tourist_attraction');
      allDestinations.push(...attractions.slice(0, 10));
      
      console.log('All destinations fetched:', allDestinations);
      setDestinations(allDestinations);
    } catch (error) {
      console.error('Error fetching places:', error);
      // Fallback to mock data if API fails
      console.log('Using mock data as fallback');
      setDestinations(getMockDestinations());
    }
    setIsLoading(false);
  }, []);

  const searchPlaces = async (query, type) => {
    console.log(`Searching for: ${query} (type: ${type})`);
    
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.editorialSummary'
          },
          body: JSON.stringify({
            textQuery: query,
            includedType: type,
            locationBias: {
              circle: {
                center: {
                  latitude: -27.4698,
                  longitude: 153.0251
                },
                radius: 50000.0
              }
            },
            maxResultCount: 10
          })
        }
      );

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      return data.places?.map(place => ({
        name: place.displayName?.text || 'Unknown Place',
        description: place.editorialSummary?.text || 'Great place to visit in Brisbane',
        rating: place.rating || 4.0,
        price: getPriceText(place.priceLevel),
        address: place.formattedAddress || 'Brisbane, QLD',
        image: place.photos?.[0] ? 
          `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=600&maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}` :
          getDefaultImage(type)
      })) || [];
    } catch (error) {
      console.error(`Error searching for ${query}:`, error);
      return [];
    }
  };

  const getPriceText = (priceLevel) => {
    switch (priceLevel) {
      case 'PRICE_LEVEL_FREE': return 'Free';
      case 'PRICE_LEVEL_INEXPENSIVE': return 'AU$25';
      case 'PRICE_LEVEL_MODERATE': return 'AU$50';
      case 'PRICE_LEVEL_EXPENSIVE': return 'AU$100';
      case 'PRICE_LEVEL_VERY_EXPENSIVE': return 'AU$150';
      default: return 'AU$50';
    }
  };

  const getDefaultImage = (type) => {
    switch (type) {
      case 'lodging': return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop';
      case 'restaurant': return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';
      default: return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
    }
  };

  const getMockDestinations = () => [
    {
      name: "Sunnybank Hotel",
      description: "Unassuming roadside property featuring a steakhouse with a sports bar, as well as free parking.",
      rating: 4.9,
      price: "AU$100",
      address: "555 Lang St, St Lucia",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
    },
    {
      name: "Brisbane River Cruise",
      description: "Scenic river cruise showcasing Brisbane's iconic landmarks and beautiful cityscape views.",
      rating: 4.7,
      price: "AU$45",
      address: "Brisbane River",
      image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&h=600&fit=crop"
    },
    {
      name: "Story Bridge Adventure",
      description: "Thrilling bridge climb experience offering panoramic views of Brisbane city and surrounds.",
      rating: 4.8,
      price: "AU$89",
      address: "Story Bridge",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
    },
    {
      name: "Queensland Museum",
      description: "Fascinating museum with natural history exhibits, planetarium shows and interactive displays.",
      rating: 4.5,
      price: "AU$25",
      address: "South Bank",
      image: "https://images.unsplash.com/photo-1565204189813-68fe0aa8c8be?w=800&h=600&fit=crop"
    },
    {
      name: "Lone Pine Koala Sanctuary",
      description: "World-famous koala sanctuary where you can cuddle koalas and hand-feed kangaroos.",
      rating: 4.6,
      price: "AU$35",
      address: "Lone Pine Sanctuary",
      image: "https://images.unsplash.com/photo-1459262838948-3e2de6c1ec80?w=800&h=600&fit=crop"
    }
  ];

  // Load destinations on component mount - FIXED: Now always calls Google API
  useEffect(() => {
    fetchPlacesFromGoogle();
  }, [fetchPlacesFromGoogle]);

  const currentDestination = destinations[(currentSwipeCount - 1) % destinations.length];

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#FF9800';
    if (rating >= 3.0) return '#FF5722';
    return '#F44336';
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleSwipe = (direction) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const card = cardRef.current;
    
    if (card) {
      const translateX = direction === 'right' ? 1000 : -1000;
      const rotation = direction === 'right' ? 30 : -30;
      
      card.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)`;
      card.style.opacity = '0';
      
      setTimeout(() => {
         if (direction === 'right') {
          // Right swipe: record as "interested" and add to journey
          recordVote(currentDestination, true);
          addToJourney(currentDestination);
          showToast('Added to your trip!');
        } else {
          // Left swipe: record as "not interested"
          recordVote(currentDestination, false);
          showToast('Not interested');
        }
        
        setTimeout(() => {
          if (currentSwipeCount >= MAX_SWIPES) {
            showToast('All destinations selected! Planning complete.');
            setTimeout(() => navigate('/agreement'), 2000);
          } else {
            setCurrentSwipeCount(prev => prev + 1);
            card.style.transform = 'translateX(0px) rotate(0deg)';
            card.style.opacity = '1';
            setIsAnimating(false);
          }
        }, 500);
      }, 300);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || isAnimating) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const deltaY = touch.clientY - startPosRef.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const card = cardRef.current;
      if (card) {
        const rotation = deltaX * 0.1;
        card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
        card.style.opacity = 1 - Math.abs(deltaX) / 300;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDraggingRef.current || isAnimating) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const deltaY = Math.abs(touch.clientY - startPosRef.current.y);
    
    isDraggingRef.current = false;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > deltaY) {
      handleSwipe(deltaX > 0 ? 'right' : 'left');
    } else {
      // Reset card position
      const card = cardRef.current;
      if (card) {
        card.style.transform = 'translateX(0px) rotate(0deg)';
        card.style.opacity = '1';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="destination-selection">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading destinations from Google Places...</p>
        </div>
        <style jsx>{`
          .destination-selection {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
          }
          .loading-container {
            text-align: center;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #324B86;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentDestination) {
    return (
      <div className="destination-selection">
        <div className="no-destinations">
          <p>No destinations available</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="destination-selection">
      {/* Header */}
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="header-center">
          <h2>Brisbane</h2>
          <p>01/09/25 - 07/09/25</p>
        </div>
        
        <div className="counter">
          {currentSwipeCount}/{MAX_SWIPES}
        </div>
      </div>

      {/* Card Container */}
      <div className="card-container">
        <div 
          ref={cardRef}
          className="destination-card no-select"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="card-image">
            <img 
              src={currentDestination.image} 
              alt={currentDestination.name}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
              }}
            />
          </div>
          
          <div className="card-content">
            <div className="header-row">
              <h3>{currentDestination.name}</h3>
              <div className="rating">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={getRatingColor(currentDestination.rating)}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span style={{ color: getRatingColor(currentDestination.rating) }}>
                  {currentDestination.rating}
                </span>
              </div>
            </div>
            
            <p className="description">{currentDestination.description}</p>
            
            <div className="bottom-row">
              <div className="details">
                <div className="price-row">
                  <img src={purseIcon} alt="Price" width="16" height="16" />
                  <span>{currentDestination.price} / person</span>
                </div>
                <div className="address-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{currentDestination.address}</span>
                </div>
              </div>
              
              <button className="info-btn" onClick={(e) => { 
                e.stopPropagation(); 
                navigate('/destination-detail', { state: { destination: currentDestination } });
              }}>
                <img src={infoIcon} alt="Info" width="20" height="20" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Instructions */}
      <div className="instructions">
        <span className="swipe-left">← Not interested</span>
        <span className="swipe-divider"> | </span>
        <span className="swipe-right">Interested →</span>
      </div>

      {/* Toast */}
      {toastMessage && <div className="toast">{toastMessage}</div>}

      <style jsx>{`
        .destination-selection {
          height: 100vh;
          background-color: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background-color: white;
          z-index: 10;
        }

        .back-btn {
          background: none;
          border: none;
          padding: 12px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-btn:hover {
          background-color: rgba(0,0,0,0.1);
        }

        .header-center {
          text-align: center;
          flex: 1;
        }

        .header-center h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #000;
        }

        .header-center p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .counter {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          min-width: 50px;
          text-align: right;
        }

        .card-container {
          flex: 1;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .destination-card {
          width: 100%;
          max-width: 400px;
          height: 80vh;
          max-height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          overflow: hidden;
          transition: transform 0.3s ease, opacity 0.3s ease;
          cursor: grab;
          position: relative;
        }

        .destination-card:active {
          cursor: grabbing;
        }

        .card-image {
          height: 100%;
          width: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-content {
          padding: 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 100%);
          color: white;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 200px;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .header-row h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          flex: 1;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 16px;
          font-weight: 700;
        }

        .description {
          margin: 0 0 16px 0;
          font-size: 14px;
          line-height: 1.4;
          color: #E0E0E0;
        }

        .bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .details {
          flex: 1;
        }

        .price-row, .address-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .price-row {
          font-weight: 700;
          color: white;
        }

        .address-row {
          font-size: 12px;
          color: #E0E0E0;
        }

        .info-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          color: white;
        }

        .info-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .instructions {
          text-align: center;
          padding: 20px;
          font-size: 14px;
          color: #666;
          opacity: 0.7;
          display: flex;
          justify-content: center;
          gap: 8px;
          align-items: center;
        }

        .swipe-left {
          color: #FF5722
        }
        .swipe-right {
          color: #4CAF50
        }
        .swipe-divider {
          color: #999;
        }

        .toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0,0,0,0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 20px;
          z-index: 1000;
          font-size: 14px;
        }

        @media (max-width: 480px) {
          .header {
            padding: 12px;
          }
          
          .card-container {
            padding: 12px;
          }
          
          .destination-card {
            height: 70vh;
          }
          
          .card-content {
            padding: 16px;
          }
          
          .header-row h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default DestinationSelection;