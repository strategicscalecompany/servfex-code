import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Loader2,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';

interface VendorLocationMapProps {
  vendorId?: string;
  initialLocation: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onSuccess?: () => void;
}

// Telangana Center Coordinates fallback
const TELANGANA_CENTER_LAT = 17.385;
const TELANGANA_CENTER_LNG = 78.4867;

export const VendorLocationMap: React.FC<VendorLocationMapProps> = ({
  initialLocation,
  initialLat,
  initialLng,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const hasCoords = typeof initialLat === 'number' && typeof initialLng === 'number';
  const targetLat = hasCoords ? initialLat : TELANGANA_CENTER_LAT;
  const targetLng = hasCoords ? initialLng : TELANGANA_CENTER_LNG;

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    loadGoogleMaps()
      .then((googleMaps) => {
        if (isCancelled || !mapContainerRef.current) return;
        setIsMapLoading(false);

        const position = { lat: targetLat, lng: targetLng };
        const zoomLevel = hasCoords ? 16 : 12;

        if (!mapInstanceRef.current) {
          const map = new googleMaps.Map(mapContainerRef.current, {
            center: position,
            zoom: zoomLevel,
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            zoomControl: true, // Only allow zoom in and zoom out
            scrollwheel: true, // Allow zoom via scrollwheel
            draggable: false, // Locked: Cannot move or pan away from location
            keyboardShortcuts: false,
            fullscreenControl: true,
            streetViewControl: false,
          });

          // Ensure zooming stays anchored on the exact location point
          map.addListener('zoom_changed', () => {
            map.setCenter(position);
          });

          const marker = new googleMaps.Marker({
            position,
            map,
            draggable: false, // Non-draggable
            title: initialLocation || 'Operating Hub Location',
            animation: googleMaps.Animation.DROP,
          });

          const infoWindow = new googleMaps.InfoWindow({
            content: `
              <div style="padding: 4px; font-family: inherit;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${initialLocation || 'Operating Hub'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}</div>
              </div>
            `,
          });

          infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });

          marker.addListener('click', () => {
            infoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false,
            });
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
          infoWindowRef.current = infoWindow;
        } else {
          mapInstanceRef.current.setCenter(position);
          mapInstanceRef.current.setZoom(zoomLevel);
          if (markerRef.current) {
            markerRef.current.setPosition(position);
            markerRef.current.setTitle(initialLocation || 'Operating Hub Location');
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Google Maps init error:', err);
          setMapError(err.message || 'Failed to initialize Google Maps');
          setIsMapLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [targetLat, targetLng, initialLocation, hasCoords]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`;

  return (
    <div className="space-y-3">
      {/* Locked Official Google Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-[360px] sm:h-[400px] z-0" />

        {isMapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-slate-600 text-xs font-semibold gap-2 z-10">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading Google Maps...</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-4 text-center z-10">
            <p className="text-xs text-rose-600 font-semibold mb-2">{mapError}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
            >
              Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Location Pin Fixed Indicator */}
        <div className="absolute top-3 left-3 z-[10] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs text-[11px] text-slate-700 font-semibold flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Locked Operating Location</span>
        </div>
      </div>

      {/* Read-Only Location Coordinates & Details Bar */}
      <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Operating Hub / Area:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {initialLocation || 'Main Hub'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-medium pt-0.5 flex-wrap">
            <span>
              Latitude:{' '}
              <strong className="text-slate-800 font-mono">
                {hasCoords ? targetLat.toFixed(6) : 'Not provided'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Longitude:{' '}
              <strong className="text-slate-800 font-mono">
                {hasCoords ? targetLng.toFixed(6) : 'Not provided'}
              </strong>
            </span>
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-600 font-bold transition inline-flex items-center gap-1.5 border border-slate-200 shadow-2xs self-start sm:self-auto shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
