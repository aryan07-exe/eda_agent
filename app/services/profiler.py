import logging
import pandas as pd
import numpy as np
from typing import List, Dict, Any

# Configure module-level logger
logger = logging.getLogger(__name__)

def profile_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Enhanced profile of all columns in a DataFrame.
    """
    profiles = []

    for col in df.columns:
        try:
            series = df[col]
            col_type = infer_column_type(series)
            
            non_null = series.dropna()
            total_rows = len(df)
            missing_count = total_rows - len(non_null)

            profile = {
                "name": col,
                "type": col_type,
                "unique_count": int(series.nunique(dropna=True)),
                "missing_count": int(missing_count),
                "missing_pct": round(float(missing_count / total_rows), 4) if total_rows > 0 else 0.0,
                "sample_values": get_sample_values(series, limit=5),
                "potential_id": False
            }

            # Heuristic for ID columns
            if profile["unique_count"] == total_rows and col_type in ["numeric", "categorical"]:
                if "id" in col.lower() or "key" in col.lower():
                    profile["potential_id"] = True

            if col_type == "numeric":
                profile["stats"] = get_numeric_stats(series)
            elif col_type == "categorical":
                counts = series.value_counts().head(10)
                profile["distribution"] = {str(k): int(v) for k, v in counts.items()}
            elif col_type == "datetime":
                profile["date_stats"] = get_date_stats(series)

            profiles.append(profile)
        except Exception as e:
            logger.warning(f"Failed to profile column '{col}': {e}")
            continue

    return profiles

def infer_column_type(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    
    # Try parsing as date if strings
    if series.dtype == object:
        sample = series.dropna().astype(str).head(20)
        if not sample.empty:
            try:
                # Use a threshold: if 80% of sample is date-like
                parsed = pd.to_datetime(sample, errors='coerce')
                if parsed.notna().mean() > 0.8:
                    return "datetime"
            except:
                pass

    # Improved numeric detection: check if it can be numeric after stripping junk
    if pd.api.types.is_numeric_dtype(series):
        if 1 < series.nunique() < 10 and len(series) > 100:
            return "categorical"
        return "numeric"
    
    if series.dtype == object:
        # Check if it looks like numeric (e.g. "$1,000")
        sample = series.dropna().astype(str).head(20)
        numeric_like = sample.str.replace(r'[$,% ]', '', regex=True).apply(pd.to_numeric, errors='coerce')
        if numeric_like.notna().mean() > 0.8:
            return "numeric"

    return "categorical"

def get_sample_values(series: pd.Series, limit: int = 5) -> List[str]:
    return series.dropna().unique()[:limit].astype(str).tolist()

def get_numeric_stats(series: pd.Series) -> Dict[str, Any]:
    # Clean up non-numeric if it's object type but looks numeric
    if series.dtype == object:
        clean = pd.to_numeric(series.astype(str).str.replace(r'[$,% ]', '', regex=True), errors='coerce').dropna()
    else:
        clean = series.dropna()

    if clean.empty: 
        return {}
    
    try:
        q1 = clean.quantile(0.25)
        q3 = clean.quantile(0.75)
        iqr = q3 - q1
        outliers = clean[(clean < (q1 - 1.5 * iqr)) | (clean > (q3 + 1.5 * iqr))]

        stats = {
            "mean": float(clean.mean()),
            "median": float(clean.median()),
            "min": float(clean.min()),
            "max": float(clean.max()),
            "std": float(clean.std()) if len(clean) > 1 else 0.0,
            "outlier_count": len(outliers),
            "skewness": float(clean.skew()) if len(clean) > 2 else 0.0
        }
        return {k: round(v, 4) if pd.notna(v) else 0.0 for k, v in stats.items()}
    except Exception as e:
        logger.warning(f"Failed to compute numeric stats: {e}")
        return {}

def get_date_stats(series: pd.Series) -> Dict[str, Any]:
    try:
        clean = pd.to_datetime(series, errors='coerce').dropna()
        if clean.empty: return {}
        return {
            "min": clean.min().isoformat(),
            "max": clean.max().isoformat(),
            "range_days": (clean.max() - clean.min()).days
        }
    except:
        return {}
