import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Any

# Configure module-level logger
logger = logging.getLogger(__name__)

def compute_relationship_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute comprehensive relationship statistics.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    stats = {
        "has_time_column": any(pd.api.types.is_datetime64_any_dtype(df[c]) for c in df.columns),
        "numeric_correlations": compute_numeric_correlations(df, numeric_cols),
        "categorical_insights": compute_categorical_insights(df, categorical_cols, numeric_cols),
        "categorical_pairings": compute_categorical_pairings(df, categorical_cols)
    }

    return stats

def compute_numeric_correlations(df: pd.DataFrame, cols: List[str]) -> List[Dict[str, Any]]:
    if len(cols) < 2: return []
    try:
        corr_matrix = df[cols].corr().stack().reset_index()
        corr_matrix.columns = ['col1', 'col2', 'correlation']
        
        filtered = corr_matrix[corr_matrix['col1'] < corr_matrix['col2']].copy()
        filtered['correlation'] = filtered['correlation'].round(4)
        
        filtered['abs_corr'] = filtered['correlation'].abs()
        top_corrs = filtered.sort_values(by='abs_corr', ascending=False).head(15)
        
        results = []
        for _, row in top_corrs.iterrows():
            results.append({
                "x": row['col1'],
                "y": row['col2'],
                "correlation": row['correlation'],
                "reasoning": _get_corr_description(row['correlation'])
            })
        return results
    except Exception as e:
        logger.warning(f"Correlation computation failed: {e}")
        return []

def compute_categorical_insights(df: pd.DataFrame, cat_cols: List[str], num_cols: List[str]) -> List[Dict[str, Any]]:
    insights = []
    # Identify which categories have the most impact on numeric means
    for cat in cat_cols[:5]: 
        if 1 < df[cat].nunique() < 15:
            for num in num_cols[:5]:
                try:
                    means = df.groupby(cat)[num].mean().sort_values()
                    if len(means) > 1:
                        diff_pct = (means.max() - means.min()) / (abs(means.mean()) + 1e-9)
                        if diff_pct > 0.2: # 20% difference is notable
                            insights.append({
                                "category": cat,
                                "metric": num,
                                "impact": f"High variance: {means.index[-1]} is {diff_pct:.1%} higher than average",
                                "trend": "correlation"
                            })
                except: continue
    return insights

def compute_categorical_pairings(df: pd.DataFrame, cat_cols: List[str]) -> List[Dict[str, Any]]:
    """Detect strongest co-occurrences between categorical columns."""
    pairings = []
    if len(cat_cols) < 2: return []
    
    for i in range(len(cat_cols[:5])):
        for j in range(i+1, len(cat_cols[:5])):
            c1, c2 = cat_cols[i], cat_cols[j]
            try:
                # Use crosstab to find dependencies
                ct = pd.crosstab(df[c1], df[c2])
                # Simple heuristic: if top cell has > 50% of its row/col
                max_val = ct.values.max()
                if max_val > (len(df) * 0.1): # Only if it's a significant slice
                    pairings.append({
                        "col1": c1,
                        "col2": c2,
                        "strength": float(max_val / len(df))
                    })
            except: continue
    return sorted(pairings, key=lambda x: x['strength'], reverse=True)[:5]

def _get_corr_description(val: float) -> str:
    abs_val = abs(val)
    if abs_val > 0.8: return "Very strong relationship"
    if abs_val > 0.5: return "Strong relationship"
    if abs_val > 0.3: return "Moderate relationship"
    return "Weak relationship"
