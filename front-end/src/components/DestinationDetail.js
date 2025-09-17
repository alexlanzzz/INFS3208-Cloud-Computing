import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DestinationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [destination, setDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Touch handling for image swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const GOOGLE_PLACES_API_KEY = 'AIzaSyCu1wvtBH6Lmgr-eqVfKTU76Sm6oNSMnJo';

  // Touch handlers for image swiping
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (detailData && detailData.images && detailData.images.length > 1) {
      if (isLeftSwipe) {
        // Swipe left - next image
        setActiveImageIndex((prev) => 
          prev === detailData.images.length - 1 ? 0 : prev + 1
        );
      } else if (isRightSwipe) {
        // Swipe right - previous image
        setActiveImageIndex((prev) => 
          prev === 0 ? detailData.images.length - 1 : prev - 1
        );
      }
    }
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
  };

  const getFallbackDetailData = () => ({
    images: [getDefaultImage()],
    openingHours: "All day",
    duration: "0.5-1 hours",
    perfectTiming: "9:00-14:00",
    features: ["Casual", "Outdoor", "Popular"],
    description: "A wonderful destination in Brisbane offering unique experiences for visitors.",
    tips: "Visit during off-peak hours for the best experience. Comfortable walking shoes recommended.",
    reviews: {
      overall: 4.5,
      totalCount: 1250,
      breakdown: { 5: 75, 4: 15, 3: 7, 2: 2, 1: 1 },
      featured: {
        author: "Visitor",
        text: "Great place to visit in Brisbane. Highly recommended!"
      }
    },
    nearby: getFallbackNearbyPlaces()
  });

  const getFallbackNearbyPlaces = () => [
    {
      name: "Brisbane River",
      distance: "2km from here",
      rating: 4.5,
      image: getDefaultImage()
    },
    {
      name: "Queen Street Mall",
      distance: "3km from here",
      rating: 4.2,
      image: getDefaultImage()
    }
  ];

  // Enhanced API fetch for detailed place information
  const fetchPlaceDetails = useCallback(async (placeName, address) => {
    try {
      console.log('Fetching detailed place information for:', placeName);
      
      // Search for the specific place to get place ID
      const searchResponse = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.photos,places.editorialSummary,places.regularOpeningHours,places.types,places.reviews'
          },
          body: JSON.stringify({
            textQuery: `${placeName} ${address}`,
            maxResultCount: 1
          })
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Search failed with status ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const place = searchData.places?.[0];

      if (!place) {
        console.log('No place found, using fallback data');
        return getFallbackDetailData();
      }

      console.log('Place found:', place);

      // Extract multiple images from photos array
      const images = place.photos?.slice(0, 5).map(photo => 
        `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${GOOGLE_PLACES_API_KEY}`
      ) || [getDefaultImage()];

      // Extract features from place types
      const features = extractFeaturesFromTypes(place.types || []);

      // Parse opening hours
      const openingHours = place.regularOpeningHours?.weekdayDescriptions?.[0] || "Opening hours vary";

      // Use editorial summary as description, fallback to generic description
      const description = place.editorialSummary?.text || 
        generateDescriptionFromTypes(place.types || [], placeName);

      return {
        images,
        openingHours,
        duration: estimateDuration(place.types || []),
        perfectTiming: getOptimalTiming(place.types || []),
        features,
        description,
        tips: generateTips(place.types || [], placeName),
        reviews: {
          overall: place.rating || 4.0,
          totalCount: Math.floor(Math.random() * 3000) + 500,
          breakdown: {
            5: 84,
            4: 12,
            3: 3,
            2: 1,
            1: 0
          },
          featured: {
            author: "Alex",
            text: place.reviews?.[0]?.text?.text || `Great experience at ${placeName}. Highly recommended for visitors to Brisbane.`
          }
        },
        nearby: await fetchNearbyPlaces(placeName, address)
      };

    } catch (error) {
      console.error('Error fetching place details:', error);
      return getFallbackDetailData();
    }
  }, [GOOGLE_PLACES_API_KEY]);

  const extractFeaturesFromTypes = (types) => {
    const typeMapping = {
      'tourist_attraction': 'Sightseeing',
      'park': 'Outdoor',
      'museum': 'Educational',
      'restaurant': 'Dining',
      'lodging': 'Accommodation',
      'shopping_mall': 'Shopping',
      'amusement_park': 'Entertainment',
      'zoo': 'Family Friendly',
      'aquarium': 'Family Friendly',
      'art_gallery': 'Cultural',
      'church': 'Historical',
      'establishment': 'Popular',
      'point_of_interest': 'Must See'
    };

    const features = types
      .map(type => typeMapping[type])
      .filter(Boolean)
      .slice(0, 5);

    // Add some generic features if we don't have enough
    const genericFeatures = ['Casual', 'Photography', 'Walking'];
    while (features.length < 3) {
      const generic = genericFeatures[features.length];
      if (generic && !features.includes(generic)) {
        features.push(generic);
      } else {
        break;
      }
    }

    return features;
  };

  const generateDescriptionFromTypes = (types, name) => {
    if (types.includes('tourist_attraction')) {
      return `${name} is a popular tourist destination offering unique experiences and memorable moments for visitors of all ages.`;
    }
    if (types.includes('park')) {
      return `${name} is a beautiful green space perfect for relaxation, outdoor activities, and connecting with nature in the heart of Brisbane.`;
    }
    if (types.includes('museum')) {
      return `${name} showcases fascinating exhibits and collections, providing educational and cultural experiences for curious minds.`;
    }
    if (types.includes('restaurant')) {
      return `${name} offers delicious cuisine and dining experiences, serving both locals and visitors with quality food and service.`;
    }
    return `${name} is a notable location in Brisbane, offering visitors a unique and enjoyable experience worth exploring.`;
  };

  const estimateDuration = (types) => {
    if (types.includes('museum') || types.includes('art_gallery')) return '1-2 hours';
    if (types.includes('park') || types.includes('tourist_attraction')) return '0.5-2 hours';
    if (types.includes('restaurant')) return '1-1.5 hours';
    if (types.includes('shopping_mall')) return '1-3 hours';
    return '0.5-1 hours';
  };

  const getOptimalTiming = (types) => {
    if (types.includes('restaurant')) return '12:00-14:00 or 18:00-20:00';
    if (types.includes('park')) return '9:00-16:00';
    if (types.includes('museum')) return '10:00-15:00';
    return '9:00-14:00';
  };

  const generateTips = (types, name) => {
    if (types.includes('park')) {
      return 'Best visited during weekday mornings for a quieter experience. Bring water and comfortable walking shoes. Check weather conditions before visiting.';
    }
    if (types.includes('museum')) {
      return 'Consider purchasing tickets online to avoid queues. Allow extra time for special exhibitions. Photography policies may vary by section.';
    }
    if (types.includes('restaurant')) {
      return 'Reservations recommended, especially for dinner. Check opening hours as they may vary on weekends and holidays.';
    }
    return `Visit ${name} during off-peak hours for the best experience. Comfortable walking shoes recommended. Check latest opening hours before your visit.`;
  };

  const fetchNearbyPlaces = async (placeName, address) => {
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.photos'
          },
          body: JSON.stringify({
            textQuery: `attractions near ${address}`,
            maxResultCount: 3
          })
        }
      );

      if (!response.ok) throw new Error('Nearby search failed');

      const data = await response.json();
      return data.places?.map(place => ({
        name: place.displayName?.text || 'Nearby Attraction',
        distance: `${Math.floor(Math.random() * 5) + 1}km from here`,
        rating: place.rating || 4.0,
        image: place.photos?.[0] ? 
          `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=600&key=${GOOGLE_PLACES_API_KEY}` :
          getDefaultImage()
      })) || [];
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return getFallbackNearbyPlaces();
    }
  };

  useEffect(() => {
    const loadDestinationDetails = async () => {
      const destinationData = location.state?.destination;
      if (destinationData) {
        setDestination(destinationData);
        console.log('Loading details for:', destinationData.name);
        
        // Fetch detailed information from API
        const details = await fetchPlaceDetails(destinationData.name, destinationData.address);
        setDetailData(details);
      }
      setIsLoading(false);
    };

    loadDestinationDetails();
  }, [location.state, fetchPlaceDetails]);

  const handleAddToPlan = () => {
    // Add to journey logic (you can reuse from DestinationSelection)
    const LS_JOURNEY_KEY = "frame8.myJourney.v1";
    function readJSON(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    }
    function writeJSON(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    }

    const journey = readJSON(LS_JOURNEY_KEY, []);
    const key = `${destination.name}__${destination.address}`;
    const exists = journey.some(x => `${x.name}__${x.address}` === key);
    
    if (!exists) {
      journey.push({
        ...destination,
        addedAt: new Date().toISOString()
      });
      writeJSON(LS_JOURNEY_KEY, journey);
      alert('Added to your journey!');
    } else {
      alert('Already in your journey!');
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#FF9800';
    if (rating >= 3.0) return '#FF5722';
    return '#F44336';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={i < Math.floor(rating) ? getRatingColor(rating) : '#E0E0E0'}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ));
  };

  if (isLoading) {
    return (
      <div className="detail-loading">
        <div className="spinner"></div>
        <p>Loading destination details...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="detail-error">
        <p>No destination data found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="destination-detail">
      {/* Header Image with Navigation */}
      <div className="detail-header">
        <div className="image-container">
          <img 
            src={detailData?.images?.[activeImageIndex] || destination.image || getDefaultImage()} 
            alt={destination.name}
            onError={(e) => {
              e.target.src = getDefaultImage();
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ userSelect: 'none' }}
          />
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          {/* Image indicators - only show if we have multiple images */}
          {detailData?.images && detailData.images.length > 1 && (
            <div className="image-indicators">
              {detailData.images.map((_, index) => (
                <div 
                  key={index}
                  className={`indicator ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title and Rating */}
        <div className="header-info">
          <div className="title-row">
            <h1>{destination.name}</h1>
            <div className="rating-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={getRatingColor(destination.rating)}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>{destination.rating}</span>
            </div>
          </div>
          <p className="address">{destination.address}</p>
          <p className="hours">Opening hours: {detailData?.openingHours || "All day"}</p>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Features */}
        {detailData && (
          <div className="features-section">
            <h2>Features</h2>
            <div className="features-grid">
              {detailData.features.map((feature, index) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {detailData && (
          <div className="description-section">
            <h2>Description</h2>
            <p>{detailData.description}</p>
            {detailData.images.length > 1 && (
              <div className="description-image">
                <img 
                  src={detailData.images[1]} 
                  alt={`${destination.name} view`}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Basic Info */}
        {detailData && (
          <div className="basic-info-section">
            <h2>Basic Info</h2>
            <div className="info-grid">
              <div className="info-item">
                <h3>Price</h3>
                <p>{destination.price}</p>
              </div>
              <div className="info-item">
                <h3>Duration</h3>
                <p>{detailData.duration}</p>
              </div>
              <div className="info-item">
                <h3>Perfect Timing</h3>
                <p>{detailData.perfectTiming}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {detailData && (
          <div className="tips-section">
            <div className="tips-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#4A90E2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <h2>Tips</h2>
            </div>
            <p>{detailData.tips}</p>
          </div>
        )}

        {/* Reviews */}
        {detailData && (
          <div className="reviews-section">
            <div className="reviews-header">
              <h2>Reviews</h2>
              <button 
                className="see-all-btn"
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                See all
              </button>
            </div>

            <div className="reviews-summary">
              <div className="rating-summary">
                <span className="big-rating">{detailData.reviews.overall}</span>
                <div className="rating-details">
                  <span className="review-count">{detailData.reviews.totalCount} comments</span>
                  <div className="rating-breakdown">
                    {Object.entries(detailData.reviews.breakdown).reverse().map(([stars, percentage]) => (
                      <div key={stars} className="rating-bar">
                        <span>{stars} Stars</span>
                        <div className="bar">
                          <div className="fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span>{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rate and Review */}
            <div className="rate-section">
              <h3>Rate and Reviews</h3>
              <div className="rate-row">
                <div className="avatar"></div>
                <div className="star-rating" onClick={() => navigate('/comment', { state: { destination } })}>
                    {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="#E0E0E0" style={{ cursor: 'pointer' }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    ))}
                    </div>
              </div>
            </div>

            {/* Picked Review */}
            <div className="picked-review">
              <h3>Picked Review</h3>
              <div className="review-item">
                <div className="review-header">
                  <div className="reviewer-avatar"></div>
                  <span className="reviewer-name">{detailData.reviews.featured.author}</span>
                </div>
                <p className="review-text">{detailData.reviews.featured.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nearby */}
        {detailData && detailData.nearby && detailData.nearby.length > 0 && (
          <div className="nearby-section">
            <h2>Nearby</h2>
            <div className="nearby-grid">
              {detailData.nearby.map((place, index) => (
                <div key={index} className="nearby-item">
                  <img 
                    src={place.image} 
                    alt={place.name}
                    onError={(e) => {
                      e.target.src = getDefaultImage();
                    }}
                  />
                  <div className="nearby-info">
                    <h4>{place.name}</h4>
                    <p className="distance">{place.distance}</p>
                    <div className="nearby-rating">
                      <span>{place.rating}</span>
                      {renderStars(place.rating)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button className="action-btn secondary" onClick={handleAddToPlan}>
          Interested
        </button>
        <button className="action-btn secondary">
          Navigation
        </button>
        <button className="action-btn primary">
          Book
        </button>
      </div>

      <style jsx>{`
        .destination-detail {
          min-height: 100vh;
          background-color: white;
          overflow-x: hidden;
        }

        .detail-loading, .detail-error {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #324B86;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .detail-header {
          position: relative;
        }

        .image-container {
          position: relative;
          height: 60vh;
          overflow: hidden;
        }

        .image-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0,0,0,0.5);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .back-btn:hover {
          background: rgba(0,0,0,0.7);
        }

        .image-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .indicator.active {
          background: white;
        }

        .header-info {
          padding: 20px;
          background: white;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .title-row h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #000;
          flex: 1;
          margin-right: 16px;
        }

        .rating-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 18px;
          font-weight: 700;
          color: #000;
        }

        .address {
          margin: 0;
          font-size: 16px;
          color: #666;
          margin-bottom: 4px;
        }

        .hours {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .detail-content {
          padding: 0 20px 120px;
        }

        .features-section,
        .description-section,
        .basic-info-section,
        .tips-section,
        .reviews-section,
        .nearby-section {
          margin-bottom: 32px;
        }

        .features-section h2,
        .description-section h2,
        .basic-info-section h2,
        .reviews-section h2,
        .nearby-section h2 {
          margin: 0 0 16px 0;
          font-size: 22px;
          font-weight: 700;
          color: #000;
        }

        .features-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .feature-tag {
          background: #F5F5F5;
          color: #666;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .description-section p {
          margin: 0 0 16px 0;
          font-size: 16px;
          line-height: 1.5;
          color: #333;
        }

        .description-image {
          border-radius: 12px;
          overflow: hidden;
          margin-top: 16px;
        }

        .description-image img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .info-item h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000;
        }

        .info-item p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .tips-section {
          background: #F8F9FA;
          padding: 16px;
          border-radius: 12px;
          margin: 32px -20px;
        }

        .tips-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tips-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #4A90E2;
        }

        .tips-section p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .see-all-btn {
          background: none;
          border: none;
          color: #4A90E2;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .reviews-summary {
          margin-bottom: 24px;
        }

        .rating-summary {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .big-rating {
          font-size: 48px;
          font-weight: 700;
          color: #4A90E2;
          line-height: 1;
        }

        .rating-details {
          flex: 1;
        }

        .review-count {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }

        .rating-breakdown {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rating-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .rating-bar span:first-child {
          width: 50px;
          color: #666;
        }

        .bar {
          flex: 1;
          height: 4px;
          background: #E0E0E0;
          border-radius: 2px;
          overflow: hidden;
        }

        .bar .fill {
          height: 100%;
          background: #4CAF50;
          transition: width 0.3s ease;
        }

        .rating-bar span:last-child {
          width: 30px;
          text-align: right;
          color: #666;
        }

        .rate-section {
          margin-bottom: 24px;
        }

        .rate-section h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #000;
        }

        .rate-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar, .reviewer-avatar {
          width: 40px;
          height: 40px;
          background: #E0E0E0;
          border-radius: 50%;
        }

        .star-rating {
          display: flex;
          gap: 4px;
        }

        .picked-review h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #000;
        }

        .review-item {
          background: #F8F9FA;
          padding: 16px;
          border-radius: 12px;
        }

        .review-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .reviewer-name {
          font-size: 16px;
          font-weight: 600;
          color: #000;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
        }

        .nearby-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .nearby-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: #F8F9FA;
        }

        .nearby-item img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }

        .nearby-info {
          flex: 1;
        }

        .nearby-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000;
        }

        .distance {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #666;
        }

        .nearby-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #000;
        }

        .bottom-actions {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 16px 20px;
          border-top: 1px solid #E0E0E0;
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .action-btn.secondary {
          background: #F5F5F5;
          color: #333;
        }

        .action-btn.primary {
          background: #4A90E2;
          color: white;
        }

        .action-btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 480px) {
          .title-row h1 {
            font-size: 24px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .nearby-grid {
            grid-template-columns: 1fr;
          }
          
          .bottom-actions {
            flex-direction: row;
            gap: 8px;
          }
          
          .action-btn {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default DestinationDetail;