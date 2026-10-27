import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { auth, isFirebaseWebConfigured } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface NewBookingAlert {
  bookingId: string;
  bookingNumber?: string;
  status?: string;
  timestamp?: number;
  booking?: any;
}

interface BookingRealtimeContextType {
  newBooking: NewBookingAlert | null;
  dismissNewBooking: () => void;
  highlightedBookingNumbers: string[];
  highlightedBookingIds: string[];
  isHighlighted: (id?: string, bookingNumber?: string) => boolean;
  clearHighlights: () => void;
  isConnected: boolean;
  refetchBookings: () => void;
}

const BookingRealtimeContext = createContext<BookingRealtimeContextType | undefined>(undefined);

const API_URL = (import.meta.env.VITE_API_URL || 'https://api.servfex.com/api/v1').trim();
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Gentle non-intrusive audio chime using Web Audio API (zero external assets).
 */
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Browsers block audio before first user interaction; ignore silently
  }
};

export const BookingRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newBooking, setNewBooking] = useState<NewBookingAlert | null>(null);
  const [highlightedBookingNumbers, setHighlightedBookingNumbers] = useState<string[]>([]);
  const [highlightedBookingIds, setHighlightedBookingIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const refreshQueries = useCallback(() => {
    // 1. Invalidate queries matching 'bookings' so background cache marks them stale
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    // 2. Actively and immediately refetch any currently mounted/active 'bookings' query!
    queryClient.refetchQueries({ queryKey: ['bookings'], type: 'active' });
    // 3. Keep dashboard stats updated
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.refetchQueries({ queryKey: ['dashboard-stats'], type: 'active' });
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    const initializeSocket = (token: string) => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket: Socket = io(SOCKET_URL, {
        path: '/api/socket.io',
        auth: { token },
        // Stay on HTTP polling. nginx currently proxies /api but the websocket
        // upgrade is dropped, which invalidates the Engine.IO sid (polling 400).
        transports: ['polling'],
        upgrade: false,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 15000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        if (!active) return;
        setIsConnected(true);
        refreshQueries();
      });

      socket.on('disconnect', () => {
        if (!active) return;
        setIsConnected(false);
      });

      socket.on('connect_error', async (err) => {
        if (!active) return;
        setIsConnected(false);
        if (err.message === 'UNAUTHORIZED' && auth.currentUser) {
          try {
            const freshToken = await auth.currentUser.getIdToken(true);
            socket.auth = { token: freshToken };
          } catch {
            // Built-in reconnection will retry with the last token
          }
        }
      });

      // When a new booking is placed
      socket.on('booking:new', (payload: NewBookingAlert) => {
        if (!active) return;
        playNotificationChime();
        setNewBooking({ ...payload, timestamp: Date.now() });

        // Add to highlighted bookings so table row gets green border
        if (payload.bookingNumber) {
          setHighlightedBookingNumbers((prev) => Array.from(new Set([payload.bookingNumber!, ...prev])));
        }
        if (payload.bookingId) {
          setHighlightedBookingIds((prev) => Array.from(new Set([payload.bookingId, ...prev])));
        }

        // 0-SECOND INSTANT INJECTION:
        // If the complete booking object was delivered over the socket, immediately insert it
        // at index 0 of the cached bookings data so it appears on screen in 0 milliseconds!
        if (payload.booking) {
          queryClient.setQueriesData({ queryKey: ['bookings'] }, (oldData: any) => {
            if (!oldData) return oldData;
            const existingList = Array.isArray(oldData.data)
              ? oldData.data
              : Array.isArray(oldData)
              ? oldData
              : [];
            if (
              existingList.some(
                (b: any) =>
                  b.id === payload.booking.id ||
                  b.bookingNumber === payload.booking.bookingNumber
              )
            ) {
              return oldData;
            }
            if (Array.isArray(oldData.data)) {
              return {
                ...oldData,
                data: [payload.booking, ...oldData.data],
                pagination: oldData.pagination
                  ? {
                      ...oldData.pagination,
                      total: (oldData.pagination.total || oldData.data.length) + 1,
                    }
                  : undefined,
              };
            }
            return [payload.booking, ...existingList];
          });
        }

        // Immediately trigger network refetch for active table to reconcile with DB
        refreshQueries();
      });

      socket.on('booking:updated', () => {
        if (!active) return;
        refreshQueries();
      });
    };

    if (isAuthLoading || !isSuperAdmin) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return () => {
        active = false;
      };
    }

    const connect = async () => {
      try {
        const token = isFirebaseWebConfigured()
          ? (await auth.currentUser?.getIdToken()) || ''
          : localStorage.getItem('token') || '';
        if (active && token) {
          initializeSocket(token);
        }
      } catch (err) {
        console.warn('Realtime socket token retrieval failed:', err);
      }
    };

    void connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [refreshQueries, isAuthLoading, isSuperAdmin]);

  const isHighlighted = useCallback(
    (id?: string, bookingNumber?: string): boolean => {
      if (id && highlightedBookingIds.includes(id)) return true;
      if (bookingNumber && highlightedBookingNumbers.includes(bookingNumber)) return true;
      return false;
    },
    [highlightedBookingIds, highlightedBookingNumbers]
  );

  const clearHighlights = useCallback(() => {
    setHighlightedBookingNumbers([]);
    setHighlightedBookingIds([]);
    setNewBooking(null);
  }, []);

  return (
    <BookingRealtimeContext.Provider
      value={{
        newBooking,
        dismissNewBooking: () => setNewBooking(null),
        highlightedBookingNumbers,
        highlightedBookingIds,
        isHighlighted,
        clearHighlights,
        isConnected,
        refetchBookings: refreshQueries,
      }}
    >
      {children}
    </BookingRealtimeContext.Provider>
  );
};

export const useBookingRealtime = () => {
  const context = useContext(BookingRealtimeContext);
  if (!context) {
    throw new Error('useBookingRealtime must be used within a BookingRealtimeProvider');
  }
  return context;
};
