import logging

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings
    from sentence_transformers import SentenceTransformer
    HAS_CHROMADB = True
except Exception:
    chromadb = None
    SentenceTransformer = None
    HAS_CHROMADB = False

class SemanticThreatDB:
    def __init__(self, persist_directory="./data/chroma_db"):
        self.use_chroma = False
        self.in_memory_store = []
        if HAS_CHROMADB and chromadb is not None and SentenceTransformer is not None:
            try:
                self.client = chromadb.PersistentClient(path=persist_directory)
                self.collection = self.client.get_or_create_collection(name="threat_emails")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                self.use_chroma = True
                logger.info("ChromaDB & SentenceTransformer loaded successfully.")
            except Exception as e:
                logger.warning(f"ChromaDB initialization failed: {e}. Using in-memory fallback.")
                self.use_chroma = False
        else:
            logger.info("Running SemanticThreatDB in lightweight in-memory mode.")

    def _get_embedding(self, text: str):
        if self.use_chroma and hasattr(self, 'model') and self.model:
            return self.model.encode(text).tolist()
        return []

    def store_email(self, email_id: str, text_content: str, metadata: dict):
        """Stores the email in the vector database for future semantic matching."""
        if self.use_chroma:
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
        else:
            self.in_memory_store.append({
                "id": email_id,
                "text": text_content,
                "metadata": metadata
            })
            logger.info(f"Stored email {email_id} in in-memory threat store.")

    def find_similar_threats(self, text_content: str, n_results: int = 3):
        """
        Searches the vector database for semantically similar emails (e.g. same phishing 
        template, different words/URLs).
        """
        if self.use_chroma:
            try:
                query_embedding = self._get_embedding(text_content)
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results
                )
                
                matches = []
                if results['ids'] and len(results['ids']) > 0:
                    for i in range(len(results['ids'][0])):
                        match_id = results['ids'][0][i]
                        distance = results['distances'][0][i]
                        metadata = results['metadatas'][0][i]
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
        else:
            # Simple in-memory matching
            if not self.in_memory_store:
                return []
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity
                
                docs = [item["text"] for item in self.in_memory_store]
                vectorizer = TfidfVectorizer().fit(docs + [text_content])
                item_vecs = vectorizer.transform(docs)
                query_vec = vectorizer.transform([text_content])
                sims = cosine_similarity(query_vec, item_vecs)[0]
                
                scored = []
                for idx, score in enumerate(sims):
                    if score > 0.1:
                        scored.append((score, self.in_memory_store[idx]))
                scored.sort(key=lambda x: x[0], reverse=True)
                
                matches = []
                for score, item in scored[:n_results]:
                    matches.append({
                        "email_id": item["id"],
                        "confidence": round(float(score) * 100.0, 2),
                        "metadata": item["metadata"]
                    })
                return matches
            except Exception as e:
                logger.debug(f"In-memory similarity fallback: {e}")
                return []
