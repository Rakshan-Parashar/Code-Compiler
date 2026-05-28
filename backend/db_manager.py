import sqlite3
import json
from backend.config import logger

class SQLiteCollection:
    def __init__(self, conn_func, table_name, key_field="id"):
        self.conn_func = conn_func
        self.table_name = table_name
        self.key_field = key_field

    def find_one(self, filter_query: dict) -> dict:
        conn = self.conn_func()
        cursor = conn.cursor()
        try:
            key_val = None
            if self.key_field in filter_query:
                key_val = filter_query[self.key_field]
            elif "_id" in filter_query:
                key_val = filter_query["_id"]
            
            if key_val is not None:
                cursor.execute(f"SELECT doc FROM {self.table_name} WHERE {self.key_field} = ?", (str(key_val),))
                row = cursor.fetchone()
                if row:
                    return json.loads(row[0])
            
            # Fallback to scanning/filtering
            cursor.execute(f"SELECT doc FROM {self.table_name}")
            rows = cursor.fetchall()
            for row in rows:
                doc = json.loads(row[0])
                match = True
                for k, v in filter_query.items():
                    if k == "$or":
                        # Support simple $or for doc_id/ObjectId
                        or_match = False
                        for sub_query in v:
                            sub_match = True
                            for sk, sv in sub_query.items():
                                if sk == "_id" and doc.get("_id") != str(sv):
                                    sub_match = False
                                    break
                                elif sk != "_id" and doc.get(sk) != sv:
                                    sub_match = False
                                    break
                            if sub_match:
                                or_match = True
                                break
                        if not or_match:
                            match = False
                            break
                    else:
                        check_k = k
                        if k == "_id" and self.key_field not in doc:
                            check_k = self.key_field
                        
                        if doc.get(check_k) != v:
                            match = False
                            break
                if match:
                    return doc
            return None
        finally:
            conn.close()

    def find(self, filter_query: dict = None):
        if filter_query is None:
            filter_query = {}
        conn = self.conn_func()
        cursor = conn.cursor()
        try:
            if "userId" in filter_query and self.table_name == "snippets":
                user_id = filter_query["userId"]
                cursor.execute(f"SELECT doc FROM {self.table_name} WHERE userId = ?", (user_id,))
                rows = cursor.fetchall()
                return [json.loads(row[0]) for row in rows]
            elif self.key_field in filter_query:
                val = filter_query[self.key_field]
                cursor.execute(f"SELECT doc FROM {self.table_name} WHERE {self.key_field} = ?", (str(val),))
                rows = cursor.fetchall()
                return [json.loads(row[0]) for row in rows]
            else:
                cursor.execute(f"SELECT doc FROM {self.table_name}")
                rows = cursor.fetchall()
                results = []
                for row in rows:
                    doc = json.loads(row[0])
                    match = True
                    for k, v in filter_query.items():
                        if doc.get(k) != v:
                            match = False
                            break
                    if match:
                        results.append(doc)
                return results
        finally:
            conn.close()

    def insert_one(self, document: dict):
        conn = self.conn_func()
        cursor = conn.cursor()
        try:
            if "_id" not in document:
                if self.key_field in document:
                    document["_id"] = str(document[self.key_field])
                else:
                    import uuid
                    document["_id"] = str(uuid.uuid4())
            
            key_val = document.get(self.key_field)
            if key_val is None:
                key_val = document["_id"]
                document[self.key_field] = key_val

            doc_str = json.dumps(document)
            
            if self.table_name == "snippets":
                user_id = document.get("userId")
                cursor.execute(
                    f"INSERT INTO {self.table_name} (id, userId, doc) VALUES (?, ?, ?)",
                    (str(key_val), str(user_id), doc_str)
                )
            else:
                cursor.execute(
                    f"INSERT INTO {self.table_name} ({self.key_field}, doc) VALUES (?, ?)",
                    (str(key_val), doc_str)
                )
            conn.commit()
            return InsertResult(key_val)
        except sqlite3.IntegrityError as e:
            raise Exception("Document with this unique identifier already exists.") from e
        finally:
            conn.close()

    def update_one(self, filter_query: dict, update_operation: dict):
        set_data = update_operation.get("$set", {})
        conn = self.conn_func()
        cursor = conn.cursor()
        try:
            doc = self.find_one(filter_query)
            if not doc:
                return UpdateResult(0)
            
            doc.update(set_data)
            if self.key_field in doc:
                doc["_id"] = str(doc[self.key_field])
                
            key_val = doc.get(self.key_field)
            doc_str = json.dumps(doc)
            
            cursor.execute(
                f"UPDATE {self.table_name} SET doc = ? WHERE {self.key_field} = ?",
                (doc_str, str(key_val))
            )
            conn.commit()
            return UpdateResult(1)
        finally:
            conn.close()

    def delete_one(self, filter_query: dict):
        conn = self.conn_func()
        cursor = conn.cursor()
        try:
            doc = self.find_one(filter_query)
            if not doc:
                return DeleteResult(0)
            
            key_val = doc.get(self.key_field)
            cursor.execute(
                f"DELETE FROM {self.table_name} WHERE {self.key_field} = ?",
                (str(key_val),)
            )
            conn.commit()
            return DeleteResult(1)
        finally:
            conn.close()

    def create_index(self, name_or_keys, unique=False):
        pass

class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count

class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

class SQLiteDatabase:
    def __init__(self, db_path):
        self.name = "zenith_ide"
        self.db_path = db_path
        self.users = SQLiteCollection(self._connect, "users", key_field="email")
        self.snippets = SQLiteCollection(self._connect, "snippets", key_field="id")

    def _connect(self):
        return sqlite3.connect(self.db_path)

class DatabaseManager:
    def __init__(self, uri: str = None):
        from backend.config import SQLITE_DB_PATH
        self.db_path = SQLITE_DB_PATH
        self.db = SQLiteDatabase(self.db_path)
        self._initialize_db()

    def _initialize_db(self):
        try:
            logger.info(f"Initializing SQLite database at: {self.db_path}")
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    email TEXT PRIMARY KEY,
                    doc TEXT
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS snippets (
                    id TEXT PRIMARY KEY,
                    userId TEXT,
                    doc TEXT
                )
            """)
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_snippets_userId ON snippets(userId)")
            
            conn.commit()
            conn.close()
            logger.info("SQLite database tables and indexes initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SQLite database: {e}")

    def get_db(self):
        return self.db

    def create_indexes(self):
        return True

    def list_databases(self) -> list[str]:
        return ["zenith_ide"]

    def list_collections(self, db_name: str) -> list[str]:
        if db_name != "zenith_ide":
            return []
        return ["snippets", "users"]

    def query_documents(self, db_name: str, collection_name: str, filter_query: dict, limit: int = 50, skip: int = 0) -> list[dict]:
        try:
            if collection_name not in ["snippets", "users"]:
                return []
            coll = getattr(self.db, collection_name)
            docs = coll.find(filter_query)
            return docs[skip:skip+limit]
        except Exception as e:
            logger.error(f"Failed to query documents: {e}")
            raise e

    def insert_document(self, db_name: str, collection_name: str, document: dict) -> dict:
        try:
            if collection_name not in ["snippets", "users"]:
                raise Exception("Collection access denied")
            coll = getattr(self.db, collection_name)
            res = coll.insert_one(document)
            document["_id"] = str(res.inserted_id)
            return {"ok": True, "document": document}
        except Exception as e:
            logger.error(f"Failed to insert document: {e}")
            raise e

    def update_document(self, db_name: str, collection_name: str, doc_id: str, update_data: dict) -> dict:
        try:
            if collection_name not in ["snippets", "users"]:
                raise Exception("Collection access denied")
            coll = getattr(self.db, collection_name)
            query = {"_id": doc_id}
            
            if "_id" in update_data:
                del update_data["_id"]
                
            res = coll.update_one(query, {"$set": update_data})
            return {"ok": True, "modified_count": res.modified_count}
        except Exception as e:
            logger.error(f"Failed to update document: {e}")
            raise e

    def delete_document(self, db_name: str, collection_name: str, doc_id: str) -> dict:
        try:
            if collection_name not in ["snippets", "users"]:
                raise Exception("Collection access denied")
            coll = getattr(self.db, collection_name)
            query = {"_id": doc_id}
            res = coll.delete_one(query)
            return {"ok": True, "deleted_count": res.deleted_count}
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise e
