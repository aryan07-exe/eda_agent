from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class GraphSuggestion(BaseModel):
    type: str = Field(
        description="Graph type: line, bar, scatter, pie"
    )
    x: str = Field(
        description="Column name for x-axis"
    )
    y: Optional[str] = Field(
        description="Column name for y-axis (optional for pie)"
    )
    aggregation: Optional[str] = Field(
        description="Aggregation if needed (mean, sum)"
    )
    reason: str = Field(
        description="Why this graph is meaningful"
    )

class LLMResponse(BaseModel):
    graphs: List[GraphSuggestion]
    summary: Optional[str] = Field(
        description="A brief summary of the insights found in the data"
    )

class ColumnProfile(BaseModel):
    name: str
    type: str
    unique_count: int
    missing_pct: float
    sample_values: List[str]
    stats: Optional[Dict[str, float]] = None

class AnalysisResponse(BaseModel):
    summary: Dict[str, Any]
    profiles: List[ColumnProfile]
    statistics: Dict[str, Any]
    graphs: List[Dict[str, Any]]

class ChatRequest(BaseModel):
    context: Dict[str, Any]
    question: str
