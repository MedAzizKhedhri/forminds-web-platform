from typing import Dict, List

from sentence_transformers import SentenceTransformer, util

from app.config import settings
from app.models import JobOpportunity, UserProfile


_MODEL = None


def _get_model() -> SentenceTransformer:
    global _MODEL
    if _MODEL is None:
        cache_folder = settings.transformers_cache
        cache_folder.mkdir(parents=True, exist_ok=True)
        _MODEL = SentenceTransformer(
            settings.model_name,
            cache_folder=str(cache_folder),
        )
    return _MODEL


def encode_text(text: str) -> List[float]:
    model = _get_model()
    raw_embedding = model.encode(text or "", convert_to_numpy=True)
    normalized_embedding = util.normalize_embeddings(raw_embedding.reshape(1, -1))[0]
    return normalized_embedding.tolist()


def _normalize_text(value: str) -> str:
    return value.strip().lower()


def _normalize_skills(skills: List[str]) -> List[str]:
    return [
        _normalize_text(skill).replace("-", " ").replace(".", "")
        for skill in skills
        if skill and isinstance(skill, str)
    ]


def _get_matched_skills(user: UserProfile, job: JobOpportunity) -> List[str]:
    normalized_user_skills = set(_normalize_skills(user.skills))
    normalized_job_skills = {skill: skill for skill in _normalize_skills(job.required_skills)}
    return [normalized_job_skills[skill] for skill in normalized_user_skills if skill in normalized_job_skills]


def _compute_semantic_score(user: UserProfile, job: JobOpportunity) -> float:
    model = _get_model()
    emb1 = model.encode(user.bio or "", convert_to_tensor=True)
    emb2 = model.encode(job.description or "", convert_to_tensor=True)
    similarity = util.cos_sim(emb1, emb2).item()
    return max(0.0, min(1.0, similarity))


def _compute_skill_score(user: UserProfile, job: JobOpportunity) -> float:
    user_skills = set(_normalize_skills(user.skills))
    job_skills = set(_normalize_skills(job.required_skills))
    if not job_skills:
        return 0.0
    return len(user_skills.intersection(job_skills)) / max(len(job_skills), 1)


def _compute_location_score(user: UserProfile, job: JobOpportunity) -> float:
    return 1.0 if _normalize_text(user.location) == _normalize_text(job.location) else 0.0


def _build_reason(final_score_pct: float, matched_skills: List[str]) -> str:
    if final_score_pct >= 80:
        skills_text = ", ".join(matched_skills[:3]) if matched_skills else "vos comp�tences cl�s"
        return f"? Excellent match ! Votre profil correspond tr�s bien aux attentes ({skills_text})."
    if final_score_pct >= 50:
        skills_text = ", ".join(matched_skills[:2]) if matched_skills else "votre profil"
        return f"? Bon potentiel de match. Vos comp�tences comme {skills_text} sont pertinentes pour ce poste."
    return "?? Match faible. Le descriptif et les comp�tences demand�es s'�loignent de votre profil actuel."


def calculate_hybrid_match(user: UserProfile, job: JobOpportunity) -> Dict[str, object]:
    semantic_score = _compute_semantic_score(user, job)
    skill_score = _compute_skill_score(user, job)
    location_score = _compute_location_score(user, job)
    matched_skills = _get_matched_skills(user, job)

    final_score = (
        semantic_score * settings.semantic_weight
        + skill_score * settings.skill_weight
        + location_score * settings.location_weight
    )

    final_score_pct = round(max(0.0, min(1.0, final_score)) * 100, 1)

    return {
        "score": final_score_pct,
        "semantic": round(semantic_score * 100, 1),
        "skills": round(skill_score * 100, 1),
        "location": round(location_score * 100, 1),
        "matched_skills": matched_skills,
        "reason": _build_reason(final_score_pct, matched_skills),
    }

# --- Node.js Backend Integration Methods ---

from app.models import StudentData, OpportunityData, MatchResult, DetailedMatchResult, MatchBreakdown

def _build_student_bio(student: StudentData) -> str:
    parts = []
    for exp in student.experiences:
        parts.append(f"{exp.title} at {exp.company}")
        if exp.description:
            parts.append(exp.description)
    for edu in student.education:
        parts.append(f"{edu.degree} in {edu.field} from {edu.institution}")
    return " ".join(parts)

def _build_opportunity_desc(opp: OpportunityData) -> str:
    parts = [opp.title, opp.domain, opp.type]
    if opp.requirements:
        parts.append(opp.requirements)
    return " ".join(parts)

def _compute_student_semantic(student: StudentData, opp: OpportunityData) -> float:
    model = _get_model()
    bio = _build_student_bio(student)
    desc = _build_opportunity_desc(opp)
    
    if not bio.strip() or not desc.strip():
        return 0.5 # Default middle ground if missing text
        
    emb1 = model.encode(bio, convert_to_tensor=True)
    emb2 = model.encode(desc, convert_to_tensor=True)
    similarity = util.cos_sim(emb1, emb2).item()
    return max(0.0, min(1.0, similarity))

def _compute_student_skills(student: StudentData, opp: OpportunityData) -> float:
    user_skills = set(_normalize_skills(student.skills))
    job_skills = set(_normalize_skills(opp.skills))
    if not job_skills:
        return 0.0
    return len(user_skills.intersection(job_skills)) / max(len(job_skills), 1)

def _compute_student_location(student: StudentData, opp: OpportunityData) -> float:
    if not student.location or not opp.location:
        return 0.0
    return 1.0 if _normalize_text(student.location) == _normalize_text(opp.location) else 0.0

def calculate_student_match(student: StudentData, opp: OpportunityData) -> MatchResult:
    semantic_score = _compute_student_semantic(student, opp)
    skill_score = _compute_student_skills(student, opp)
    location_score = _compute_student_location(student, opp)
    
    skills_pct = int(round(skill_score * 100))
    location_pct = int(round(location_score * 100))
    domain_pct = int(round(semantic_score * 100))
    
    # Custom weight for the Node.js backend integration
    overall_score = int(round(skills_pct * 0.5 + location_pct * 0.25 + domain_pct * 0.25))
    
    user_skills = set(_normalize_skills(student.skills))
    job_skills = set(_normalize_skills(opp.skills))
    matched_count = len(user_skills.intersection(job_skills))
    total_req = len(job_skills)
    
    explanation = f"Matched {matched_count}/{total_req} required skills. Semantic relevance: {domain_pct}%."
    
    return MatchResult(
        opportunityId=opp.id,
        score=overall_score,
        breakdown=MatchBreakdown(
            skillsScore=skills_pct,
            locationScore=location_pct,
            domainScore=domain_pct
        ),
        explanation=explanation
    )

def calculate_student_score(student: StudentData, opp: OpportunityData) -> DetailedMatchResult:
    semantic_score = _compute_student_semantic(student, opp)
    skill_score = _compute_student_skills(student, opp)
    location_score = _compute_student_location(student, opp)
    
    skills_pct = int(round(skill_score * 100))
    location_pct = int(round(location_score * 100))
    domain_pct = int(round(semantic_score * 100))
    experience_pct = 60 if student.experiences else 20
    
    overall_score = int(round(skills_pct * 0.4 + location_pct * 0.2 + domain_pct * 0.2 + experience_pct * 0.2))
    
    user_skills_norm = { _normalize_text(s): s for s in student.skills }
    job_skills_norm = { _normalize_text(s): s for s in opp.skills }
    
    matched_skills = []
    missing_skills = []
    
    for jk_norm, jk_orig in job_skills_norm.items():
        if jk_norm in user_skills_norm:
            matched_skills.append(jk_orig)
        else:
            missing_skills.append(jk_orig)
            
    matched_count = len(matched_skills)
    total_req = len(opp.skills)
    
    explanation = f"Matched {matched_count}/{total_req} required skills."
    if missing_skills:
        explanation += f" Missing: {', '.join(missing_skills)}."
    else:
        explanation += " All required skills matched."
        
    return DetailedMatchResult(
        overallScore=overall_score,
        breakdown=MatchBreakdown(
            skillsScore=skills_pct,
            locationScore=location_pct,
            domainScore=domain_pct,
            experienceScore=experience_pct
        ),
        matchedSkills=matched_skills,
        missingSkills=missing_skills,
        explanation=explanation
    )
