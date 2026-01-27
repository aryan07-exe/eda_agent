import os
import logging
from dotenv import load_dotenv
load_dotenv()

# Configure a basic logger for this module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional


from schemas import LLMResponse, GraphSuggestion

# ----------------------------
# 2. Initialize Gemini LLM
# ----------------------------

# Ensure key is available
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    # Try one more time to load specifically from root if not found
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.getcwd(), ".env"))
    api_key = os.environ.get("GOOGLE_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2,
    google_api_key=api_key
)

parser = JsonOutputParser(pydantic_object=LLMResponse)

# ----------------------------
# 3. Prompt Templates
# ----------------------------

graph_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a professional data scientist and visualization expert. "
        "Your task is to suggest the most insightful visualizations for a given dataset. "
        "Focus on discovering patterns, anomalies, and correlations that would be valuable for business intelligence. "
        "ONLY suggest graphs that can be built using the provided columns. "
        "For 'bar' and 'line' charts, always specify an aggregation: 'mean', 'sum', 'count', or 'nunique' for the y-axis."
    ),
    (
        "user",
        """
Given the dataset metadata below, suggest the most meaningful graphs.

Rules:
1. Only use provided column names.
2. Prefer trends (timeseries), comparisons (bar), and correlations (scatter/pie).
3. If a column looks like a date/time, prefer a 'line' chart.
4. If a column is categorical with few unique values, prefer a 'pie' or 'bar' chart.
5. Output valid JSON only.

{format_instructions}

DATASET METADATA:
{payload}
"""
    )
])

chat_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are 'Aether', a sophisticated AI data analyst. You are professional, extremely concise, and analytically precise. "
        "You analyze dataset schemas, column profiles, and statistical relationships provided in the context. "
        "\n\nRules for precision and structure:\n"
        "1. Start with a direct answer or a key metric if applicable.\n"
        "2. Use Markdown tables for comparing multiple metrics or categories.\n"
        "3. Use `code blocks` for any data formulas or specific column values.\n"
        "4. Keep paragraphs short (max 2-3 sentences). Use bullet points for lists.\n"
        "5. Be proactive: identify trends, outliers, or correlations without being asked.\n"
        "6. If the data is insufficient to answer, state exactly what is missing.\n"
        "7. Format metrics in **bold** (e.g., **$1.2M** or **15.4%**).\n"
        "8. Avoid jargon; explain complex statistical terms simply."
    ),
    (
        "user",
        """
DATASET CONTEXT:
{context}

USER QUERY:
{question}

Analyze and provide a high-precision executive response.
"""
    )
])


# ----------------------------
# 4. Public functions
# ----------------------------

def get_graph_suggestions(payload: dict) -> dict:
    """Generate graph suggestions from dataset metadata."""
    chain = graph_prompt | llm | parser
    try:
        logger.info(f"Generating professional graph suggestions using {llm.model}...")
        result = chain.invoke({
            "payload": payload,
            "format_instructions": parser.get_format_instructions()
        })
        
        # Ensure result is a valid dict
        if result is None:
            result_dict = {"graphs": [], "summary": "LLM returned no suggestions."}
        elif hasattr(result, 'model_dump'):
            result_dict = result.model_dump()
        elif hasattr(result, 'dict'):
            result_dict = result.dict()
        else:
            try:
                result_dict = dict(result)
            except (TypeError, ValueError):
                result_dict = {"graphs": [], "summary": "Failed to parse LLM response."}

        if "graphs" not in result_dict or not isinstance(result_dict["graphs"], list):
            result_dict["graphs"] = []
        if "summary" not in result_dict:
            result_dict["summary"] = "Visualization suggestions generated successfully."

        return result_dict
        
    except Exception as exc:
        logger.error(f"LLM Graph Suggestion failed: {exc}", exc_info=True)
        return {
            "graphs": [], 
            "summary": f"Could not generate suggestions: {str(exc)[:100]}"
        }

async def chat_with_data(context: dict, question: str) -> str:
    """Answer user questions about the dataset using Gemini."""
    try:
        # Use format_messages to correctly prepare the chat interaction
        messages = chat_prompt.format_messages(
            context=context,
            question=question
        )
        logger.info(f"Sending chat query to {llm.model}...")
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as exc:
        logger.error(f"LLM Chat failed: {exc}")
        return f"I encountered an error while processing your question: {str(exc)}"
