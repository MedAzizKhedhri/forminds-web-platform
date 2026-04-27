# App Analysis

**Prepared by:** Ahmed Hamdi

**Project:** FastAPI AI Matching Microservice

**Date:** April 15, 2026

---

## Overview

This application is a FastAPI-based AI matching microservice designed to connect student profiles, jobs, missions, and interactions with intelligent recommendations.

## Main Capabilities

- Uses MongoDB to store user profiles, jobs, missions, interactions, embeddings, compatibility scores, and ecosystem metrics.
- Provides legacy job recommendation endpoints that index jobs and recommend jobs based on text embeddings and cosine similarity.
- Stores user profiles and generates profile embeddings asynchronously.
- Records user interactions and uses graph analytics to analyze social and network relationships.
- Computes ecosystem health metrics from the user/interaction network.
- Performs hybrid user-to-user matchmaking using semantic similarity, skill complementarity, interest overlap, behavioral compatibility, and graph proximity.
- Exposes REST API endpoints for creating and updating profiles, retrieving profiles, saving missions, listing missions, recording interactions, recommending users, checking health, and analyzing the network.

## Technical Stack

- FastAPI for the API
- MongoDB via `pymongo` for persistence
- Sentence-Transformers for text embeddings
- NumPy, scikit-learn, and NetworkX for calculations and graph analytics
- Docker support via `Dockerfile` and `docker-compose.yml`

## Important Files

- `app/main.py`: API endpoints and startup logic.
- `app/database.py`: MongoDB connection, data storage, retrieval, and legacy job recommendation.
- `app/engine.py`: Enhanced hybrid AI matching, profile embeddings, graph analytics, and ecosystem metrics.
- `app/ai_engine.py`: Legacy job-user matching engine and utility encoding logic.
- `app/models.py`: Pydantic data models for users, jobs, missions, interactions, recommendations, embeddings, and scores.
- `app/config.py`: Application settings and environment configuration.

## Question 2: How the Two Main Engines Work

There are two primary matching engines in this project:

### 1) Legacy Job Matching Engine (`app/ai_engine.py`)

- **Purpose:** Match a user profile to a job opportunity.
- **Text encoding:** Uses Sentence-Transformers to encode the user bio and job description into normalized vectors.
- **Scores computed:**
  - `semantic_score`: cosine similarity between bio and job description.
  - `skill_score`: ratio of overlapping skills between user and job.
  - `location_score`: 1.0 if user location and job location are identical, otherwise 0.0.
- **Final score:** Weighted sum of semantic, skill, and location scores with weights 0.7, 0.25, and 0.05 respectively.
- **Output:** Final percentage score, component scores, matched skills, and a natural-language reason.
- **Used by:** Endpoints such as `POST /index-job` and `POST /recommend`.

### 2) Enhanced Hybrid AI Engine (`app/engine.py`)

- **Purpose:** Compute richer compatibility and recommendations between users and support ecosystem analytics.
- **Components:**
  - `ProfileEmbeddingEngine`: Creates a user profile embedding by combining bio, skills, interests, goals, experience level, and availability; encodes with SentenceTransformer; adds numeric temporal features; reduces dimensionality with PCA; normalizes the result.
  - `GraphAnalyticsEngine`: Builds a weighted graph from interactions; computes centrality, shortest paths, proximity score, common neighbors, and clustering.
  - `EcosystemHealthMonitor`: Calculates ecosystem metrics such as total users, total connections, average degree, clustering coefficient, network density, contribution balance, vitality score, and fairness index.
  - `HybridRecommendationEngine`: Computes compatibility between two user profiles using:
    - semantic similarity of profile embeddings,
    - skill complementarity,
    - interest overlap,
    - behavioral compatibility based on experience and availability,
    - graph proximity based on interaction network.
- **Compatibility score:** Weighted combination with default weights 0.4 semantic, 0.25 skills, 0.15 interests, 0.1 behavioral, 0.1 graph.
- **Notes:** Also generates explanations and can recommend mission participants, though mission matching is only partially implemented.

## Summary

- The legacy engine is a straightforward job matching pipeline using text and skills.
- The enhanced engine is a more advanced hybrid AI system that combines embeddings, graph analytics, and multiple compatibility factors for user-to-user recommendations and ecosystem metrics.
