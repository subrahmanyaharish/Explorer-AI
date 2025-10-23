export interface WeatherData {
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
}

export interface AqiData {
  value: string;
  category: string;
}

export interface Place {
  name: string;
  description: string;
}

export interface TravelInfo {
  weather: WeatherData;
  aqi: AqiData;
  clothing: string[];
  placesToVisit: Place[];
}

// Based on Gemini API response for grounding chunks
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}