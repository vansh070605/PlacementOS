"""
vector_store.py  –  PlacementOS Local Embedding Vector Store
=============================================================
HARDENING v2 – Local Embedding Migration

This version replaces the remote Gemini embeddings with a fully LOCAL
SentenceTransformer model (`all-MiniLM-L6-v2`) via ChromaDB's built-in
SentenceTransformerEmbeddingFunction. Key benefits:

  1. ZERO Gemini API calls for embeddings — the full 15-RPM budget is
     reserved exclusively for the LLM agent generate_content() calls.
  2. Sub-millisecond embedding latency (CPU inference, ~80 MB model).
  3. The model is auto-downloaded from HuggingFace Hub on first startup.
  4. Dimensionality change: gemini-embedding-2 produced 768-dim vectors;
     all-MiniLM-L6-v2 produces 384-dim vectors.
"""

import os

# Prevent PyTorch/Tokenizer deadlocks when using threads
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import json
import uuid
import asyncio
import logging
import chromadb
from typing import List, Optional
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from .config import settings
from .schemas import ProjectIngest, MatchedProject

logger = logging.getLogger("placementos.vector_store")


class VectorStoreManager:
    """
    Manages local ChromaDB vector store operations with LOCAL embeddings.
    All embedding computation is performed on-device via SentenceTransformers.
    No Google GenAI API calls are made by this module.
    """

    def __init__(self):
        # Ensure the ChromaDB persistence directory exists
        os.makedirs(settings.chroma_db_dir, exist_ok=True)

        logger.info("Initializing local SentenceTransformer embedding model 'all-MiniLM-L6-v2'...")
        self._embedding_fn = SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        logger.info("Local SentenceTransformer embedding model loaded successfully.")

        # Initialize persistent ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_db_dir)

        # Get or create collection with local embedding function
        # Recreated to 'portfolio_local_v2' to avoid dim clash (384 vs 768)
        self.collection = self.chroma_client.get_or_create_collection(
            name="portfolio_local_v2",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._embedding_fn,
        )
        logger.info(
            f"ChromaDB collection 'portfolio_local_v2' ready. "
            f"Current document count: {self.collection.count()}"
        )

    async def add_project(self, project: ProjectIngest) -> str:
        """
        Ingests a project into ChromaDB.
        """
        project_id = project.id or str(uuid.uuid4())

        # Construct consolidated document string for embedding
        tech_str = ", ".join(project.technologies)
        document_text = (
            f"Title: {project.title}\n"
            f"Description: {project.description}\n"
            f"Technologies: {tech_str}"
        )
        if project.metrics:
            document_text += f"\nMetrics: {project.metrics}"

        # Prep metadata dictionary for ChromaDB storage
        metadata = {
            "title": project.title,
            "description": project.description,
            "technologies": json.dumps(project.technologies),
            "metrics": project.metrics or "",
        }

        def _sync_upsert():
            self.collection.upsert(
                ids=[project_id],
                metadatas=[metadata],
                documents=[document_text],
            )

        await asyncio.to_thread(_sync_upsert)
        return project_id

    async def delete_project(self, project_id: str):
        """
        Deletes a project from the ChromaDB collection.
        """
        def _sync_delete():
            self.collection.delete(ids=[project_id])

        await asyncio.to_thread(_sync_delete)

    async def query_similar_projects(
        self, query_text: str, limit: int = 3
    ) -> List[MatchedProject]:
        """
        Queries ChromaDB for candidate projects semantically matching the query.
        """
        def _sync_query():
            return self.collection.query(
                query_texts=[query_text],
                n_results=limit,
                include=["metadatas", "documents", "distances"],
            )

        results = await asyncio.to_thread(_sync_query)

        # Map results to Pydantic responses
        matched_projects = []
        if not results or not results["ids"] or not results["ids"][0]:
            return matched_projects

        ids = results["ids"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        for i in range(len(ids)):
            meta = metadatas[i]
            if not meta:
                continue

            # Convert distance (cosine distance) to similarity score
            # cosine similarity = 1 - cosine distance
            similarity = 1.0 - distances[i]

            try:
                technologies = json.loads(meta.get("technologies", "[]"))
            except Exception:
                technologies = []

            matched_projects.append(
                MatchedProject(
                    id=ids[i],
                    title=meta.get("title", ""),
                    description=meta.get("description", ""),
                    technologies=technologies,
                    metrics=meta.get("metrics") or None,
                    similarity_score=max(0.0, min(1.0, similarity)),
                )
            )

        # Sort highest similarity first
        matched_projects.sort(key=lambda x: x.similarity_score, reverse=True)
        return matched_projects

    async def ingest_github_repo(self, github_url: str) -> dict:
        """
        Shallow clones a public GitHub repository, traverses and reads its code/text files,
        chunks them, and ingests them into a dedicated ChromaDB collection.
        """
        import hashlib
        import tempfile
        import shutil
        import subprocess
        from pathlib import Path

        # 1. Generate unique collection name from repo URL
        url_hash = hashlib.md5(github_url.lower().strip().encode()).hexdigest()
        collection_name = f"gh_{url_hash}_v2"

        # Get or create the collection
        def _get_or_create_col():
            return self.chroma_client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"},
                embedding_function=self._embedding_fn,
            )

        col = await asyncio.to_thread(_get_or_create_col)

        # If already ingested, return cached stats
        def _get_count():
            return col.count()

        count = await asyncio.to_thread(_get_count)
        if count > 0:
            return {
                "collection_name": collection_name,
                "chunks_ingested": count,
                "status": "cached"
            }

        # 2. Clone the repository shallowly
        temp_dir = tempfile.mkdtemp(prefix="placementos_gh_")
        def _clone():
            res = subprocess.run(
                ["git", "clone", "--depth", "1", github_url, temp_dir],
                capture_output=True,
                text=True,
                shell=True
            )
            if res.returncode != 0:
                raise Exception(f"Git clone failed: {res.stderr}")

        try:
            await asyncio.to_thread(_clone)
        except Exception as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise e

        # 3. Traverse and read files
        ALLOWED_EXTENSIONS = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', 
            '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs', '.sh', 
            '.yml', '.yaml', '.txt', '.ini', '.conf', 'Dockerfile'
        }

        IGNORED_DIRS = {
            '.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', 
            'env', '__pycache__', 'out', 'target', '.idea', '.vscode'
        }

        documents = []
        metadatas = []
        ids = []
        files_read = 0

        try:
            for root, dirs, files in os.walk(temp_dir):
                # Modify dirs in-place to skip ignored directories
                dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

                for file in files:
                    file_path = Path(root) / file
                    ext = file_path.suffix.lower()
                    if ext in ALLOWED_EXTENSIONS or file_path.name in ALLOWED_EXTENSIONS:
                        if file_path.stat().st_size > 500 * 1024: # Skip files > 500KB
                            continue
                        
                        try:
                            content = file_path.read_text(encoding='utf-8', errors='ignore')
                            relative_path = os.path.relpath(file_path, temp_dir)
                            
                            # Chunk
                            chunks = []
                            chunk_size = 1500
                            overlap = 150
                            start = 0
                            while start < len(content):
                                end = start + chunk_size
                                chunks.append(content[start:end])
                                start += chunk_size - overlap

                            for idx, chunk in enumerate(chunks):
                                doc_id = f"{url_hash}_{files_read}_{idx}"
                                documents.append(chunk)
                                metadatas.append({
                                    "source": relative_path,
                                    "chunk_idx": idx,
                                    "total_chunks": len(chunks)
                                })
                                ids.append(doc_id)

                            files_read += 1
                            if files_read >= 150: # Cap at 150 files
                                break
                        except Exception as fe:
                            logger.warning(f"Error reading file {file_path}: {fe}")
                            continue
                if files_read >= 150:
                    break

            # 4. Batch Ingest into ChromaDB
            if documents:
                batch_size = 500
                for i in range(0, len(documents), batch_size):
                    batch_docs = documents[i:i+batch_size]
                    batch_metas = metadatas[i:i+batch_size]
                    batch_ids = ids[i:i+batch_size]
                    
                    def _sync_batch_add(b_ids, b_metas, b_docs):
                        col.upsert(
                            ids=b_ids,
                            metadatas=b_metas,
                            documents=b_docs
                        )
                    await asyncio.to_thread(_sync_batch_add, batch_ids, batch_metas, batch_docs)

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

        return {
            "collection_name": collection_name,
            "chunks_ingested": len(documents),
            "files_processed": files_read,
            "status": "success"
        }

    async def query_github_repo(self, github_url: str, query_text: str, limit: int = 5) -> List[dict]:
        """
        Queries the repository-specific collection for relevant chunks.
        """
        import hashlib
        url_hash = hashlib.md5(github_url.lower().strip().encode()).hexdigest()
        collection_name = f"gh_{url_hash}_v2"

        def _sync_query():
            try:
                col = self.chroma_client.get_collection(
                    name=collection_name,
                    embedding_function=self._embedding_fn
                )
                return col.query(
                    query_texts=[query_text],
                    n_results=limit,
                    include=["metadatas", "documents", "distances"]
                )
            except Exception:
                return None

        results = await asyncio.to_thread(_sync_query)
        if not results or not results["ids"] or not results["ids"][0]:
            return []

        matched = []
        ids = results["ids"][0]
        metadatas = results["metadatas"][0]
        documents = results["documents"][0]
        distances = results["distances"][0]

        for idx in range(len(ids)):
            matched.append({
                "id": ids[idx],
                "content": documents[idx],
                "source": metadatas[idx].get("source", "unknown"),
                "similarity": 1.0 - distances[idx]
            })
        return matched


# ── Global singleton ──────────────────────────────────────────────────────────
vector_store = VectorStoreManager()
