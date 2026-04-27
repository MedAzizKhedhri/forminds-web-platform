# ForMinds AI Matching Service

Microservice de matching intelligent entre étudiants et opportunités, basé sur FastAPI, MongoDB (stockage des embeddings), Sentence-Transformers et Docker.

## Structure du projet

- `app/main.py` : point d'entrée de l'API FastAPI, gestion du démarrage et des endpoints REST.
- `app/database.py` : connexion MongoDB, indexation des offres et recherche de recommandations par similarité vectorielle.
- `app/engine.py` : moteur de scoring hybride et encodage de texte avec Sentence Transformers.
- `app/models.py` : schémas Pydantic pour `UserProfile` et `JobOpportunity`.
- `app/config.py` : configuration via variables d'environnement et fichier `.env`.
- `requirements.txt` : dépendances Python du projet.
- `Dockerfile` : image de conteneur Python pour l'application.
- `docker-compose.yml` : service IA et MongoDB.

## Variables d'environnement

1. Copier le fichier de configuration exemple :

   ```powershell
   copy .env.example .env
   ```

2. Ne committez jamais `.env` dans Git.

3. Exemple de contenu dans `.env` :

   ```env
   MONGODB_URI=mongodb://db:27017
   MONGODB_DB_NAME=forminds_db
   MONGODB_COLLECTION=jobs
   MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2
   ```

   En local sans Docker : `MONGODB_URI=mongodb://127.0.0.1:27017`

## Exécution locale

1. Démarrez MongoDB (ou `docker compose up db`).

2. Créez un environnement virtuel Python :

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Installez les dépendances :

   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

4. Lancez le service :

   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

5. Ouvrez `http://127.0.0.1:8000` pour vérifier l'état du service.

## Endpoints principaux

- `POST /index-job` : indexe une offre dans MongoDB (embedding inclus) pour les recherches `/recommend`.
- `POST /recommend` : renvoie les meilleures opportunités pour un profil donné (similarité cosinus sur les vecteurs stockés). Query optionnelle : `limit` (défaut 5, max 100), ex. `POST /recommend?limit=10`.
- `GET /health` : vérifie que le service est en ligne.
- `POST /match` : matching hybride sur une liste d'offres fournie dans la requête (sans lecture MongoDB).

## Docker

```powershell
docker compose up --build
```

Le service `ai-service` monte `./models_cache:/app/models_cache` pour conserver le modèle SBERT localement. Configurez `.env` avec `MONGODB_URI=mongodb://db:27017` pour joindre le conteneur `db`.

## Railway / Cloud deployment

This repository can be deployed directly on Railway or another container platform.

### Recommended Railway setup

1. Deploy as a Docker service using the existing `Dockerfile`.
   - If Railway detects a Python service, it can use `Procfile` automatically.
2. Set these environment variables in Railway:
   - `MONGODB_URI` — connection string to Railway MongoDB
   - `MONGODB_DB_NAME=forminds_db`
   - `MONGODB_COLLECTION=jobs`
   - `MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2`
   - `TRANSFORMERS_CACHE=/tmp/models_cache`
   - optional: `HF_HUB_TOKEN` for private or rate-limited Hugging Face access
3. Railway provides `PORT`; the app will read it automatically via `settings.port`.
4. Verify the service with `GET /health` and `/docs`.

### Direct Python deployment

If not using Docker, install dependencies and run:

```powershell
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Bonnes pratiques GitHub

- `.gitignore` empêche les fichiers sensibles et temporaires d'être commités.
- `.env` contient les secrets locaux et doit rester hors du dépôt.
- `README.md` explique comment démarrer le projet et quels endpoints sont disponibles.
