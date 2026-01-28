# Analytix EDA 🚀

Analytix is a professional Automated Exploratory Data Analysis (EDA) engine with a clean, official interface and a powerful FastAPI backend.

## 📁 Project Structure

```text
.
├── app/                # Backend (FastAPI)
│   ├── api/            # API endpoints
│   ├── services/       # Business logic & LLM integration
│   ├── schemas/        # Pydantic models
│   ├── tests/          # Test scripts & archives
│   ├── .env           # Environment variables (API Keys)
│   ├── main.py         # Entry point
│   └── requirements.txt # Python dependencies
├── frontend/           # Frontend (React + Vite + Tailwind)
│   ├── src/            # Components & Logic
│   ├── public/         # Static assets
│   └── package.json    # Node dependencies
└── .gitignore          # Git exclusion rules
```

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd app
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Add your GOOGLE_API_KEY to app/.env
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## ✨ Features
- **Intelligent Analysis**: Automatically detects data types, distributions, and correlations.
- **AI Executive Summary**: Generates high-level business insights using Gemini Pro.
- **Bento Dashboard**: Modern, responsive UI with interactive visualizations.
- **AI Analyst Chat**: Precise, data-aware floating assistant for deep dives.
- **Focus Mode**: Expand any chart for detailed inspection.

Check it out nd give feedbacks
