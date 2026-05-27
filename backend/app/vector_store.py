import os
import json
import uuid
import asyncio
from typing import List, Optional
import chromadb
from google import genai
from .config import settings
from .schemas import ProjectIngest, MatchedProject

class VectorStoreManager:
    """
    Manages local ChromaDB vector store operations.
    Handles asynchronous embedding generation via Google GenAI SDK
    and thread-safe interaction with local database engine.
    """
    def __init__(self):
        # Ensure database directory exists
        os.makedirs(settings.chroma_db_dir, exist_ok=True)
        
        # Initialize persistent ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_db_dir)
        
        # Create or fetch collection using cosine distance metric
        self.collection = self.chroma_client.get_or_create_collection(
            name="portfolio",
            metadata={"hnsw:space": "cosine"}
        )
        self._genai_client = None

    @property
    def genai_client(self) -> genai.Client:
        """
        Lazy-loaded property returning Google GenAI Client.
        Ensures client is created only when API key configuration is present.
        """
        if self._genai_client is None:
            if not settings.gemini_api_key:
                raise ValueError(
                    "GEMINI_API_KEY environment variable is not set. "
                    "Please configure it in backend/.env before running queries."
                )
            self._genai_client = genai.Client(api_key=settings.gemini_api_key)
        return self._genai_client

    async def get_embedding(self, text: str) -> List[float]:
        """
        Asynchronously generates embedding for a given string block
        using Google GenAI API.
        """
        # Execute API call asynchronously
        response = await self.genai_client.aio.models.embed_content(
            model=settings.embedding_model,
            contents=text
        )
        return response.embeddings[0].values

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Asynchronously generates embedding list for multiple string blocks.
        """
        if not texts:
            return []
        response = await self.genai_client.aio.models.embed_content(
            model=settings.embedding_model,
            contents=texts
        )
        return [emb.values for emb in response.embeddings]

    async def add_project(self, project: ProjectIngest) -> str:
        """
        Ingests a project into ChromaDB.
        Generates vector embeddings and writes metadata.
        Uses asyncio.to_thread to run blocking database calls off the main event loop.
        """
        project_id = project.id or str(uuid.uuid4())
        
        # Construct single consolidated string for vector embedding calculation
        tech_str = ", ".join(project.technologies)
        document_text = f"Title: {project.title}\nDescription: {project.description}\nTechnologies: {tech_str}"
        if project.metrics:
            document_text += f"\nMetrics: {project.metrics}"
            
        # Get embeddings via async SDK call
        embedding = await self.get_embedding(document_text)
        
        # Prep dictionary format for metadata compatibility
        metadata = {
            "title": project.title,
            "description": project.description,
            "technologies": json.dumps(project.technologies),
            "metrics": project.metrics or ""
        }
        
        # Offload blocking database writing to thread pool
        def _sync_add():
            self.collection.upsert(
                ids=[project_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[document_text]
            )
            
        await asyncio.to_thread(_sync_add)
        return project_id

    async def query_similar_projects(self, query_text: str, limit: int = 3) -> List[MatchedProject]:
        """
        Performs semantic search queries on project portfolio collection.
        Returns top matched experience records.
        """
        # Check if database contains elements before running query
        def _sync_count():
            return self.collection.count()
            
        count = await asyncio.to_thread(_sync_count)
        if count == 0:
            return []

        # Get embedding of query text
        query_embedding = await self.get_embedding(query_text)
        
        # Query ChromaDB (blocking operation run in thread pool)
        def _sync_query():
            return self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=["metadatas", "documents", "distances"]
            )
            
        results = await asyncio.to_thread(_sync_query)
        
        matched_projects = []
        if results and results["ids"] and results["ids"][0]:
            ids = results["ids"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0]
            
            for idx in range(len(ids)):
                meta = metadatas[idx]
                
                # Chroma DB Cosine Distance is 1 - CosineSimilarity.
                # So CosineSimilarity = 1 - Distance.
                similarity = 1.0 - distances[idx]
                
                # Safely parse technologies list
                technologies = []
                try:
                    if meta.get("technologies"):
                        technologies = json.loads(meta["technologies"])
                except Exception:
                    pass
                    
                matched_projects.append(
                    MatchedProject(
                        id=ids[idx],
                        title=meta.get("title", ""),
                        description=meta.get("description", ""),
                        technologies=technologies,
                        metrics=meta.get("metrics") or None,
                        similarity_score=max(0.0, min(1.0, similarity))  # Clamp between [0.0, 1.0]
                    )
                )
                
        # Sort results from highest similarity score to lowest
        matched_projects.sort(key=lambda x: x.similarity_score, reverse=True)
        return matched_projects

# Global singleton manager instantiation
vector_store = VectorStoreManager()
