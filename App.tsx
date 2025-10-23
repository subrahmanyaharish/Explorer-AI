import React, { useState, useCallback } from 'react';
import type { TravelInfo, WeatherData, AqiData, Place, GroundingChunk } from './types';
import { getTravelInfo } from './services/geminiService';

// --- SVG Icons ---
const ThermometerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 18h2a3 3 0 003-3v-5a3 3 0 00-3-3h-2a3 3 0 00-3 3v5a3 3 0 003 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V3m0 18v-3" /></svg>);
const CloudIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 1012 3a5 5 0 00-5 5.001V9" /></svg>);
const DropletIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-9.5 8-14a8 8 0 00-16 0c0 4.5 8 14 8 14z" /></svg>);
const WindIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.25 4.5h13.5" /></svg>);
const LeafIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 14.25l-2.5-2.5m0 0l-2.5 2.5m2.5-2.5v10.5m0-10.5l2.5-2.5m-2.5 2.5l2.5 2.5" /></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>);

// --- Reusable Components ---
const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/20 ${className}`}>
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    {children}
  </div>
);

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-white/80">
    <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg">Analyzing your destination...</p>
    <p className="text-sm">Please wait while we gather the latest information.</p>
  </div>
);

// --- Display Components ---
const WeatherDisplay: React.FC<{ data: WeatherData }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-4 text-white">
    <div className="flex items-center space-x-3"><ThermometerIcon /><p><strong>Temp:</strong> {data.temperature}</p></div>
    <div className="flex items-center space-x-3"><CloudIcon /><p><strong>Condition:</strong> {data.condition}</p></div>
    <div className="flex items-center space-x-3"><DropletIcon /><p><strong>Humidity:</strong> {data.humidity}</p></div>
    <div className="flex items-center space-x-3"><WindIcon /><p><strong>Wind:</strong> {data.windSpeed}</p></div>
  </div>
);

const AqiDisplay: React.FC<{ data: AqiData }> = ({ data }) => (
  <div className="flex items-center space-x-4 text-white">
    <LeafIcon />
    <div>
      <p><strong>AQI Value:</strong> {data.value}</p>
      <p><strong>Category:</strong> {data.category}</p>
    </div>
  </div>
);

const ClothingSuggestions: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside text-white/90 space-y-1">
    {items.map((item, index) => <li key={index}>{item}</li>)}
  </ul>
);

const PlacesList: React.FC<{ places: Place[] }> = ({ places }) => (
  <ul className="space-y-3 text-white/90">
    {places.map((place, index) => (
      <li key={index}>
        <strong className="text-white">{place.name}</strong>
        <p className="text-sm">
          <a href={place.description} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 underline transition-colors">
            View on Google Maps
          </a>
        </p>
      </li>
    ))}
  </ul>
);

// --- Main App Component ---
export default function App() {
  const [location, setLocation] = useState('');
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string>('');

  const parseTravelInfo = useCallback((markdown: string): TravelInfo => {
    const info: Omit<TravelInfo, 'nearbyPlaces'> & { nearbyPlaces?: Place[] } = {
      weather: { temperature: 'N/A', condition: 'N/A', humidity: 'N/A', windSpeed: 'N/A' },
      aqi: { value: 'N/A', category: 'N/A' },
      clothing: [],
      placesToVisit: [],
    };

    const sections = markdown.split(/^#\s/m).filter(s => s.trim() !== '');

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const header = lines[0].trim();

      if (header.startsWith('Weather')) {
        info.weather.temperature = section.match(/\*\*Temperature:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
        info.weather.condition = section.match(/\*\*Condition:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
        info.weather.humidity = section.match(/\*\*Humidity:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
        info.weather.windSpeed = section.match(/\*\*Wind Speed:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
      } else if (header.startsWith('Air Quality Index')) {
        info.aqi.value = section.match(/\*\*AQI Value:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
        info.aqi.category = section.match(/\*\*Category:\*\*\s*(.*)/)?.[1]?.trim() || 'N/A';
      } else if (header.startsWith('Recommended Clothing')) {
        info.clothing = lines.slice(1).map(line => line.replace(/-\s*/, '').trim()).filter(Boolean);
      } else if (header.startsWith('Places to Visit')) {
        info.placesToVisit = lines.slice(1).map(line => {
          const match = line.match(/\d+\.\s+(?:\*\*(.*?)\*\*|(.*?)):\s*(.*)/);
          if (!match) return null;
          const name = (match[1] || match[2] || '').trim();
          const description = (match[3] || '').trim();
          return name && description ? { name, description } : null;
        }).filter((p): p is Place => p !== null);
      }
    });

    return info as TravelInfo;
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    setError(null);
    setTravelInfo(null);
    setSearchedLocation(location);

    try {
      const { text } = await getTravelInfo(location);
      const parsedInfo = parseTravelInfo(text);
      setTravelInfo(parsedInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [location, parseTravelInfo]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-500">
            Explorer AI
          </h1>
          <p className="mt-2 text-lg text-slate-300">Your AI-powered travel companion</p>
        </header>

        <form onSubmit={handleSearch} className="relative mb-8">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter a city or location (e.g., Paris, France)"
            className="w-full pl-5 pr-12 py-4 text-lg bg-white/5 border-2 border-white/20 rounded-full focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 placeholder-slate-400"
            disabled={isLoading}
          />
          <button type="submit" className="absolute inset-y-0 right-0 flex items-center justify-center w-16 h-full text-cyan-300 hover:text-white disabled:text-slate-500 transition-colors" disabled={isLoading}>
            <SearchIcon />
          </button>
        </form>

        <div className="transition-opacity duration-500">
          {isLoading && <Loader />}
          {error && <div className="text-center p-6 bg-red-500/20 border border-red-500 rounded-xl text-red-300">{error}</div>}
          
          {travelInfo && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center text-white">Travel Guide for {searchedLocation}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoCard title="Current Weather">
                  <WeatherDisplay data={travelInfo.weather} />
                </InfoCard>
                <InfoCard title="Air Quality Index (AQI)">
                  <AqiDisplay data={travelInfo.aqi} />
                </InfoCard>
              </div>
              <InfoCard title="Recommended Clothing">
                <ClothingSuggestions items={travelInfo.clothing} />
              </InfoCard>
              <InfoCard title="Places to Visit">
                <PlacesList places={travelInfo.placesToVisit} />
              </InfoCard>
            </div>
          )}

          {!isLoading && !error && !travelInfo && (
            <div className="text-center text-slate-400 py-16">
              <p>Enter a destination to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}