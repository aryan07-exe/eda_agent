from typing import List, Dict, Any
import pandas as pd

def build_llm_payload(
    column_profiles: List[Dict[str, Any]],
    relationship_stats: Dict[str, Any],
    df: pd.DataFrame
) -> Dict[str, Any]:
    """
    Construct an enriched metadata payload for the LLM.
    """
    # Filter out potential IDs from graph suggestions to avoid noise
    active_columns = [col for col in column_profiles if not col.get("potential_id")]

    return {
        "dataset_summary": {
            "row_count": len(df),
            "column_count": len(df.columns),
            "time_series_detected": relationship_stats.get("has_time_column", False),
            "numeric_columns": [c["name"] for c in column_profiles if c["type"] == "numeric"],
            "categorical_columns": [c["name"] for c in column_profiles if c["type"] == "categorical"]
        },
        "column_details": [
            {
                "name": col["name"],
                "type": col["type"],
                "uniqueness": f"{col['unique_count']} unique values",
                "missing_pct": f"{col['missing_pct']*100}%",
                "sample_values": col.get("sample_values", []),
                "stats": col.get("stats") if col["type"] == "numeric" else None
            }
            for col in active_columns
        ],
        "key_relationships": {
            "top_numeric_correlations": [
                rel for rel in relationship_stats.get("numeric_correlations", [])
                if abs(rel["correlation"]) > 0.3
            ],
            "categorical_metric_impacts": relationship_stats.get("categorical_insights", []),
            "categorical_pairings": relationship_stats.get("categorical_pairings", [])
        },
        "instruction": (
            "Analyze the metadata carefully. Suggest 5-8 visualizations. "
            "For numeric vs numeric, suggest 'scatter' or 'line'. "
            "For categorical vs numeric, suggest 'bar' with 'mean' or 'sum' aggregation. "
            "For categorical vs categorical, suggest 'bar' with 'count' aggregation. "
            "If a column shows extreme variance across categories (check categorical_metric_impacts), PRIORITIZE that. "
            "Return valid JSON only."
        )
    }
