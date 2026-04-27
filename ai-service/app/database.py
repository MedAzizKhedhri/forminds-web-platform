from datetime import datetime, timezone
from time import sleep
from typing import Dict, List, Optional, Any

import numpy as np
from pymongo import MongoClient
from pymongo.collection import Collection

from app.config import settings
from app.engine import encode_text
from app.models import (
    JobOpportunity, UserProfile, Mission, Interaction,
    EcosystemMetrics, EmbeddingData, CompatibilityScore
)

_client: Optional[MongoClient] = None


def _get_client(retries: int = 8, delay: float = 2.0) -> MongoClient:
    last_error: Optional[Exception] = None
    for _ in range(retries):
        try:
            client = MongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=10_000,
            )
            client.admin.command("ping")
            return client
        except Exception as exc:
            last_error = exc
            sleep(delay)
    if last_error is not None:
        raise last_error
    raise ConnectionError("Could not connect to MongoDB")


def _get_collection(collection_name: str) -> Collection:
    global _client
    if _client is None:
        _client = _get_client()
    return _client[settings.mongodb_db_name][collection_name]


def init_db() -> None:
    """Initialize database with indexes"""
    # Jobs collection
    jobs_coll = _get_collection("jobs")
    jobs_coll.create_index("id", unique=True)

    # Users collection
    users_coll = _get_collection("users")
    users_coll.create_index("id", unique=True)
    users_coll.create_index("skills")
    users_coll.create_index("location")

    # Missions collection
    missions_coll = _get_collection("missions")
    missions_coll.create_index("id", unique=True)
    missions_coll.create_index("creator_id")
    missions_coll.create_index("status")
    missions_coll.create_index("tags")

    # Interactions collection
    interactions_coll = _get_collection("interactions")
    interactions_coll.create_index("user_id")
    interactions_coll.create_index("target_id")
    interactions_coll.create_index("interaction_type")
    interactions_coll.create_index("timestamp")

    # Embeddings collection
    embeddings_coll = _get_collection("embeddings")
    embeddings_coll.create_index("user_id")
    embeddings_coll.create_index("embedding_type")
    embeddings_coll.create_index("created_at")

    # Compatibility cache
    compatibility_coll = _get_collection("compatibility_cache")
    compatibility_coll.create_index([("user1_id", 1), ("user2_id", 1)])
    compatibility_coll.create_index("timestamp")

    # Ecosystem metrics
    metrics_coll = _get_collection("ecosystem_metrics")
    metrics_coll.create_index("timestamp")

    print("AI Database is ready (MongoDB).")


# Legacy job functions (for backward compatibility)
def index_job(job: JobOpportunity) -> str:
    job_text = " ".join(filter(None, [job.title, job.description, job.summary or ""]))
    embedding = encode_text(job_text)
    now = datetime.now(timezone.utc)
    coll = _get_collection("jobs")
    coll.update_one(
        {"id": job.id},
        {
            "$set": {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "required_skills": job.required_skills,
                "description": job.description,
                "summary": job.summary,
                "embedding": embedding,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return job.id


def recommend_jobs(user: UserProfile, limit: int = 5) -> List[Dict[str, object]]:
    query_text = " ".join(filter(None, [user.bio, " ".join(user.skills)]))
    query_vec = np.asarray(encode_text(query_text), dtype=np.float32)

    coll = _get_collection("jobs")
    docs: List[dict] = list(
        coll.find(
            {},
            projection={
                "id": 1,
                "title": 1,
                "company": 1,
                "location": 1,
                "required_skills": 1,
                "description": 1,
                "summary": 1,
                "embedding": 1,
            },
        )
    )
    valid = [
        d
        for d in docs
        if d.get("embedding")
        and len(d["embedding"]) == query_vec.shape[0]
    ]
    if not valid:
        return []

    embeddings = np.asarray([d["embedding"] for d in valid], dtype=np.float32)
    sims = embeddings @ query_vec
    order = np.argsort(-sims)

    recommendations: List[Dict[str, object]] = []
    for idx in order[:limit]:
        i = int(idx)
        row = valid[i]
        similarity = float(max(0.0, min(1.0, sims[i])))
        distance = 1.0 - similarity
        recommendations.append(
            {
                "job_id": row["id"],
                "title": row["title"],
                "company": row.get("company"),
                "location": row["location"],
                "required_skills": row.get("required_skills") or [],
                "description": row["description"],
                "summary": row.get("summary"),
                "match_score": round(similarity * 100, 2),
                "distance": round(distance, 4),
            }
        )

    return recommendations


# Enhanced AI functions
def save_user_profile(user: UserProfile) -> str:
    """Save or update user profile"""
    now = datetime.now(timezone.utc)
    coll = _get_collection("users")
    coll.update_one(
        {"id": user.id},
        {
            "$set": {
                "id": user.id,
                "skills": user.skills,
                "bio": user.bio,
                "location": user.location,
                "target_roles": user.target_roles,
                "interests": user.interests,
                "goals": user.goals,
                "experience_level": user.experience_level,
                "availability": user.availability,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return user.id


def get_user_profile(user_id: str) -> Optional[UserProfile]:
    """Retrieve user profile"""
    coll = _get_collection("users")
    doc = coll.find_one({"id": user_id})
    if doc:
        return UserProfile(**doc)
    return None


def save_mission(mission: Mission) -> str:
    """Save a new mission"""
    coll = _get_collection("missions")
    mission_dict = mission.dict()
    coll.update_one(
        {"id": mission.id},
        {"$set": mission_dict},
        upsert=True,
    )
    return mission.id


def get_missions(status: Optional[str] = None, limit: int = 50) -> List[Mission]:
    """Get missions with optional status filter"""
    coll = _get_collection("missions")
    query = {}
    if status:
        query["status"] = status

    docs = coll.find(query).limit(limit)
    return [Mission(**doc) for doc in docs]


def save_interaction(interaction: Interaction) -> str:
    """Save user interaction"""
    coll = _get_collection("interactions")
    interaction_dict = interaction.dict()
    result = coll.insert_one(interaction_dict)
    return str(result.inserted_id)


def get_user_interactions(user_id: str, limit: int = 100) -> List[Interaction]:
    """Get interactions for a user"""
    coll = _get_collection("interactions")
    query = {"$or": [{"user_id": user_id}, {"target_id": user_id}]}
    docs = coll.find(query).sort("timestamp", -1).limit(limit)
    return [Interaction(**doc) for doc in docs]


def save_embedding(embedding_data: EmbeddingData) -> str:
    """Save user embedding"""
    coll = _get_collection("embeddings")
    embedding_dict = embedding_data.dict()
    result = coll.insert_one(embedding_dict)
    return str(result.inserted_id)


def get_user_embedding(user_id: str, embedding_type: str = "profile") -> Optional[List[float]]:
    """Get latest embedding for user"""
    coll = _get_collection("embeddings")
    doc = coll.find_one(
        {"user_id": user_id, "embedding_type": embedding_type},
        sort=[("created_at", -1)]
    )
    if doc:
        return doc["embedding"]
    return None


def save_compatibility_score(score: CompatibilityScore) -> str:
    """Cache compatibility score"""
    coll = _get_collection("compatibility_cache")
    score_dict = score.dict()
    coll.update_one(
        {"user1_id": score.user1_id, "user2_id": score.user2_id},
        {"$set": score_dict},
        upsert=True,
    )
    return f"{score.user1_id}_{score.user2_id}"


def get_compatibility_score(user1_id: str, user2_id: str) -> Optional[CompatibilityScore]:
    """Get cached compatibility score"""
    coll = _get_collection("compatibility_cache")
    # Try both orderings since compatibility is symmetric
    doc = coll.find_one({"$or": [
        {"user1_id": user1_id, "user2_id": user2_id},
        {"user1_id": user2_id, "user2_id": user1_id}
    ]})
    if doc:
        return CompatibilityScore(**doc)
    return None


def save_ecosystem_metrics(metrics: EcosystemMetrics) -> str:
    """Save ecosystem health metrics"""
    coll = _get_collection("ecosystem_metrics")
    metrics_dict = metrics.dict()
    result = coll.insert_one(metrics_dict)
    return str(result.inserted_id)


def get_latest_ecosystem_metrics() -> Optional[EcosystemMetrics]:
    """Get most recent ecosystem metrics"""
    coll = _get_collection("ecosystem_metrics")
    doc = coll.find_one(sort=[("timestamp", -1)])
    if doc:
        return EcosystemMetrics(**doc)
    return None


def get_all_users(limit: int = 1000) -> List[UserProfile]:
    """Get all user profiles"""
    coll = _get_collection("users")
    docs = coll.find().limit(limit)
    return [UserProfile(**doc) for doc in docs]


def get_all_interactions(limit: int = 10000) -> List[Interaction]:
    """Get all interactions for graph building"""
    coll = _get_collection("interactions")
    docs = coll.find().limit(limit)
    return [Interaction(**doc) for doc in docs]
