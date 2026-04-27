from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="ForMinds AI Matching Service")
    description: str = Field(
        default="Microservice de matching intelligent entre étudiants et opportunités"
    )
    version: str = Field(default="1.0.0")
    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8000)
    transformers_cache: Path = Field(default_factory=lambda: Path("models_cache"))
    model_name: str = Field(default="paraphrase-multilingual-MiniLM-L12-v2")

    # Database settings
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = Field(default="forminds_db")
    mongodb_collection: str = Field(default="jobs")

    # Legacy weights (for backward compatibility)
    semantic_weight: float = Field(default=0.7)
    skill_weight: float = Field(default=0.25)
    location_weight: float = Field(default=0.05)
    location_bonus: float = Field(default=10.0)

    # Enhanced AI weights
    profile_semantic_weight: float = Field(default=0.4)
    skill_complementarity_weight: float = Field(default=0.25)
    interest_overlap_weight: float = Field(default=0.15)
    behavioral_compatibility_weight: float = Field(default=0.1)
    graph_proximity_weight: float = Field(default=0.1)

    # Graph analytics settings
    min_interaction_weight: float = Field(default=0.1)
    max_path_length: int = Field(default=3)
    centrality_threshold: float = Field(default=0.7)

    # Embedding settings
    embedding_dimension: int = Field(default=384)
    temporal_decay_factor: float = Field(default=0.95)
    profile_update_threshold: float = Field(default=0.1)

    # Ecosystem health settings
    health_check_interval: int = Field(default=3600)  # seconds
    balance_threshold: float = Field(default=0.8)
    vitality_threshold: float = Field(default=0.6)

    # Mission matching settings
    mission_skill_match_threshold: float = Field(default=0.7)
    max_mission_recommendations: int = Field(default=10)
    participant_selection_limit: int = Field(default=5)


settings = Settings()
