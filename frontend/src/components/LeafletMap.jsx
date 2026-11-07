import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom SVG Icons
const startIcon = new L.DivIcon({
  className: 'custom-start-marker',
  html: `
    <div style="background-color: #10B981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.5); border: 2px solid white; font-weight: bold; font-size: 14px;">
      A
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const destIcon = new L.DivIcon({
  className: 'custom-dest-marker',
  html: `
    <div style="background-color: #E11D48; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(225,29,72,0.5); border: 2px solid white; font-weight: bold; font-size: 14px;">
      B
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const liveIcon = new L.DivIcon({
  className: 'custom-live-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(225, 29, 72, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="background-color: #E11D48; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 10;"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Map auto-fit bounds helper
function MapViewUpdater({ points, center }) {
  const map = useMap();

  useEffect(() => {
    if (center && (!points || points.length <= 1)) {
      map.setView([center.latitude, center.longitude], map.getZoom() || 14);
      return;
    }

    if (points && points.length > 1) {
      const validPoints = points.filter(p => p && p[0] && p[1]);
      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [points, center, map]);

  return null;
}

export default function LeafletMap({
  currentLocation,
  startPoint,
  destinationPoint,
  path = [],
  height = '400px',
  showAccuracy = true
}) {
  // Default coordinates (New Delhi NCR default)
  const defaultCenter = [28.6139, 77.2090];
  const centerLat = currentLocation?.latitude || startPoint?.latitude || defaultCenter[0];
  const centerLng = currentLocation?.longitude || startPoint?.longitude || defaultCenter[1];

  const mapPoints = [];
  if (startPoint?.latitude && startPoint?.longitude) {
    mapPoints.push([startPoint.latitude, startPoint.longitude]);
  }
  if (destinationPoint?.latitude && destinationPoint?.longitude) {
    mapPoints.push([destinationPoint.latitude, destinationPoint.longitude]);
  }
  if (currentLocation?.latitude && currentLocation?.longitude) {
    mapPoints.push([currentLocation.latitude, currentLocation.longitude]);
  }

  // Generate route path points
  const polylineCoords = path.length > 0 
    ? path.map(p => [p.latitude, p.longitude])
    : mapPoints;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-rose-100 shadow-soft" style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewUpdater
          points={mapPoints}
          center={currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : null}
        />

        {/* Start Point Marker */}
        {startPoint?.latitude && startPoint?.longitude && (
          <Marker position={[startPoint.latitude, startPoint.longitude]} icon={startIcon}>
            <Popup>
              <div className="text-xs font-semibold">
                <span className="text-emerald-600 block">Starting Location</span>
                {startPoint.label || 'Journey Start'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationPoint?.latitude && destinationPoint?.longitude && (
          <Marker position={[destinationPoint.latitude, destinationPoint.longitude]} icon={destIcon}>
            <Popup>
              <div className="text-xs font-semibold">
                <span className="text-rose-600 block">Destination</span>
                {destinationPoint.label || 'Target Location'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current Live Location Marker */}
        {currentLocation?.latitude && currentLocation?.longitude && (
          <>
            <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={liveIcon}>
              <Popup>
                <div className="text-xs">
                  <span className="font-bold text-rose-600 block">Live Position</span>
                  <span>Accuracy: ±{Math.round(currentLocation.accuracy || 10)}m</span>
                  <br />
                  <span className="text-slate-400 text-[10px]">
                    {currentLocation.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </Popup>
            </Marker>

            {showAccuracy && currentLocation.accuracy && (
              <Circle
                center={[currentLocation.latitude, currentLocation.longitude]}
                radius={currentLocation.accuracy}
                pathOptions={{
                  fillColor: '#E11D48',
                  fillOpacity: 0.12,
                  color: '#E11D48',
                  weight: 1
                }}
              />
            )}
          </>
        )}

        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#E11D48',
              weight: 4,
              opacity: 0.85,
              dashArray: path.length > 0 ? null : '6, 10'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

