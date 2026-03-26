// ============================================
// AgriCore — Weather Parser
// Extracts structured weather data from raw
// API responses (SA Weather Service format)
// ============================================

export interface ParsedWeather {
  temperature_min: number;
  temperature_max: number;
  rainfall: number;
  humidity_min: number;
  humidity_max: number;
  wind_speed: number;
  description: string;
}

/**
 * Parse weather data from the SA Weather Service API format.
 * Adapts the raw forecast structure into our flat record format.
 */
export function parseWeatherResponse(data: Record<string, unknown>): ParsedWeather | null {
  try {
    // SA Weather Service typical structure
    const result = data.result as Array<Record<string, unknown>> | undefined;
    if (!result || !Array.isArray(result) || result.length === 0) return null;

    const forecasts = result[0].forecasts as Array<Record<string, unknown>> | undefined;
    if (!forecasts || !Array.isArray(forecasts) || forecasts.length === 0) return null;

    const forecast = forecasts[0];
    const basic = forecast.basic as Record<string, unknown> | undefined;
    const extended = forecast.extended as Record<string, unknown> | undefined;

    if (!basic) return null;

    return {
      temperature_min: toNumber(basic.temperature_minimum, 0),
      temperature_max: toNumber(basic.temperature_maximum, 0),
      rainfall: toNumber(basic.precipitation_amount, 0),
      humidity_min: toNumber(extended?.humidity_minimum, 0),
      humidity_max: toNumber(extended?.humidity_maximum, 0),
      wind_speed: toNumber(basic.wind_speed, 0),
      description: String(basic.description || 'No data'),
    };
  } catch {
    return null;
  }
}

/**
 * Alternative parser for OpenWeatherMap-style responses.
 * Can be swapped in if using a different provider.
 */
export function parseOpenWeatherResponse(data: Record<string, unknown>): ParsedWeather | null {
  try {
    const main = data.main as Record<string, number> | undefined;
    const wind = data.wind as Record<string, number> | undefined;
    const weather = data.weather as Array<Record<string, string>> | undefined;
    const rain = data.rain as Record<string, number> | undefined;

    if (!main) return null;

    return {
      temperature_min: main.temp_min ?? 0,
      temperature_max: main.temp_max ?? 0,
      rainfall: rain?.['1h'] ?? rain?.['3h'] ?? 0,
      humidity_min: main.humidity ?? 0,
      humidity_max: main.humidity ?? 0,
      wind_speed: wind?.speed ?? 0,
      description: weather?.[0]?.description ?? 'No data',
    };
  } catch {
    return null;
  }
}

/**
 * Parser for Open-Meteo API responses.
 * Extracts daily summary from hourly data.
 */
export function parseOpenMeteoResponse(data: Record<string, unknown>): ParsedWeather | null {
  try {
    const hourly = data.hourly as Record<string, number[]> | undefined;
    const current = data.current as Record<string, unknown> | undefined;

    if (!hourly || !hourly.temperature_2m || hourly.temperature_2m.length === 0) return null;

    const temps = hourly.temperature_2m;
    const humidity = hourly.relative_humidity_2m || [];
    const wind = hourly.wind_speed_10m || [];
    const rain = hourly.precipitation || [];

    return {
      temperature_min: Math.min(...temps),
      temperature_max: Math.max(...temps),
      rainfall: rain.reduce((sum: number, v: number) => sum + (v || 0), 0),
      humidity_min: humidity.length > 0 ? Math.min(...humidity) : 0,
      humidity_max: humidity.length > 0 ? Math.max(...humidity) : 0,
      wind_speed: wind.length > 0 ? Math.round(wind.reduce((sum: number, v: number) => sum + v, 0) / wind.length * 10) / 10 : 0,
      description: current && typeof current.temperature_2m === 'number'
        ? `${current.temperature_2m}°C, wind ${current.wind_speed_10m ?? 0} km/h`
        : 'Weather data available',
    };
  } catch {
    return null;
  }
}

function toNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}
