"""
Enhanced AI Engine for ForMinds Platform
Implements advanced matching algorithms including graph analytics,
dynamic embeddings, and ecosystem health monitoring.
"""

import numpy as np
import networkx as nx
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from collections import defaultdict
import math

from sentence_transformers import SentenceTransformer, util
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from app.config import settings
from app.models import (
    UserProfile, Mission, Interaction, RecommendationResult,
    EcosystemMetrics, EmbeddingData, CompatibilityScore
)


class ProfileEmbeddingEngine:
    """Handles dynamic profile embeddings and evolution"""

    def __init__(self):
        self.model = None
        self.pca = PCA(n_components=min(50, settings.embedding_dimension))
        self.scaler = StandardScaler()

    def _get_model(self) -> SentenceTransformer:
        if self.model is None:
            cache_folder = settings.transformers_cache
            cache_folder.mkdir(parents=True, exist_ok=True)
            self.model = SentenceTransformer(
                settings.model_name,
                cache_folder=str(cache_folder),
            )
        return self.model

    def generate_profile_embedding(self, profile: UserProfile) -> List[float]:
        """Generate multi-dimensional embedding for user profile"""
        model = self._get_model()

        # Combine different profile aspects
        text_components = [
            profile.bio or "",
            " ".join(profile.skills) if profile.skills else "",
            " ".join(profile.interests or []),
            " ".join(profile.goals or []),
            profile.experience_level or "",
            profile.availability or "",
        ]

        combined_text = " ".join(filter(None, text_components))

        # Generate base embedding
        base_embedding = model.encode(combined_text or " ", convert_to_numpy=True)

        # Add temporal features (experience level, availability as numerical features)
        experience_map = {"beginner": 0.2, "intermediate": 0.5, "advanced": 0.8}
        availability_map = {"part_time": 0.3, "freelance": 0.6, "full_time": 1.0}

        temporal_features = np.array([
            experience_map.get(profile.experience_level, 0.5),
            availability_map.get(profile.availability, 0.5),
            len(profile.skills) / 20.0,  # Normalize skill count
            len(profile.interests or []) / 10.0,  # Normalize interest count
        ]).reshape(1, -1)

        # Combine semantic and temporal features
        combined_embedding = np.concatenate([base_embedding.flatten(), temporal_features.flatten()])

        # Apply dimensionality reduction
        reduced_embedding = self.pca.fit_transform(combined_embedding.reshape(1, -1))

        # Normalize
        normalized = util.normalize_embeddings(reduced_embedding)[0]

        return normalized.tolist()

    def update_embedding_temporal(self, current_embedding: List[float],
                                interaction_history: List[Interaction],
                                decay_factor: float = None) -> List[float]:
        """Update embedding based on temporal interaction patterns"""
        if decay_factor is None:
            decay_factor = settings.temporal_decay_factor

        # Calculate recency-weighted interaction patterns
        now = datetime.utcnow()
        recent_interactions = [
            interaction for interaction in interaction_history
            if (now - interaction.timestamp).days < 30
        ]

        if not recent_interactions:
            return current_embedding

        # Create interaction vector
        interaction_vector = np.zeros(settings.embedding_dimension)
        for interaction in recent_interactions:
            # Weight by recency and interaction strength
            days_old = (now - interaction.timestamp).days
            weight = math.exp(-days_old / 30.0) * interaction.weight
            # Add some noise based on interaction type
            interaction_hash = hash(interaction.interaction_type) % settings.embedding_dimension
            interaction_vector[interaction_hash] += weight

        # Combine with current embedding
        current_array = np.array(current_embedding)
        updated_embedding = current_array * decay_factor + interaction_vector * (1 - decay_factor)

        # Renormalize
        normalized = util.normalize_embeddings(updated_embedding.reshape(1, -1))[0]

        return normalized.tolist()


class GraphAnalyticsEngine:
    """Handles network analysis and graph-based recommendations"""

    def __init__(self):
        self.graph = nx.Graph()

    def build_graph(self, interactions: List[Interaction]) -> nx.Graph:
        """Build network graph from interaction data"""
        self.graph.clear()

        # Add nodes (users)
        user_nodes = set()
        for interaction in interactions:
            user_nodes.add(interaction.user_id)
            user_nodes.add(interaction.target_id)

        self.graph.add_nodes_from(user_nodes)

        # Add edges with weights
        edge_weights = defaultdict(float)
        for interaction in interactions:
            key = (interaction.user_id, interaction.target_id)
            edge_weights[key] += interaction.weight

        for (user1, user2), weight in edge_weights.items():
            if weight >= settings.min_interaction_weight:
                self.graph.add_edge(user1, user2, weight=weight)

        return self.graph

    def calculate_centrality_metrics(self) -> Dict[str, float]:
        """Calculate various centrality measures for the network"""
        if len(self.graph) == 0:
            return {}

        # Degree centrality
        degree_centrality = nx.degree_centrality(self.graph)

        # Betweenness centrality
        betweenness_centrality = nx.betweenness_centrality(self.graph, weight='weight')

        # Eigenvector centrality
        try:
            eigenvector_centrality = nx.eigenvector_centrality(self.graph, weight='weight', max_iter=1000)
        except:
            eigenvector_centrality = {}

        return {
            'degree': degree_centrality,
            'betweenness': betweenness_centrality,
            'eigenvector': eigenvector_centrality
        }

    def find_shortest_paths(self, source: str, target: str, max_length: int = None) -> List[List[str]]:
        """Find shortest paths between users in the network"""
        if max_length is None:
            max_length = settings.max_path_length

        try:
            paths = list(nx.all_shortest_paths(self.graph, source, target, weight='weight'))
            return [path for path in paths if len(path) <= max_length + 1]  # +1 for nodes
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def calculate_proximity_score(self, user1: str, user2: str) -> float:
        """Calculate graph proximity score between two users"""
        if user1 == user2:
            return 1.0

        try:
            # Shortest path distance
            distance = nx.shortest_path_length(self.graph, user1, user2, weight='weight')
            # Convert distance to proximity score (closer = higher score)
            proximity = 1.0 / (1.0 + distance)
            return proximity
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return 0.0

    def find_common_neighbors(self, user1: str, user2: str) -> List[str]:
        """Find users connected to both input users"""
        if user1 not in self.graph or user2 not in self.graph:
            return []

        neighbors1 = set(self.graph.neighbors(user1))
        neighbors2 = set(self.graph.neighbors(user2))

        return list(neighbors1.intersection(neighbors2))

    def calculate_clustering_coefficient(self) -> float:
        """Calculate overall network clustering coefficient"""
        if len(self.graph) < 3:
            return 0.0

        return nx.average_clustering(self.graph, weight='weight')


class EcosystemHealthMonitor:
    """Monitors ecosystem health and balance metrics"""

    def __init__(self, graph_engine: GraphAnalyticsEngine):
        self.graph_engine = graph_engine

    def calculate_ecosystem_metrics(self, users: List[UserProfile],
                                  interactions: List[Interaction]) -> EcosystemMetrics:
        """Calculate comprehensive ecosystem health metrics"""

        graph = self.graph_engine.build_graph(interactions)

        # Basic network metrics
        total_users = len(users)
        total_connections = graph.number_of_edges()
        average_degree = sum(dict(graph.degree()).values()) / max(len(graph), 1)

        # Advanced network metrics
        clustering_coefficient = self.graph_engine.calculate_clustering_coefficient()
        density = nx.density(graph) if len(graph) > 1 else 0.0

        # Contribution balance (simplified - would need actual contribution data)
        contribution_balance = self._calculate_contribution_balance(users, interactions)

        # Network vitality (activity and connectivity)
        vitality_score = self._calculate_vitality_score(graph, interactions)

        # Fairness index (distribution of connections)
        fairness_index = self._calculate_fairness_index(graph)

        return EcosystemMetrics(
            total_users=total_users,
            total_connections=total_connections,
            average_degree=average_degree,
            clustering_coefficient=clustering_coefficient,
            contribution_balance=contribution_balance,
            network_density=density,
            vitality_score=vitality_score,
            fairness_index=fairness_index
        )

    def _calculate_contribution_balance(self, users: List[UserProfile],
                                      interactions: List[Interaction]) -> float:
        """Calculate balance between contributions and benefits"""
        # Simplified implementation - in real system would track actual contributions
        user_contributions = defaultdict(float)
        user_benefits = defaultdict(float)

        for interaction in interactions:
            user_contributions[interaction.user_id] += interaction.weight
            user_benefits[interaction.target_id] += interaction.weight

        if not user_contributions:
            return 0.5  # Neutral balance

        balances = []
        for user_id in set(user_contributions.keys()).union(user_benefits.keys()):
            contribution = user_contributions[user_id]
            benefit = user_benefits[user_id]
            total = contribution + benefit
            if total > 0:
                balance = min(contribution, benefit) / total
                balances.append(balance)

        return np.mean(balances) if balances else 0.5

    def _calculate_vitality_score(self, graph: nx.Graph, interactions: List[Interaction]) -> float:
        """Calculate network vitality based on activity and connectivity"""
        if len(graph) == 0:
            return 0.0

        # Activity score (recent interactions)
        now = datetime.utcnow()
        recent_interactions = [
            i for i in interactions
            if (now - i.timestamp).days < 7
        ]
        activity_score = min(len(recent_interactions) / max(len(graph) * 2, 1), 1.0)

        # Connectivity score
        connectivity_score = nx.average_node_connectivity(graph) / max(len(graph), 1)

        return (activity_score + connectivity_score) / 2.0

    def _calculate_fairness_index(self, graph: nx.Graph) -> float:
        """Calculate fairness in connection distribution"""
        if len(graph) == 0:
            return 1.0

        degrees = list(dict(graph.degree()).values())
        if not degrees:
            return 1.0

        # Gini coefficient for degree distribution
        degrees.sort()
        n = len(degrees)
        cumsum = np.cumsum(degrees)
        return (n + 1 - 2 * np.sum(cumsum) / cumsum[-1]) / n


class HybridRecommendationEngine:
    """Main engine combining all recommendation approaches"""

    def __init__(self):
        self.embedding_engine = ProfileEmbeddingEngine()
        self.graph_engine = GraphAnalyticsEngine()
        self.health_monitor = EcosystemHealthMonitor(self.graph_engine)

    def calculate_compatibility(self, user1: UserProfile, user2: UserProfile,
                              interactions: List[Interaction] = None) -> CompatibilityScore:
        """Calculate comprehensive compatibility score between two users"""

        # Generate embeddings
        emb1 = self.embedding_engine.generate_profile_embedding(user1)
        emb2 = self.embedding_engine.generate_profile_embedding(user2)

        # Semantic similarity
        semantic_similarity = cosine_similarity([emb1], [emb2])[0][0]

        # Skill complementarity
        skill_complementarity = self._calculate_skill_complementarity(user1, user2)

        # Interest overlap
        interest_overlap = self._calculate_interest_overlap(user1, user2)

        # Behavioral compatibility
        behavioral_compatibility = self._calculate_behavioral_compatibility(user1, user2)

        # Graph proximity
        graph_proximity = 0.0
        if interactions:
            self.graph_engine.build_graph(interactions)
            graph_proximity = self.graph_engine.calculate_proximity_score(user1.id, user2.id)

        # Weighted combination
        overall_score = (
            semantic_similarity * settings.profile_semantic_weight +
            skill_complementarity * settings.skill_complementarity_weight +
            interest_overlap * settings.interest_overlap_weight +
            behavioral_compatibility * settings.behavioral_compatibility_weight +
            graph_proximity * settings.graph_proximity_weight
        )

        # Generate explanation
        explanation = self._generate_explanation(
            semantic_similarity, skill_complementarity, interest_overlap,
            behavioral_compatibility, graph_proximity
        )

        factors = {
            "semantic_similarity": semantic_similarity,
            "skill_complementarity": skill_complementarity,
            "interest_overlap": interest_overlap,
            "behavioral_compatibility": behavioral_compatibility,
            "graph_proximity": graph_proximity
        }

        return CompatibilityScore(
            user1_id=user1.id,
            user2_id=user2.id,
            overall_score=overall_score,
            semantic_similarity=semantic_similarity,
            skill_complementarity=skill_complementarity,
            interest_overlap=interest_overlap,
            behavioral_compatibility=behavioral_compatibility,
            graph_proximity=graph_proximity,
            explanation=explanation,
            factors=factors
        )

    def _calculate_skill_complementarity(self, user1: UserProfile, user2: UserProfile) -> float:
        """Calculate how well skills complement each other"""
        skills1 = set((user1.skills or []) + (user1.target_roles or []))
        skills2 = set((user2.skills or []) + (user2.target_roles or []))

        intersection = len(skills1.intersection(skills2))
        union = len(skills1.union(skills2))

        if union == 0:
            return 0.0

        # Complementarity is higher when there's some overlap but not complete overlap
        overlap_ratio = intersection / union
        complementarity = 1.0 - abs(overlap_ratio - 0.5) * 2  # Peak at 50% overlap

        return complementarity

    def _calculate_interest_overlap(self, user1: UserProfile, user2: UserProfile) -> float:
        """Calculate interest overlap between users"""
        interests1 = set(user1.interests or [])
        interests2 = set(user2.interests or [])

        if not interests1 and not interests2:
            return 0.5  # Neutral when no interests specified

        intersection = len(interests1.intersection(interests2))
        union = len(interests1.union(interests2))

        return intersection / union if union > 0 else 0.0

    def _calculate_behavioral_compatibility(self, user1: UserProfile, user2: UserProfile) -> float:
        """Calculate behavioral compatibility based on experience and availability"""
        compatibility = 0.0
        factors = 0

        # Experience level compatibility
        if user1.experience_level and user2.experience_level:
            exp_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
            exp1 = exp_levels.get(user1.experience_level, 2)
            exp2 = exp_levels.get(user2.experience_level, 2)
            exp_diff = abs(exp1 - exp2)
            compatibility += max(0, 1.0 - exp_diff * 0.3)
            factors += 1

        # Availability compatibility
        if user1.availability and user2.availability:
            avail_match = 1.0 if user1.availability == user2.availability else 0.5
            compatibility += avail_match
            factors += 1

        return compatibility / factors if factors > 0 else 0.5

    def _generate_explanation(self, semantic: float, skill_comp: float, interest: float,
                            behavioral: float, graph: float) -> str:
        """Generate human-readable explanation for compatibility score"""
        explanations = []

        if semantic > 0.8:
            explanations.append("vous partagez des profils très similaires")
        elif semantic > 0.6:
            explanations.append("vos profils sont compatibles")

        if skill_comp > 0.7:
            explanations.append("vos compétences se complètent bien")
        elif skill_comp < 0.3:
            explanations.append("vous avez des compétences très différentes")

        if interest > 0.6:
            explanations.append("vous partagez des centres d'intérêt")
        elif interest < 0.2:
            explanations.append("vous avez des intérêts différents")

        if behavioral > 0.7:
            explanations.append("vos rythmes de travail sont compatibles")

        if graph > 0.5:
            explanations.append("vous êtes connectés via le réseau")

        if not explanations:
            explanations.append("il y a un potentiel de collaboration à explorer")

        return f"Parce que {', '.join(explanations)}."

    def recommend_mission_participants(self, mission: Mission, candidates: List[UserProfile],
                                    interactions: List[Interaction] = None) -> List[RecommendationResult]:
        """Recommend participants for a micro-mission"""

        recommendations = []

        for candidate in candidates:
            # Calculate mission-profile compatibility
            skill_match = self._calculate_mission_skill_match(mission, candidate)
            profile_match = self._calculate_mission_profile_match(mission, candidate)

            # Graph-based team formation (if interactions available)
            team_compatibility = 0.0
            if interactions:
                # Would need current team members to calculate team compatibility
                pass

            overall_score = (skill_match * 0.6 + profile_match * 0.4)

            if overall_score >= settings.mission_skill_match_threshold:
                recommendations.append(RecommendationResult(
                    user_id=candidate.id,
                    target_id=mission.id,
                    score=overall_score,
                    semantic_score=profile_match,
                    graph_score=team_compatibility,
                    behavioral_score=0.0,  # Not applicable for mission matching
                    explanation=self._generate_mission_explanation(mission, candidate, skill_match),
                    matched_skills=self._get_matched_mission_skills(mission, candidate),
                    common_interests=[],
                    compatibility_factors={
                        "skill_match": skill_match,
                        "profile_match": profile_match,
                        "team_compatibility": team_compatibility
                    }
                ))

        # Sort by score and limit results
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:settings.participant_selection_limit]

    def _calculate_mission_skill_match(self, mission: Mission, candidate: UserProfile) -> float:
        """Calculate skill match between mission requirements and candidate"""
        required_skills = set(mission.required_skills or [])
        candidate_skills = set(candidate.skills or [])

        if not required_skills:
            return 0.5  # Neutral if no requirements specified

        intersection = len(required_skills.intersection(candidate_skills))
        return intersection / len(required_skills)

    def _calculate_mission_profile_match(self, mission: Mission, candidate: UserProfile) -> float:
        """Calculate overall profile match for mission"""
        # Simple implementation - could be enhanced with ML
        match_score = 0.0
        factors = 0

        # Experience level match
        if mission.difficulty and candidate.experience_level:
            difficulty_map = {"beginner": 1, "intermediate": 2, "advanced": 3}
            mission_level = difficulty_map.get(mission.difficulty, 2)
            candidate_level = difficulty_map.get(candidate.experience_level, 2)
            level_match = 1.0 - abs(mission_level - candidate_level) * 0.3
            match_score += level_match
            factors += 1

        # Interest alignment
        if candidate.interests and mission.tags:
            interest_overlap = len(set(candidate.interests).intersection(set(mission.tags)))
            interest_score = interest_overlap / max(len(mission.tags), 1)
            match_score += interest_score
            factors += 1

        return match_score / factors if factors > 0 else 0.5

    def _generate_mission_explanation(self, mission: Mission, candidate: UserProfile,
                                   skill_match: float) -> str:
        """Generate explanation for mission recommendation"""
        reasons = []

        if skill_match > 0.8:
            reasons.append("vous maîtrisez toutes les compétences requises")
        elif skill_match > 0.5:
            reasons.append("vous avez la plupart des compétences nécessaires")

        if candidate.experience_level == mission.difficulty:
            reasons.append(f"votre niveau {candidate.experience_level} correspond parfaitement")

        if not reasons:
            reasons.append("il y a un bon potentiel de contribution")

        return f"Parce que {', '.join(reasons)} pour cette mission."

    def _get_matched_mission_skills(self, mission: Mission, candidate: UserProfile) -> List[str]:
        """Get skills that match mission requirements"""
        required = set(mission.required_skills or [])
        candidate_skills = set(candidate.skills or [])
        return list(required.intersection(candidate_skills))


# Global instance for the application
ai_engine = HybridRecommendationEngine()