import os
import logging
from dotenv import load_dotenv

# Load env file from the project root (parent directory of backend)
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
env_path = os.path.join(project_root, ".env")
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("atmos-backend")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-atmos-ide-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# SQLite Database path (located in the project root)
SQLITE_DB_PATH = os.path.join(project_root, "db.sqlite3")
