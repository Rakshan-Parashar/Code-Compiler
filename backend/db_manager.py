from pymongo import MongoClient
import dns.resolver
from backend.config import logger

class DatabaseManager:
    def __init__(self, uri: str):
        self.uri = uri
        self.client = None
        self.db = None
        self._configure_dns()
        self._initialize_client()

    def _configure_dns(self):
        # Configure custom DNS nameservers to resolve mongodb+srv URIs reliably
        try:
            logger.info("Setting up fallback DNS resolver for MongoDB SRV records...")
            custom_resolver = dns.resolver.Resolver(configure=False)
            custom_resolver.nameservers = ['8.8.8.8', '1.1.1.1']
            dns.resolver.default_resolver = custom_resolver
            logger.info("Fallback DNS resolver configured with Google and Cloudflare DNS.")
        except Exception as e:
            logger.error(f"Failed to configure custom DNS resolver: {e}")

    def _initialize_client(self):
        if not self.uri:
            logger.error("MONGODB_URI is not set. Database operations will not be available.")
            return

        try:
            logger.info("Initializing MongoDB client...")
            self.client = MongoClient(self.uri)
            try:
                self.db = self.client.get_default_database()
            except Exception:
                self.db = self.client["zenith_ide"]
            logger.info(f"MongoDB client initialized. Active database: {self.db.name}")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")

    def get_db(self):
        return self.db

    def create_indexes(self):
        if self.db is None:
            logger.error("Cannot create indexes: Database connection is not available.")
            return False

        try:
            logger.info("Verifying database connection and creating indexes...")
            self.db.users.create_index("email", unique=True)
            self.db.snippets.create_index([("userId", 1), ("id", 1)])
            logger.info("Successfully verified database connection and created indexes.")
            return True
        except Exception as e:
            logger.error(f"Failed to verify database connection / indexes: {e}")
            return False
