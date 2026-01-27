import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

# Configure module-level logger
logger = logging.getLogger(__name__)

def build_graph_data(df: pd.DataFrame, graph: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construct optimized graph data for the frontend.
    """
    try:
        graph_type = str(graph.get("type") or "").lower()
        col_x = graph.get("x")
        col_y = graph.get("y")
        
        agg_val = graph.get("aggregation")
        agg_func = str(agg_val).lower() if agg_val else None
        
        reason = str(graph.get("reason") or "")

        # 1. Validation
        if col_x not in df.columns:
            logger.warning(f"Column {col_x} not found in dataframe.")
            return {}
        
        # 2. Logic based on type
        if graph_type == "pie":
            # For pie, if y is missing, we count occurrences of x
            if not col_y or col_y not in df.columns or col_y == col_x:
                data = df[col_x].value_counts().head(10).reset_index()
                data.columns = [col_x, 'count']
                return {
                    "type": "pie",
                    "title": f"Distribution of {col_x}",
                    "labels": data[col_x].astype(str).tolist(),
                    "values": data['count'].tolist(),
                    "reason": reason
                }
            else:
                data = df.groupby(col_x)[col_y].sum().sort_values(ascending=False).head(10).reset_index()
                return {
                    "type": "pie",
                    "title": f"Total {col_y} by {col_x}",
                    "labels": data[col_x].astype(str).tolist(),
                    "values": data[col_y].tolist(),
                    "reason": reason
                }

        if graph_type == "scatter":
            if not col_y or col_y not in df.columns:
                return {}
            
            # Downsample if too many points for the browser
            sample_df = df[[col_x, col_y]].dropna()
            # Ensure both are numeric for scatter
            if not (pd.api.types.is_numeric_dtype(sample_df[col_x]) and pd.api.types.is_numeric_dtype(sample_df[col_y])):
                # Fallback to bar if one is categorical
                graph_type = "bar"
                agg_func = agg_func or "mean"
            else:
                if len(sample_df) > 1000:
                    sample_df = sample_df.sample(1000)
                
                return {
                    "type": "scatter",
                    "title": f"{col_y} vs {col_x}",
                    "x": sample_df[col_x].tolist(),
                    "y": sample_df[col_y].tolist(),
                    "reason": reason
                }

        if graph_type in ["bar", "line"]:
            if not col_y or col_y not in df.columns:
                # If no Y, we do frequency count of X
                data = df[col_x].value_counts().head(20).reset_index()
                data.columns = [col_x, 'count']
                return {
                    "type": "bar",
                    "title": f"Frequency of {col_x}",
                    "x": data[col_x].astype(str).tolist(),
                    "y": data['count'].tolist(),
                    "reason": f"Distribution of {col_x} values"
                }

            # Handle aggregation if Y is present
            if agg_func == "sum":
                data = df.groupby(col_x)[col_y].sum().reset_index()
            elif agg_func == "count":
                data = df.groupby(col_x)[col_y].count().reset_index()
            elif agg_func == "nunique":
                data = df.groupby(col_x)[col_y].nunique().reset_index()
            elif agg_func == "min":
                data = df.groupby(col_x)[col_y].min().reset_index()
            elif agg_func == "max":
                data = df.groupby(col_x)[col_y].max().reset_index()
            else:
                # Default to mean for numeric, mode for categorical (though mean is standard for EDA)
                try:
                    data = df.groupby(col_x)[col_y].mean().reset_index()
                except:
                    data = df.groupby(col_x)[col_y].count().reset_index()
                    agg_func = "count"
            
            # Sort and Clean
            data = data.dropna()
            
            # For time-series like data on X, sort by X
            if pd.api.types.is_datetime64_any_dtype(df[col_x]) or "date" in col_x.lower() or "time" in col_x.lower():
                try:
                    data[col_x] = pd.to_datetime(data[col_x])
                    data = data.sort_values(by=col_x)
                    data[col_x] = data[col_x].dt.strftime('%Y-%m-%d')
                except:
                    data = data.sort_values(by=col_y, ascending=False).head(20)
            else:
                data = data.sort_values(by=col_y, ascending=False).head(20)

            return {
                "type": graph_type,
                "title": f"{agg_func.capitalize() if agg_func else 'Average'} of {col_y} by {col_x}",
                "x": data[col_x].astype(str).tolist(),
                "y": data[col_y].tolist(),
                "reason": reason
            }

        return {}

    except Exception as e:
        logger.error(f"Failed to build graph {graph}: {e}")
        return {}
