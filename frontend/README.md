# AutoEDA Gen-AI React App

This is the converted React version of your AutoEDA dashboard.

## Features
- **Premium UI/UX**: Built with Framer Motion for smooth animations and transitions.
- **AI-Powered Visualizations**: Integrates with the Gemini-2.0 backend to suggest and render charts.
- **Real-time Statistics**: Shows dataset metadata, correlations, and data health.
- **Responsive Design**: Works on all screen sizes with a modern dark theme.

## Setup Instructions

### 1. Backend
Ensure your FastAPI backend is running:
```bash
python -m uvicorn app.main:app --reload
```

### 2. Frontend
Navigate to the `frontend` directory and start the development server:
```bash
cd frontend
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Tech Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS (CDN/JIT)
- **Animations**: Framer Motion
- **Charts**: Chart.js (react-chartjs-2)
- **Icons**: Lucide React
