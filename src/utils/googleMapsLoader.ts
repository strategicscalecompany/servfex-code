/**
 * Official Google Maps JavaScript API Loader for ServFex Admin
 * Uses official @googlemaps/js-api-loader to cleanly initialize Google Maps SDK.
 */
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let isConfigured = false;
let loadPromise: Promise<typeof google.maps> | null = null;

export const loadGoogleMaps = async (): Promise<typeof google.maps> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }

  // If already loaded and Map constructor is ready
  if (window.google?.maps?.Map) {
    return window.google.maps;
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is not defined in environment variables');
  }

  if (!isConfigured) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    });
    isConfigured = true;
  }

  loadPromise = (async () => {
    try {
      // Import the core maps and places libraries ensuring constructors are ready
      await importLibrary('maps');
      await importLibrary('places');
      return window.google.maps;
    } catch (err) {
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
};
