import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

ALLOWED_GRAPH_TYPES = {"line", "bar", "scatter", "pie"}

def validate_llm_graphs(
    llm_output: Dict[str, Any],
    column_profiles: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Validate and clean LLM suggested graphs.
    """
    column_map = {col["name"].lower(): col["name"] for col in column_profiles}
    valid_graphs = []

    suggestions = llm_output.get("graphs", [])
    if not isinstance(suggestions, list):
        return []

    for graph in suggestions:
        try:
            # Safely get and convert to string
            g_type = str(graph.get("type") or "").lower()
            col_x = str(graph.get("x") or "").lower()
            col_y_val = graph.get("y")
            col_y = str(col_y_val).lower() if col_y_val else None
            
            # 1. Type check
            if g_type not in ALLOWED_GRAPH_TYPES:
                continue

            # 2. X exist check
            if col_x not in column_map:
                continue
            
            # 3. Y exist check (optional)
            if col_y and col_y not in column_map:
                # If Y is invalid but X is valid, we can still do a frequency plot (like Pie or Bar-Count)
                # But for now, let's just skip to keep logic clean or force it to None
                col_y = None

            # Normalize and keep additional LLM context
            agg_val = graph.get("aggregation")
            valid_graph = {
                "type": g_type,
                "x": column_map[col_x],
                "y": column_map[col_y] if col_y else None,
                "aggregation": str(agg_val) if agg_val else "mean",
                "reason": str(graph.get("reason") or "Visualization of data trends."),
                "title": str(graph.get("title") or _generate_fallback_title(g_type, col_x, col_y))
            }
            valid_graphs.append(valid_graph)
        except Exception as e:
            logger.warning(f"Failed to validate graph suggestion: {e}")
            continue

    return valid_graphs

def _generate_fallback_title(g_type, x, y):
    if g_type == "pie": return f"Distribution of {x}"
    return f"{y} by {x}" if y else f"Trends in {x}"
    