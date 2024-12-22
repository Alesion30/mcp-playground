import { pipe, safeParse, string, url } from "valibot";

const API_WEATHER_GOV = "https://api.weather.gov";

type FetchWeatherPointPayload = {
  latitude: number;
  longitude: number;
};

type FetchWeatherPointResponse = {
  properties: {
    forecast?: string;
  };
};

export const fetchWeatherPoints = async ({
  latitude,
  longitude,
}: FetchWeatherPointPayload): Promise<FetchWeatherPointResponse> => {
  const response = await fetch(
    `${API_WEATHER_GOV}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weather points: ${response.statusText}`);
  }

  return await response.json();
};

type FetchWeatherForecastResponse = {
  properties: {
    periods: {
      name?: string;
      temperature?: number;
      temperatureUnit?: string;
      windSpeed?: string;
      windDirection?: string;
      shortForecast?: string;
    }[];
  };
};

export const fetchWeatherForecast = async (
  forecastUrl: string
): Promise<FetchWeatherForecastResponse> => {
  const forecastUrlResult = safeParse(pipe(string(), url()), forecastUrl);
  if (!forecastUrlResult.success) {
    throw new Error(`Invalid forecast URL: ${forecastUrl}`);
  }

  const response = await fetch(forecastUrlResult.output);

  if (!response.ok) {
    throw new Error(`Failed to fetch weather forecast: ${response.statusText}`);
  }

  return await response.json();
};
