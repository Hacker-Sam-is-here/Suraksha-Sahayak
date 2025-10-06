
import { z } from 'genkit';

// Define Zod schemas for validation
export const RiskAssessmentInputSchema = z.object({
    lat: z.number().describe('Latitude of the location.'),
    lon: z.number().describe('Longitude of the location.'),
});
export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

export const RiskAssessmentPayloadSchema = z.object({
    location: z.string().describe('The name of the location.'),
    boundingBox: z.array(z.number()).describe('An array of four numbers representing the bounding box: [south, north, west, east].'),
    weather: z.object({
        temperature: z.number().describe('Temperature in Celsius.'),
        rainfall_mm: z.number().describe('Rainfall in the last hour in mm.'),
        wind_speed_kmh: z.number().describe('Wind speed in km/h.'),
        humidity: z.number().describe('Humidity percentage.'),
        condition: z.string().describe('The main weather condition (e.g., "Clear", "Clouds", "Rain", "Thunderstorm", "Fog").'),
        visibility_km: z.number().describe('Visibility in kilometers.')
    }),
    landslide_probability: z.number().min(0).max(1).describe('Probability of a landslide, amplified by rainfall.'),
    raw_risk_index: z.number().min(0).max(100).describe('Calculated risk index from 0 to 100 based on environmental factors (weather and landslide).'),
});
export type RiskAssessmentPayload = z.infer<typeof RiskAssessmentPayloadSchema>;


// --- Mathematical Helper Functions ---

/**
 * Logistic function (sigmoid) to create smooth curves.
 * @param x - The input value.
 * @returns A value between 0 and 1.
 */
function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Clips a number to be within a specified range.
 * @param min - The minimum value.
 * @param value - The value to clip.
 * @param max - The maximum value.
 * @returns The clipped value.
 */
function clip(min: number, value: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}


// --- Landslide Susceptibility Data ---

// A simple representation of known landslide-prone regions.
const landslideProneZones = [
    { name: 'Himalayan Region', minLat: 26.5, maxLat: 35.5, minLon: 73.0, maxLon: 97.5 },
    { name: 'Western Ghats', minLat: 8.0, maxLat: 21.0, minLon: 72.8, maxLon: 78.0 },
    // In a real app, this would be a more sophisticated GIS lookup from a proper dataset.
];

/**
 * Fetches real-time weather data and calculates a risk index based on a principled formula.
 * @param input - Latitude and longitude
 * @returns A structured risk assessment payload.
 */
export async function getRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessmentPayload> {
    const { lat, lon } = input;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
        throw new Error('OpenWeatherMap API key is not configured.');
    }
    
    // --- 1. Data Fetching (Weather & Location) ---

    // Fetch location name, bounding box, and population density from Nominatim
    let locationName = 'Unknown Location';
    let boundingBox: number[] = [lat - 0.01, lat + 0.01, lon - 0.01, lon + 0.01]; // Default fallback
    let isUrban = false; // Default to rural
    
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&extratags=1`;
        const nominatimResponse = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'SurakshaSahayak/1.0 (surakshasahayaj@firebase.com)' }
        });
        if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            const address = nominatimData.address;
            locationName = [address.suburb, address.city, address.state, address.country].filter(Boolean).join(', ');
            if (nominatimData.boundingbox) {
                boundingBox = nominatimData.boundingbox.map(Number);
            }
            // Check for urban indicators
            const placeType = nominatimData.extratags?.place || nominatimData.type;
            if (['city', 'town', 'suburb', 'urban'].includes(placeType)) {
                isUrban = true;
            }
        } else {
            console.warn(`Nominatim request failed with status: ${nominatimResponse.status}`);
        }
    } catch(error) {
        console.error("Error fetching from Nominatim API:", error);
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const weatherData = await fetch(weatherUrl).then(res => res.json());

    const { main, wind, weather, visibility, rain } = weatherData;
    const temperature = main?.temp ?? 20;
    const rainfall_mm = rain?.['1h'] ?? 0; // rainfall in the last hour
    const wind_speed_kmh = (wind?.speed ?? 0) * 3.6;
    const humidity = main?.humidity ?? 80;
    const condition = weather?.[0]?.main ?? 'Clear';
    const visibility_km = (visibility ?? 10000) / 1000;


    // --- 2. Sub-Risk Calculations ---

    // A) Weather Risk (R_weather)
    const r_rain = 100 * sigmoid(0.15 * (rainfall_mm - 20));
    const r_wind = 100 * sigmoid(0.15 * (wind_speed_kmh - 35));
    const r_vis = 100 * sigmoid(0.8 * (4 - visibility_km));
    
    const temp_dev = Math.max(0, 16 - temperature, temperature - 32);
    const r_temp = 100 * sigmoid(0.25 * (temp_dev - 6));

    let R_weather = clip(0, (0.5 * r_rain) + (0.3 * r_wind) + (0.15 * r_vis) + (0.05 * r_temp), 100);
    // Amplify risk for severe alerts
    if (condition === 'Thunderstorm' || condition === 'Tornado' || condition === 'Squall') {
        R_weather = Math.max(R_weather, 80);
    }

    // B) Landslide Risk (R_slide)
    const base_susceptibility = landslideProneZones.some(zone => 
        lat >= zone.minLat && lat <= zone.maxLat && lon >= zone.minLon && lon <= zone.maxLon
    ) ? 0.25 : 0.02; // Higher base risk if in a known prone region
    
    const rain_index = sigmoid(0.12 * (rainfall_mm - 15));
    const effective_prob = clip(0, base_susceptibility * (1 + 0.8 * rain_index), 1);
    const R_slide = 100 * effective_prob;


    // --- 3. Global Risk Index Calculation ---

    // Define weights based on location type
    const weights = isUrban 
        ? { weather: 0.40, slide: 0.20, crime: 0.40 } // In urban areas, crime might be a higher factor
        : { weather: 0.40, slide: 0.35, crime: 0.25 }; // In rural/hilly areas, environment is key

    // This index combines ONLY the environmental factors. Crime will be handled by the AI.
    // The AI will receive this as a strong signal and combine it with its crime assessment.
    const environmental_risk_index = (weights.weather * (R_weather / 100)) + (weights.slide * (R_slide / 100));
    
    // Normalize to 0-100 scale. The denominator is the sum of weights used.
    const raw_risk_index = clip(0, (environmental_risk_index / (weights.weather + weights.slide)) * 100, 100);
    
    const payload: RiskAssessmentPayload = {
        location: locationName,
        boundingBox,
        weather: {
            temperature,
            rainfall_mm,
            wind_speed_kmh,
            humidity,
            condition,
            visibility_km
        },
        landslide_probability: effective_prob,
        raw_risk_index: parseFloat(raw_risk_index.toFixed(2)),
    };

    return RiskAssessmentPayloadSchema.parse(payload);
}
