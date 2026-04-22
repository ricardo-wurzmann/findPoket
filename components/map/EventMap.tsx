"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface CityCoord {
  lng: number;
  lat: number;
  zoom: number;
}

export const CITY_COORDS: Record<string, CityCoord> = {
  "São Paulo": { lng: -46.6333, lat: -23.5505, zoom: 12 },
  "Rio de Janeiro": { lng: -43.1729, lat: -22.9068, zoom: 12 },
  "Belo Horizonte": { lng: -43.9378, lat: -19.9191, zoom: 12 },
  Curitiba: { lng: -49.2654, lat: -25.4284, zoom: 12 },
  "Porto Alegre": { lng: -51.2177, lat: -30.0346, zoom: 12 },
  "Foz do Iguaçu": { lng: -54.5854, lat: -25.5163, zoom: 12 },
  Gramado: { lng: -50.8769, lat: -29.3783, zoom: 13 },
  "Balneário Camboriú": { lng: -48.6358, lat: -26.9906, zoom: 13 },
};

export interface MapVenue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  city: string;
}

export interface MapSeriesPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  district: string | null;
}

interface UserPin {
  lng: number;
  lat: number;
}

interface EventMapProps {
  venues?: MapVenue[];
  seriesPins?: MapSeriesPin[];
  city?: string;
}

const PIN_PULSE_CSS = `
  @keyframes userLocPulse {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(3);   opacity: 0; }
  }

  .user-loc-pin::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #ffffff;
    animation: userLocPulse 1.6s ease-out infinite;
  }
`;

export function EventMap({ venues = [], seriesPins = [], city }: EventMapProps) {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [userPin, setUserPin] = useState<UserPin | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);

  useEffect(() => {
    if (!city || !mapRef.current) return;
    const coords = CITY_COORDS[city];
    if (!coords) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: coords.zoom,
      duration: 1200,
    });
  }, [city]);

  const fitBounds = useCallback(() => {
    const points: { lng: number; lat: number }[] = [
      ...venues.map((v) => ({ lng: v.lng, lat: v.lat })),
      ...seriesPins.map((s) => ({ lng: s.lng, lat: s.lat })),
    ];
    if (points.length === 0 || !mapRef.current) return;

    if (points.length === 1) {
      mapRef.current.flyTo({
        center: [points[0].lng, points[0].lat],
        zoom: 14,
        duration: 1000,
      });
      return;
    }

    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    mapRef.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1000 }
    );
  }, [venues, seriesPins]);

  const hasFitRef = useRef(false);
  useEffect(() => {
    if (!hasFitRef.current && venues.length + seriesPins.length > 0) {
      hasFitRef.current = true;
      fitBounds();
    }
  }, [venues, seriesPins, fitBounds]);

  const handleUserLocation = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Localização não disponível");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        setUserPin({ lng: longitude, lat: latitude });
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1200 });
      },
      () => {
        setLocError("Localização não disponível");
        setTimeout(() => setLocError(null), 3000);
      }
    );
  };

  const initialCity = CITY_COORDS["São Paulo"];

  return (
    <div className="relative w-full h-full">
      <style>{PIN_PULSE_CSS}</style>

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: initialCity.lng,
          latitude: initialCity.lat,
          zoom: initialCity.zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        reuseMaps
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {venues.map((venue) => (
          <Marker key={`venue-${venue.id}`} longitude={venue.lng} latitude={venue.lat} anchor="center">
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredVenueId(venue.id)}
              onMouseLeave={() => setHoveredVenueId(null)}
              onClick={() => router.push(`/venues/${venue.id}`)}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: "#ffffff",
                  border: "2px solid #1E1D1A",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "transform 0.1s",
                  transform: hoveredVenueId === venue.id ? "scale(1.3)" : "scale(1)",
                }}
              />
              {hoveredVenueId === venue.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    backgroundColor: "#1E1D1A",
                    border: "1px solid #2A2926",
                    borderRadius: 2,
                    padding: "3px 8px",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  <div style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{venue.name}</div>
                  <div style={{ color: "#9B9690", fontSize: 10 }}>{venue.district}</div>
                </div>
              )}
            </div>
          </Marker>
        ))}

        {seriesPins.map((s) => (
          <Marker key={`series-${s.id}`} longitude={s.lng} latitude={s.lat} anchor="center">
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredSeriesId(s.id)}
              onMouseLeave={() => setHoveredSeriesId(null)}
              onClick={() => router.push(`/series/${s.id}`)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#D97706",
                  border: "2px solid #1E1D1A",
                  borderRadius: 2,
                  cursor: "pointer",
                  transform:
                    hoveredSeriesId === s.id ? "rotate(45deg) scale(1.15)" : "rotate(45deg)",
                  transition: "transform 0.1s",
                  boxSizing: "content-box",
                }}
              />
              {hoveredSeriesId === s.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    backgroundColor: "#1E1D1A",
                    border: "1px solid #2A2926",
                    borderRadius: 2,
                    padding: "3px 8px",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  <div style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ color: "#9B9690", fontSize: 10 }}>{s.city}</div>
                </div>
              )}
            </div>
          </Marker>
        ))}

        {userPin && (
          <Marker longitude={userPin.lng} latitude={userPin.lat} anchor="center">
            <div
              className="user-loc-pin relative rounded-full"
              style={{
                width: 14,
                height: 14,
                backgroundColor: "#ffffff",
                border: "2px solid #1E1D1A",
              }}
            />
          </Marker>
        )}
      </Map>

      <button
        onClick={handleUserLocation}
        className="absolute bottom-14 right-3 bg-[#1E1D1A] border border-[#2A2926] px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors hover:border-[#6B6660]"
        title="Usar minha localização"
      >
        <span className="text-[#9B9690] text-[11px]">◎</span>
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#9B9690]">
          Minha localização
        </span>
      </button>

      {locError && (
        <div className="absolute bottom-24 right-3 bg-[#1E1D1A] border border-[#2A2926] px-3 py-2 rounded-sm">
          <span className="text-[11px] text-[#9B9690]">{locError}</span>
        </div>
      )}
    </div>
  );
}
