import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyARTpZgR212_iZUL5glYw4sF-pxRat_DOY';
const JOURNEY_STORAGE_KEY = 'frame8.myJourney.v1';
const MAP_CACHE_KEY = 'frame8.mapGeocodeCache.v1';
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const DEFAULT_CENTER = { lat: -27.4698, lng: 153.0251 };
const MAX_RENDER_MARKERS = 8;

const loadGoogleMapsScript = (() => {
  let loaderPromise;
  return (apiKey) => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window is undefined'));
    }

    if (window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }

    if (loaderPromise) {
      return loaderPromise;
    }

    loaderPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps-loader]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });

    return loaderPromise;
  };
})();

const readJSON = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Failed to read localStorage key ${key}:`, error);
    return fallback;
  }
};

const writeJSON = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key ${key}:`, error);
  }
};

const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  const location = data.results?.[0]?.geometry?.location;

  if (!location) {
    throw new Error('No geometry returned for address');
  }

  return { lat: location.lat, lng: location.lng };
};

const getJourneyLocations = async () => {
  const journeyItems = readJSON(JOURNEY_STORAGE_KEY, []);
  const cache = readJSON(MAP_CACHE_KEY, {});
  const now = Date.now();
  const seen = new Set();
  const locations = [];
  let cacheUpdated = false;

  journeyItems.forEach((item) => {
    const address = item.address || item.formattedAddress || item.vicinity;
    if (!address) return;

    const cacheKey = address.trim().toLowerCase();
    if (seen.has(cacheKey)) return;
    seen.add(cacheKey);

    const name = item.name || item.displayName?.text || 'Saved place';
    const cachedEntry = cache[cacheKey];

    if (cachedEntry && now - cachedEntry.timestamp < FIFTEEN_MINUTES) {
      locations.push({
        name,
        address,
        lat: cachedEntry.lat,
        lng: cachedEntry.lng,
      });
      return;
    }

    locations.push({ name, address, needsLookup: true, cacheKey });
  });

  const finalLocations = [];

  for (const location of locations.slice(0, MAX_RENDER_MARKERS)) {
    if (!location.needsLookup) {
      finalLocations.push(location);
      continue;
    }

    try {
      const coords = await geocodeAddress(location.address);
      cache[location.cacheKey] = { lat: coords.lat, lng: coords.lng, timestamp: now };
      finalLocations.push({ name: location.name, address: location.address, ...coords });
      cacheUpdated = true;
    } catch (error) {
      console.error(`Failed to geocode address ${location.address}:`, error);
    }
  }

  if (cacheUpdated) {
    writeJSON(MAP_CACHE_KEY, cache);
  }

  if (!finalLocations.length) {
    return [
      {
        name: 'Brisbane CBD',
        address: 'Brisbane City QLD',
        lat: DEFAULT_CENTER.lat,
        lng: DEFAULT_CENTER.lng,
      },
    ];
  }

  return finalLocations;
};

export default function JourneyMap({ height = 220, className = '', style = {} }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let isSubscribed = true;

    const loadLocations = async () => {
      setIsMapLoading(true);
      try {
        const locations = await getJourneyLocations();
        if (!isSubscribed) return;
        setMapLocations(locations);
        setMapError('');
      } catch (error) {
        console.error('Unable to resolve map locations:', error);
        if (isSubscribed) {
          setMapError('Unable to load map locations right now.');
          setMapLocations([]);
        }
      } finally {
        if (isSubscribed) {
          setIsMapLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    if (!mapLocations.length || typeof window === 'undefined') {
      return;
    }

    let isMounted = true;

    const renderMap = async () => {
      setIsMapLoading(true);
      try {
        await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);
        if (!isMounted || !mapRef.current) return;

        const map =
          mapInstanceRef.current ||
          new window.google.maps.Map(mapRef.current, {
            center: mapLocations[0] || DEFAULT_CENTER,
            zoom: 12,
            disableDefaultUI: true,
          });

        mapInstanceRef.current = map;

        const bounds = new window.google.maps.LatLngBounds();

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        mapLocations.forEach((loc) => {
          const marker = new window.google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            title: loc.name,
          });
          markersRef.current.push(marker);
          bounds.extend(marker.getPosition());
        });

        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new window.google.maps.DirectionsService();
        }

        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#2563eb',
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
          });
        }

        directionsRendererRef.current.setMap(map);

        const totalLocations = mapLocations.length;

        if (totalLocations > 1) {
          const origin = mapLocations[0];
          const destination = mapLocations[totalLocations - 1];
          const waypoints = mapLocations.slice(1, totalLocations - 1).map((loc) => ({
            location: { lat: loc.lat, lng: loc.lng },
            stopover: true,
          }));

          directionsServiceRef.current.route(
            {
              origin: { lat: origin.lat, lng: origin.lng },
              destination: { lat: destination.lat, lng: destination.lng },
              travelMode: window.google.maps.TravelMode.DRIVING,
              waypoints,
              optimizeWaypoints: false,
            },
            (result, status) => {
              const okStatus =
                window.google?.maps?.DirectionsStatus?.OK || 'OK';
              if (status === okStatus) {
                directionsRendererRef.current.setDirections(result);
                const routeBounds = result.routes?.[0]?.bounds;
                if (routeBounds) {
                  map.fitBounds(routeBounds, 48);
                }
              } else {
                console.warn('Directions request failed:', status);
                directionsRendererRef.current.set('directions', null);
                map.fitBounds(bounds, 48);
              }
            }
          );
        } else if (totalLocations === 1) {
          directionsRendererRef.current.set('directions', null);
          map.setCenter(mapLocations[0]);
          map.setZoom(13);
        } else {
          directionsRendererRef.current.set('directions', null);
        }

        if (totalLocations <= 1 && bounds.isEmpty()) {
          map.setCenter(DEFAULT_CENTER);
          map.setZoom(12);
        }

        setMapError('');
      } catch (error) {
        console.error('Failed to initialise Google Map:', error);
        if (isMounted) {
          setMapError('Failed to load Google Map.');
        }
      } finally {
        if (isMounted) {
          setIsMapLoading(false);
        }
      }
    };

    renderMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, [mapLocations]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        minHeight: height,
        ...style,
      }}
    >
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', minHeight: height }}
      />
      {(isMapLoading || mapError) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(248, 249, 250, 0.85)',
            color: '#6c757d',
            fontWeight: 600,
            textAlign: 'center',
            padding: '0 16px',
          }}
        >
          {mapError ? mapError : 'Loading map...'}
        </div>
      )}
    </div>
  );
}

