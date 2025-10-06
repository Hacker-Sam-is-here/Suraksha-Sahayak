# Suraksha Sahayak - AI Tourist Guardian

Welcome to Suraksha Sahayak, an AI-powered platform designed to enhance tourist safety. The application provides real-time safety analysis of a user's location, combining environmental data, crime reports, and AI-driven insights to generate a dynamic safety score. It features an interactive map, an SOS alert system, and an admin dashboard for monitoring incidents.

## Key Features

- **Real-time Safety Analysis**: Generates a safety score (0-100) for the user's current location based on weather, landslide risk, and local crime data.
- **Interactive Map**: Visualizes the user's location, active SOS alerts, and a color-coded risk zone (green, yellow, red) based on the safety assessment.
- **Area Scan Feed**: Displays live alerts for environmental hazards and recent crime incidents.
- **SOS Emergency Button**: Allows users to send an emergency alert with their live location, which appears on the admin dashboard.
- **Admin Dashboard**: A dedicated portal for authorities to view a live map of all active SOS incidents and manage their status.
- **AI-Powered Insights**: Uses Genkit and Google's Gemini models to analyze unstructured data (like news articles) and provide qualitative risk assessments.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Generative AI**: Google's Genkit & Gemini
- **Mapping**: MapLibre GL JS
- **APIs**:
  - OpenWeatherMap (for real-time weather data)
  - Nominatim (for reverse geocoding)
  - DuckDuckGo (for news/crime data search)

---

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm` or `yarn`

### 1. Download Project Files

Download all project files and folders, **except for `node_modules` and `.next`**.

### 2. Install Dependencies

Navigate to the project's root directory in your terminal and install the required packages.

```bash
npm install
```

### 3. Set Up Environment Variables

Create a new file named `.env` in the root of the project by making a copy of `.env.example` (if it exists) or by creating it from scratch. You will need to add the following API keys:

```env
# Get a free API key from https://openweathermap.org/
OPENWEATHERMAP_API_KEY=YOUR_OPENWEATHERMAP_API_KEY

# Get your API key from Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**Note**: The application will not function correctly without these keys.

### 4. Run the Development Server

Once the dependencies are installed and your environment variables are set, you can start the development server.

```bash
npm run dev
```

The application should now be running at [http://localhost:9002](http://localhost:9002).

---

## Project Structure

Here is a brief overview of the key directories in the project:

- **/src/app/**: Contains the main pages and layouts of the application, following the Next.js App Router structure.
- **/src/components/**: Contains all the reusable React components, including UI elements built with ShadCN.
- **/src/ai/**: The heart of the AI functionality.
  - **/flows/**: Contains the Genkit flows that orchestrate calls to the Gemini model and other services.
- **/src/services/**: Houses modules that interact with external APIs (OpenWeatherMap, Nominatim, etc.) and perform specific calculations like the risk assessment.
- **/src/context/**: Contains React Context providers for managing global state, such as incident data.
- **/src/hooks/**: Holds custom React hooks, like `useLocation` for getting the user's geolocation.
- **/public/**: For static assets like images or fonts.

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase for errors and style issues.
