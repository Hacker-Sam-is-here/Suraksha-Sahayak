import { z } from 'genkit';

// Schema for the structured crime data you want the AI to extract
export const CrimeIncidentSchema = z.object({
    id: z.string().describe('Unique identifier for the crime incident (e.g., a hash of the URL).'),
    lat: z.number().describe('An approximate latitude for the crime location, estimated from the text.'),
    lon: z.number().describe('An approximate longitude for the crime location, estimated from the text.'),
    crime_type: z.string().describe('Type of crime (e.g., theft, assault).'),
    time_estimate: z.string().describe('Estimated time of the incident (e.g., "2 days ago").'),
    severity: z.enum(['low', 'medium', 'high']).describe('Severity of the crime.'),
    summary: z.string().describe('A brief summary of the incident from the news.'),
    source_url: z.string().url().describe('URL to the news article or source.')
});

// Schema for the output of the AI flow (which includes the structured crime data)
export const CrimeDataPayloadSchema = z.object({
    incidents: z.array(CrimeIncidentSchema).describe('A list of recent crime incidents near the location.'),
});
export type CrimeDataPayload = z.infer<typeof CrimeDataPayloadSchema>;

// Schema for the input of the crime search tool
export const CrimeSearchInputSchema = z.object({
  query: z.string().describe("The search query, typically a city and/or region name (e.g., 'Delhi India')."),
});
export type CrimeSearchInput = z.infer<typeof CrimeSearchInputSchema>;


/**
 * Simulates fetching crime incidents by searching DuckDuckGo and returning raw text.
 * The AI will then process this text to extract structured data.
 * @param input - The search query.
 * @returns A promise that resolves to a list of raw search result strings.
 */
export async function searchCrimeNews(input: CrimeSearchInput): Promise<{ searchResults: string[] }> {
    const { query } = input;
    if (!query) {
        return { searchResults: [] };
    }
    
    // Construct multiple, more specific search queries to get varied and relevant results.
    const queries = [
        `recent crime reports ${query}`,
        `latest crime news in ${query}`,
        `murder in ${query}`,
        `theft in ${query}`,
        `assault in ${query}`,
        `robbery in ${query}`,
        `kidnapping in ${query}`,
        `scams targeting tourists in ${query}`,
        `police cases ${query} past week`,
    ];

    try {
        // We will fetch all search queries in parallel
        const searchPromises = queries.map(async (q) => {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`;
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`DuckDuckGo API request failed for query "${q}" with status: ${response.status}`);
                return null;
            }
            return response.json();
        });

        const results = await Promise.all(searchPromises);

        const allText: string[] = [];
        results.forEach(result => {
            if (result && result.RelatedTopics) {
                 const snippets = result.RelatedTopics.map((topic: any) => topic.Text).filter(Boolean);
                 allText.push(...snippets);
            }
            if (result && result.AbstractText) {
                allText.push(result.AbstractText);
            }
            if (result && result.Results) { // For some queries, results are in 'Results'
                const snippets = result.Results.map((res: any) => res.Text).filter(Boolean);
                allText.push(...snippets);
            }
        });

        // Remove duplicates and limit to the top 20 results to provide a rich context.
        const uniqueText = [...new Set(allText)];
        return { searchResults: uniqueText.slice(0, 20) };

    } catch (error) {
        console.error('Error fetching from DuckDuckGo API:', error);
        return { searchResults: [] };
    }
}


/**
 * LEGACY MOCK FUNCTION - No longer used by the primary AI flow.
 * Kept for reference or testing purposes.
 * @param input - Latitude and longitude of the user's location.
 * @returns A promise that resolves to a payload containing mock crime incidents.
 */
export async function getCrimeIncidents(input: {lat: number, lon: number}): Promise<CrimeDataPayload> {
    const mockCrimeDatabase = [
        {
            id: 'crime-1',
            lat: 28.6139,
            lon: 77.2090, // Delhi
            crime_type: 'theft',
            time_estimate: '2 days ago',
            severity: 'medium',
            summary: 'A tourist reported a stolen wallet near Connaught Place.',
            source_url: 'https://timesofindia.indiatimes.com/'
        },
        { 
            id: 'crime-4', 
            lat: 27.9881, 
            lon: 86.9250, // Near Everest
            crime_type: 'illegal_guiding', 
            time_estimate: '3 days ago',
            severity: 'low',
            summary: 'An unlicensed tour guide was detained for offering unauthorized expeditions.',
            source_url: 'https://kathmandupost.com/'
        }
    ];

    const { lat, lon } = input;
    const nearbyIncidents = mockCrimeDatabase.filter(crime => {
        const latDiff = Math.abs(crime.lat - lat);
        const lonDiff = Math.abs(crime.lon - lon);
        return latDiff < 0.1 && lonDiff < 0.1;
    });

    return CrimeDataPayloadSchema.parse({ incidents: nearbyIncidents });
}
