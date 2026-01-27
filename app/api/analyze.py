import logging
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from services.data_loader import load_data, DataLoadError
from services.profiler import profile_columns
from services.stats import compute_relationship_stats
from services.llm_payload import build_llm_payload
from services.llm_client import get_graph_suggestions, chat_with_data
from services.llm_validator import validate_llm_graphs
from services.graph_builder import build_graph_data
from schemas import ChatRequest

# Configure module-level logger
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    """
    Comprehensive Data Analysis Endpoint.
    Supports CSV, Excel, JSON.
    """
    try:
        # Basic validation of the uploaded file object
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded or filename is missing.")
            
        logger.info(f"Starting analysis for: {file.filename}")
        # 1. Load Data
        try:
            df = await load_data(file)
            logger.info(f"Data loaded successfully. Shape: {df.shape}")
        except Exception as e:
            logger.error(f"Data loading failed: {e}")
            raise DataLoadError(f"Failed to load data: {str(e)}")
        
        # 2. Extract Data Insights
        column_profiles = profile_columns(df)
        relationship_stats = compute_relationship_stats(df)
        logger.info(f"Extracted profiles for {len(column_profiles)} columns.")

        # 3. Intelligent Visualization Recommendations
        payload = build_llm_payload(column_profiles, relationship_stats, df)
        llm_suggestion = get_graph_suggestions(payload)
        
        # 4. Generate Graph Data
        valid_configs = validate_llm_graphs(llm_suggestion, column_profiles)
        logger.info(f"LLM suggested {len(valid_configs)} valid graphs.")
        
        graphs = []
        for config in valid_configs:
            graph_data = build_graph_data(df, config)
            if graph_data:
                graphs.append(graph_data)

        # 5. Data Preview (First 5 rows)
        preview_data = df.head(10).fillna("").to_dict(orient="records")

        return {
            "status": "success",
            "metadata": {
                "filename": file.filename,
                "rows": len(df),
                "columns": len(df.columns),
                "insights": llm_suggestion.get("summary", "Analysis complete."),
                "preview": preview_data
            },
            "profiles": column_profiles,
            "statistics": relationship_stats,
            "visualizations": graphs
        }

    except DataLoadError as e:
        logger.warning(f"DataLoadError for {file.filename}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis of {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat with the dataset metadata.
    """
    try:
        answer = await chat_with_data(request.context, request.question)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
