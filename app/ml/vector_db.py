import chromadb
from chromadb.config import Settings
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class SemanticThreatDB:
    def __init__(self, persist_directory="./data/chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(name="threat_emails")
        # Use a lightweight sentence transformer for local, fast embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def _get_embedding(self, text: str):
        return self.model.encode(text).tolist()

    def store_email(self, email_id: str, text_content: str, metadata: dict):
        """Stores the email in the vector database for future semantic matching."""
        try:
            embedding = self._get_embedding(text_content)
            self.collection.add(
                ids=[email_id],
                embeddings=[embedding],
                documents=[text_content],
                metadatas=[metadata]
            )
            logger.info(f"Stored email {email_id} in Vector DB.")
        except Exception as e:
            logger.error(f"Failed to store in Vector DB: {e}")

    def find_similar_threats(self, text_content: str, n_results: int = 3):
        """
        Searches the vector database for semantically similar emails (e.g. same phishing 
        template, different words/URLs).
        """
        try:
            query_embedding = self._get_embedding(text_content)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            matches = []
            if results['ids'] and len(results['ids']) > 0:
                for i in range(len(results['ids'][0])):
                    match_id = results['ids'][0][i]
                    # Distance is typically L2 or Cosine, lower is more similar
                    distance = results['distances'][0][i]
                    metadata = results['metadatas'][0][i]
                    
                    # Convert distance to a rough confidence percentage
                    confidence = max(0.0, 100.0 - (distance * 100.0))
                    
                    matches.append({
                        "email_id": match_id,
                        "confidence": round(confidence, 2),
                        "metadata": metadata
                    })
            return matches
        except Exception as e:
            logger.error(f"Vector DB search failed: {e}")
            return []
