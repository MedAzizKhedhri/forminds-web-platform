from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class UserProfile(BaseModel):
    id: str = Field(..., example="std_01")
    skills: List[str] = Field(..., example=["Python", "SQL", "Machine Learning"])
    bio: str = Field(
        ...,
        example="Je suis un étudiant passionné par l'analyse de données et l'intelligence artificielle."
    )
    location: str = Field(..., example="Tunis")
    target_roles: Optional[List[str]] = Field(
        None,
        example=["Data Scientist", "Ingénieur IA"],
        description="Rôles professionnels recherchés par l'étudiant"
    )
    interests: Optional[List[str]] = Field(
        None,
        example=["AI Ethics", "Data Visualization", "Open Source"],
        description="Centres d'intérêt personnels et professionnels"
    )
    goals: Optional[List[str]] = Field(
        None,
        example=["Apprendre le Deep Learning", "Contribuer à des projets open source"],
        description="Objectifs professionnels et personnels"
    )
    experience_level: Optional[str] = Field(
        None,
        example="intermediate",
        description="Niveau d'expérience (beginner, intermediate, advanced)"
    )
    availability: Optional[str] = Field(
        None,
        example="full_time",
        description="Disponibilité (full_time, part_time, freelance)"
    )


class JobOpportunity(BaseModel):
    id: str = Field(..., example="job_A")
    title: str = Field(..., example="Stagiaire Data Scientist")
    required_skills: List[str] = Field(..., example=["Python", "Pandas", "Scikit-Learn"])
    description: str = Field(
        ...,
        example="Nous recherchons un talent pour nous aider à construire des modèles prédictifs et analyser nos bases de données clients."
    )
    location: str = Field(..., example="Tunis")
    company: Optional[str] = Field(None, example="ForMinds")
    summary: Optional[str] = Field(None, example="Stage de Data Science pour diplômés.")
    project_type: Optional[str] = Field(
        None,
        example="data_science",
        description="Type de projet (data_science, web_dev, mobile_dev, etc.)"
    )
    duration: Optional[str] = Field(
        None,
        example="3_months",
        description="Durée estimée du projet"
    )


class Mission(BaseModel):
    id: str = Field(..., example="mission_001")
    title: str = Field(..., example="Développer un modèle de recommandation")
    description: str = Field(..., example="Créer un système de recommandation basé sur le machine learning")
    required_skills: List[str] = Field(..., example=["Python", "Scikit-learn", "Pandas"])
    difficulty: str = Field(..., example="intermediate")
    estimated_duration: str = Field(..., example="2_weeks")
    max_participants: int = Field(default=3, example=3)
    creator_id: str = Field(..., example="user_123")
    status: str = Field(default="open", example="open")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = Field(default_factory=list, example=["machine_learning", "python"])


class Interaction(BaseModel):
    id: str = Field(..., example="interaction_001")
    user_id: str = Field(..., example="user_123")
    target_id: str = Field(..., example="user_456")
    interaction_type: str = Field(..., example="collaboration")
    weight: float = Field(default=1.0, example=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context about the interaction")


class RecommendationResult(BaseModel):
    user_id: str
    target_id: str
    score: float
    semantic_score: float
    graph_score: float
    behavioral_score: float
    explanation: str
    matched_skills: List[str]
    common_interests: List[str]
    compatibility_factors: Dict[str, float]


class EcosystemMetrics(BaseModel):
    total_users: int
    total_connections: int
    average_degree: float
    clustering_coefficient: float
    contribution_balance: float
    network_density: float
    vitality_score: float
    fairness_index: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class EmbeddingData(BaseModel):
    user_id: str
    embedding: List[float]
    embedding_type: str = Field(..., example="profile")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(None)


class CompatibilityScore(BaseModel):
    user1_id: str
    user2_id: str
    overall_score: float
    semantic_similarity: float
    skill_complementarity: float
    interest_overlap: float
    behavioral_compatibility: float
    graph_proximity: float
    explanation: str
    factors: Dict[str, float]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Node.js Backend Integration Models ---

class EducationData(BaseModel):
    institution: str
    degree: str
    field: str

class ExperienceData(BaseModel):
    title: str
    company: str
    description: Optional[str] = None

class StudentData(BaseModel):
    skills: List[str]
    location: Optional[str] = None
    education: List[EducationData] = []
    experiences: List[ExperienceData] = []

class OpportunityData(BaseModel):
    id: str
    title: str
    skills: List[str]
    location: str
    domain: str
    type: str
    requirements: Optional[str] = None

class MatchBreakdown(BaseModel):
    skillsScore: int
    locationScore: int
    domainScore: int
    experienceScore: Optional[int] = None

class MatchResult(BaseModel):
    opportunityId: str
    score: int
    breakdown: MatchBreakdown
    explanation: str

class DetailedMatchResult(BaseModel):
    overallScore: int
    breakdown: MatchBreakdown
    matchedSkills: List[str]
    missingSkills: List[str]
    explanation: str

class MatchRequest(BaseModel):
    student: StudentData
    opportunities: List[OpportunityData]

class ScoreRequest(BaseModel):
    student: StudentData
    opportunity: OpportunityData
