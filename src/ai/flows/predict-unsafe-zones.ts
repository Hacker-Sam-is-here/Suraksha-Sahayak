
'use server';

/**
 * @fileOverview Predicts unsafe tourist zones based on location and hybrid data.
 *
 * - predictUnsafeZones - Predicts unsafe tourist zones using a hybrid approach.
 * - PredictUnsafeZonesInput - The input type for the predictUnsafeZones function.
 * - PredictUnsafeZonesOutput - The return type for the predictUnsafeZones function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getRiskAssessment, RiskAssessmentInputSchema, RiskAssessmentPayloadSchema } from '@/services/risk-assessment';
import { searchCrimeNews, CrimeSearchInputSchema, CrimeDataPayloadSchema } from '@/services/crime-data';


const PredictUnsafeZonesInputSchema = z.object({
  locationLat: z.number().describe('Latitude of the location.'),
  locationLong: z.number().describe('Longitude of the location.'),
});
export type PredictUnsafeZonesInput = z.infer<typeof PredictUnsafeZonesInputSchema>;

const EnvironmentalHazardSchema = z.object({
    id: z.string().describe("A unique ID for the hazard."),
    lat: z.number().describe("Latitude of the hazard."),
    lon: z.number().describe("Longitude of the hazard."),
    type: z.enum(['landslide', 'weather']).describe("The type of hazard."),
    title: z.string().describe("A short, descriptive title for the hazard (e.g., 'Landslide Warning')."),
    description: z.string().describe("A brief description of the hazard."),
    severity: z.enum(['medium', 'high']).describe("The severity of the hazard.")
});

const PredictUnsafeZonesOutputSchema = z.object({
  locationName: z.string().describe('The common name of the assessed location (e.g., city, state).'),
  boundingBox: z.array(z.number()).describe('An array of four numbers representing the location bounding box: [south, north, west, east].'),
  safetyScore: z.number().describe('A refined safety score from 0 (most dangerous) to 100 (safest), considering all factors.'),
  riskTag: z.enum(['safe', 'moderate', 'high risk']).describe("A qualitative risk assessment tag based on the safety score (e.g., 0-40 is 'high risk', 41-70 is 'moderate', 71-100 is 'safe')."),
  justification: z.string().describe('A brief, user-friendly justification for the assessment, mentioning key factors like rainfall, landslide risk, or recent crime.'),
  crimeHotspots: z.array(CrimeDataPayloadSchema.shape.incidents.element).describe('A list of recent crime incidents in the area, extracted from news sources.'),
  environmentalHazards: z.array(EnvironmentalHazardSchema).describe('A list of significant environmental hazards like landslide risks or severe weather warnings.')
});
export type PredictUnsafeZonesOutput = z.infer<typeof PredictUnsafeZonesOutputSchema>;

// Define the tool for the AI to use for weather/landslide data
const riskAssessmentTool = ai.defineTool(
  {
    name: 'getHybridRiskAssessment',
    description: 'Fetches real-time environmental data (weather, visibility, landslide probability), a calculated raw environmental risk index, the location name, and its geographical bounding box. This risk index is the definitive measure of environmental danger.',
    inputSchema: RiskAssessmentInputSchema,
    outputSchema: RiskAssessmentPayloadSchema,
  },
  async (input) => getRiskAssessment({lat: input.lat, lon: input.lon})
);

// Define the tool for the AI to use for crime data search
const crimeDataTool = ai.defineTool(
    {
        name: 'searchCrimeNews',
        description: 'Searches for recent crime news for a given query (e.g., city name). Returns a list of news snippets.',
        inputSchema: CrimeSearchInputSchema,
        outputSchema: z.object({ searchResults: z.array(z.string()) }),
    },
    async (input) => searchCrimeNews({ query: input.query })
)

export async function predictUnsafeZones(input: PredictUnsafeZonesInput): Promise<PredictUnsafeZonesOutput> {
  return predictUnsafeZonesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictUnsafeZonesPrompt',
  input: { schema: PredictUnsafeZonesInputSchema },
  output: { schema: PredictUnsafeZonesOutputSchema },
  tools: [riskAssessmentTool, crimeDataTool],
  config: {
    temperature: 0.2,
  },
  prompt: `You are a sophisticated AI model that assesses the safety of tourist zones. Your task is to provide a refined safety assessment by integrating real-time environmental and crime data.

  1.  **Get Environmental Data**: For the given location (Latitude: {{{locationLat}}}, Longitude: {{{locationLong}}}), use the 'getHybridRiskAssessment' tool. This tool provides a highly accurate 'raw_risk_index' for environmental dangers (weather, landslides), along with the location name and its bounding box. Capture the location name and bounding box for the final output. The 'raw_risk_index' is your primary source for environmental risk.

  2.  **Get Crime Data**: Use the 'location' string returned by the previous tool as the query for the 'searchCrimeNews' tool to find recent crime-related news.

  3.  **Analyze and Geocode Crime**: Analyze the search results from the crime news. For each relevant news article that describes a specific crime, extract the key details and format it as a CrimeIncident object for the 'crimeHotspots' array. You must geocode an approximate latitude and longitude for each crime based on its description. Be critical and filter out irrelevant search results. If you find no relevant crime reports, leave the 'crimeHotspots' array empty.

  4.  **Create Environmental Alerts**: Analyze the environmental data. If the landslide_probability is high (e.g., > 0.6), create an 'environmentalHazards' entry. Similarly, if the weather condition is severe (e.g., 'Thunderstorm', 'Heavy Rain', 'Fog'), create a corresponding hazard entry. Position these hazards near the user's coordinates.

  5.  **Synthesize Final Safety Score**: Your primary goal is to synthesize the data into a final 'safetyScore'. Start with the 'raw_risk_index' as the base environmental risk. Now, factor in the crime data. If you found severe or multiple crime incidents, you must significantly increase the overall risk (and thus lower the final safety score). A single, highly severe crime report in a location with otherwise perfect weather should still result in a very low safety score.
  
      - Let Safety Score = 100 - Total Risk.
      - Total Risk is a weighted average of Environmental Risk and Crime Risk.
      - The 'raw_risk_index' IS the Environmental Risk score.
      - YOU must determine the Crime Risk score (0-100) based on the severity and number of incidents found.
      - Combine them, giving crime a significant weight (e.g., 40-50%) in your final calculation.

  6.  **Justify Your Score**: Provide a clear 'justification' that explains the key factors for your final score (e.g., "High risk due to recent violent crime reports, despite clear weather.").

  7.  **Set Risk Tag**: Based on the final safetyScore, set the riskTag: 0-40 is 'high risk', 41-70 is 'moderate', 71-100 is 'safe'.

  Return the complete, structured output object.`,
});

const predictUnsafeZonesFlow = ai.defineFlow(
  {
    name: 'predictUnsafeZonesFlow',
    inputSchema: PredictUnsafeZonesInputSchema,
    outputSchema: PredictUnsafeZonesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
