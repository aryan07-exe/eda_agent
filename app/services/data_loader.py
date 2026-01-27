import logging
import pandas as pd
from fastapi import UploadFile
import io
import json

# Configure module-level logger
logger = logging.getLogger(__name__)

class DataLoadError(Exception):
    """Custom exception for data loading errors"""
    pass

async def load_data(upload_file: UploadFile) -> pd.DataFrame:
    """
    Load various data formats (CSV, Excel, JSON) from FastAPI UploadFile.
    """
    filename = upload_file.filename.lower()
    
    try:
        # Properly await the read operation
        content = await upload_file.read()
        # Reset pointer just in case, though content is already in memory
        await upload_file.seek(0)
        
        if filename.endswith(".csv"):
            return _load_csv(content)
        elif filename.endswith((".xls", ".xlsx")):
            return pd.read_excel(io.BytesIO(content))
        elif filename.endswith(".json"):
            return pd.read_json(io.BytesIO(content))
        elif filename.endswith(".parquet"):
            return pd.read_parquet(io.BytesIO(content))
        else:
            # Try to guess or fallback to CSV
            logger.warning(f"Unknown extension {filename}, attempting CSV load")
            return _load_csv(content)
            
    except Exception as e:
        logger.error(f"Failed to load data from {filename}: {e}", exc_info=True)
        raise DataLoadError(f"Failed to load {filename}: {str(e)}")

def _load_csv(content: bytes) -> pd.DataFrame:
    encodings = ["utf-8", "latin-1", "iso-8859-1", "cp1252"]
    for enc in encodings:
        try:
            df = pd.read_csv(io.BytesIO(content), encoding=enc)
            if not df.empty:
                return df
        except UnicodeDecodeError:
            continue
        except Exception:
            continue
    raise DataLoadError("Failed to decode CSV with common encodings or file is empty")
