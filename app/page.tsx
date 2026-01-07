'use client';

import { useState, useEffect, useRef } from 'react';

interface GongTimestamp {
  id: string;
  time: string;
  location: string;
  x: number;
  y: number;
}

export default function Home() {
  const [timestamps, setTimestamps] = useState<GongTimestamp[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Fetch timestamps from server
  const fetchTimestamps = async () => {
    try {
      const response = await fetch('/api/timestamps');
      const data = await response.json();
      
      // Replace with server timestamps (handles deletions and new additions)
      setTimestamps(prev => {
        const serverIds = new Set(data.timestamps.map((t: GongTimestamp) => t.id));
        const optimisticTimestamps = prev.filter(t => !serverIds.has(t.id)); // Keep optimistic ones not yet on server
        return [...optimisticTimestamps, ...data.timestamps];
      });
    } catch (error) {
      // Silently handle errors
    }
  };

  // Load initial timestamps and start polling
  useEffect(() => {
    fetchTimestamps();
    
    // Poll every 1 second for updates
    pollingIntervalRef.current = setInterval(fetchTimestamps, 1000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const playGongSound = async () => {
    if (!audioContextRef.current) return;
    
    // Resume audio context if suspended (required for some browsers)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const audioContext = audioContextRef.current;
    
    // Create a gong-like sound using Web Audio API
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Gong sound: start high frequency, decay quickly
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  const handleGongClick = async () => {
    playGongSound();
    
    // Get user's time and location
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
    
    let locationString = 'Unknown';
    try {
      // Try to get location from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          { 
            timeout: 5000,
            enableHighAccuracy: false,
            maximumAge: 300000 // Accept cached position up to 5 minutes old
          }
        );
      });
      
      // Reverse geocode coordinates to get city, state, country
      try {
        const response = await fetch(
          `/api/geocode?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
        );
        
        if (!response.ok) {
          throw new Error('Geocoding failed');
        }
        
        const data = await response.json();
        
        // Extract city, state, and country from address
        if (data && data.address) {
          const city = data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      data.address.municipality ||
                      data.address.suburb ||
                      data.address.neighbourhood;
          
          const state = data.address.state || 
                       data.address.region ||
                       data.address.province;
          
          const country = data.address.country;
          
          // Format as "City, State, Country"
          const parts = [];
          if (city) parts.push(city);
          if (state) parts.push(state);
          if (country) parts.push(country);
          
          if (parts.length > 0) {
            locationString = parts.join(', ');
          } else {
            // If no address parts, try to use display_name
            locationString = data.display_name?.split(',')[0] || `${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`;
          }
        } else {
          locationString = `${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`;
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, show coordinates
        locationString = `${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`;
      }
    } catch (error) {
      // If location access denied or unavailable, try to get approximate location from IP
      // For now, fall back to showing coordinates would be better than timezone
      // But since we can't get coordinates, we'll show a generic message
      locationString = 'Location unavailable';
    }
    
    // Generate random position for timestamp
    const newTimestamp: GongTimestamp = {
      id: Math.random().toString(36).substr(2, 9),
      time: timeString,
      location: locationString,
      x: Math.random() * 80 + 10, // 10% to 90% of screen width
      y: Math.random() * 80 + 10, // 10% to 90% of screen height
    };
    
    // OPTIMISTIC UPDATE: Show immediately
    setTimestamps(prev => [...prev, newTimestamp]);
    
    // Send to server (fire and forget)
    fetch('/api/timestamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTimestamp.id,
        time: newTimestamp.time,
        location: newTimestamp.location,
        x: newTimestamp.x,
        y: newTimestamp.y
      })
    }).catch(() => {
      // Silently handle errors - timestamp already shown optimistically
    });
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      {/* Gong Circle */}
      <button
        onClick={handleGongClick}
        className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-2xl font-bold text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-300"
      >
        GONG
      </button>

      {/* Timestamps displayed in random positions */}
      {timestamps.map((timestamp) => (
        <div
          key={timestamp.id}
          className="absolute pointer-events-none text-sm text-gray-600 font-mono"
          style={{
            left: `${timestamp.x}%`,
            top: `${timestamp.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-gray-200 shadow-sm">
            <div className="font-semibold">{timestamp.time}</div>
            <div className="text-xs text-gray-500">{timestamp.location}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
