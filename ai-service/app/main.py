from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List, Optional
import asyncio

from app.config import settings
from app.engine import calculate_hybrid_match, calculate_student_match, calculate_student_score
from app.models import (
    JobOpportunity, UserProfile, Mission, Interaction,
    RecommendationResult, EcosystemMetrics,
    MatchRequest, ScoreRequest
)
from app.ai_engine import ai_engine
from app.database import (
    # Legacy functions
    index_job, recommend_jobs,
    # New AI functions
    save_user_profile, get_user_profile, save_mission, get_missions,
    save_interaction, get_user_interactions, save_embedding,
    get_user_embedding, save_compatibility_score, get_compatibility_score,
    save_ecosystem_metrics, get_latest_ecosystem_metrics,
    get_all_users, get_all_interactions
)


app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db_client():
    from app.database import init_db

    # Run in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, init_db)
    print("AI Database is ready (MongoDB).")


# Legacy endpoints (for backward compatibility)
@app.post("/index-job")
def index_job_route(job: JobOpportunity):
    created_job_id = index_job(job)
    return {"status": "created", "job_id": created_job_id}


@app.post("/recommend")
def recommend_route(
    user: UserProfile,
    limit: int = Query(5, ge=1, le=100, description="Nombre max. de recommandations"),
):
    recommendations = recommend_jobs(user, limit=limit)
    return {"recommendations": recommendations}


# Enhanced AI endpoints
@app.post("/api/users/profile")
def create_user_profile(user: UserProfile, background_tasks: BackgroundTasks):
    """Create or update user profile and generate embedding"""
    user_id = save_user_profile(user)

    # Generate embedding in background
    background_tasks.add_task(generate_user_embedding_async, user)

    return {"status": "created", "user_id": user_id}


@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    """Get user profile"""
    user = get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/api/missions")
def create_mission(mission: Mission):
    """Create a new mission"""
    mission_id = save_mission(mission)
    return {"status": "created", "mission_id": mission_id}


@app.get("/api/missions")
def list_missions(status: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    """Get missions with optional status filter"""
    missions = get_missions(status=status, limit=limit)
    return {"missions": missions}


@app.post("/api/interactions")
def create_interaction(interaction: Interaction):
    """Record user interaction"""
    interaction_id = save_interaction(interaction)
    return {"status": "recorded", "interaction_id": interaction_id}


@app.post("/api/matchmaking/recommend")
def recommend_users(
    user_id: str,
    limit: int = Query(10, ge=1, le=50, description="Nombre max. de recommandations")
):
    """Get personalized user recommendations using hybrid AI"""
    # Get user profile
    user = get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all other users
    all_users = get_all_users()
    candidates = [u for u in all_users if u.id != user_id]

    if not candidates:
        return {"recommendations": []}

    # Get interaction history for graph analysis
    interactions = get_all_interactions()

    recommendations = []
    for candidate in candidates[:limit * 2]:  # Get more candidates for better selection
        # Check cache first
        cached_score = get_compatibility_score(user_id, candidate.id)
        if cached_score:
            compatibility = cached_score
        else:
            # Calculate compatibility
            compatibility = ai_engine.calculate_compatibility(user, candidate, interactions)
            # Cache the result
            save_compatibility_score(compatibility)

        if compatibility.overall_score > 0.3:  # Minimum threshold
            recommendations.append(RecommendationResult(
                user_id=user_id,
                target_id=candidate.id,
                score=compatibility.overall_score,
                semantic_score=compatibility.semantic_similarity,
                graph_score=compatibility.graph_proximity,
                behavioral_score=compatibility.behavioral_compatibility,
                explanation=compatibility.explanation,
                matched_skills=[],  # Could be enhanced
                common_interests=list(set(user.interests or []).intersection(set(candidate.interests or []))),
                compatibility_factors=compatibility.factors
            ))

    # Sort by score and limit
    recommendations.sort(key=lambda x: x.score, reverse=True)
    return {"recommendations": recommendations[:limit]}


@app.post("/api/missions/{mission_id}/match")
def match_mission_participants(
    mission_id: str,
    limit: int = Query(5, ge=1, le=20, description="Nombre max. de participants")
):
    """Find suitable participants for a mission"""
    # This would need to be implemented with proper mission retrieval
    # For now, return a placeholder
    return {"message": "Mission participant matching - to be implemented", "mission_id": mission_id}


@app.get("/api/ecosystem/health")
def get_ecosystem_health():
    """Get current ecosystem health metrics"""
    metrics = get_latest_ecosystem_metrics()
    if not metrics:
        # Calculate current metrics
        users = get_all_users()
        interactions = get_all_interactions()
        metrics = ai_engine.health_monitor.calculate_ecosystem_metrics(users, interactions)
        save_ecosystem_metrics(metrics)

    return metrics


@app.post("/api/ecosystem/health/refresh")
def refresh_ecosystem_health(background_tasks: BackgroundTasks):
    """Refresh ecosystem health metrics"""
    background_tasks.add_task(update_ecosystem_health_async)
    return {"status": "refreshing", "message": "Ecosystem health update started"}


@app.get("/api/analytics/network")
def get_network_analytics():
    """Get network analytics and visualization data"""
    interactions = get_all_interactions(limit=5000)  # Limit for performance

    # Build graph for analytics
    ai_engine.graph_engine.build_graph(interactions)

    # Calculate centrality metrics
    centrality = ai_engine.graph_engine.calculate_centrality_metrics()

    return {
        "node_count": len(ai_engine.graph_engine.graph),
        "edge_count": ai_engine.graph_engine.graph.number_of_edges(),
        "centrality_metrics": centrality,
        "clustering_coefficient": ai_engine.graph_engine.calculate_clustering_coefficient()
    }


# --- Node.js Backend Integration Endpoints ---

@app.post("/api/match")
def match_opportunities(request: MatchRequest):
    """Calculate match scores for multiple opportunities for a given student."""
    matches = []
    for opp in request.opportunities:
        match_result = calculate_student_match(request.student, opp)
        matches.append(match_result)
    
    # Sort matches by highest score
    matches.sort(key=lambda x: x.score, reverse=True)
    return {"matches": matches}


@app.post("/api/match/score")
def score_opportunity(request: ScoreRequest):
    """Calculate a detailed match score for a single opportunity."""
    result = calculate_student_score(request.student, request.opportunity)
    return result


# Background tasks
def generate_user_embedding_async(user: UserProfile):
    """Generate and save user embedding asynchronously"""
    try:
        from app.models import EmbeddingData
        embedding = ai_engine.embedding_engine.generate_profile_embedding(user)
        embedding_data = EmbeddingData(
            user_id=user.id,
            embedding=embedding,
            embedding_type="profile"
        )
        save_embedding(embedding_data)
    except Exception as e:
        print(f"Error generating embedding for user {user.id}: {e}")


def update_ecosystem_health_async():
    """Update ecosystem health metrics asynchronously"""
    try:
        users = get_all_users()
        interactions = get_all_interactions()
        metrics = ai_engine.health_monitor.calculate_ecosystem_metrics(users, interactions)
        save_ecosystem_metrics(metrics)
    except Exception as e:
        print(f"Error updating ecosystem health: {e}")


# Health check endpoint
@app.get("/health")
def health_check():
    """API health check"""
    return {"status": "healthy", "version": settings.version}


# Root endpoint with API documentation
@app.get("/", response_class=HTMLResponse)
def root():
    """API documentation page"""
    return """
    <html>
        <head>
            <title>ForMinds AI Matching API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; }
                .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .method { font-weight: bold; color: #27ae60; }
            </style>
        </head>
        <body>
            <h1>🚀 ForMinds AI Matching Platform</h1>
            <p>Advanced AI-powered matchmaking for professional ecosystems</p>

            <h2>🔗 Legacy Endpoints</h2>
            <div class="endpoint">
                <span class="method">POST</span> /index-job - Index job opportunities
            </div>
            <div class="endpoint">
                <span class="method">POST</span> /recommend - Get job recommendations
            </div>

            <h2>🤖 Enhanced AI Endpoints</h2>
            <div class="endpoint">
                <span class="method">POST</span> /api/users/profile - Create/update user profile
            </div>
            <div class="endpoint">
                <span class="method">GET</span> /api/users/{user_id} - Get user profile
            </div>
            <div class="endpoint">
                <span class="method">POST</span> /api/matchmaking/recommend - Get user recommendations
            </div>
            <div class="endpoint">
                <span class="method">GET</span> /api/ecosystem/health - Get ecosystem health
            </div>
            <div class="endpoint">
                <span class="method">GET</span> /api/analytics/network - Get network analytics
            </div>

            <h2>📊 API Documentation</h2>
            <p>Visit <a href="/docs">/docs</a> for interactive API documentation</p>
        </body>
    </html>
    """
