# Documentation Backend - Sprint 1

## ForMinds Web Platform

**Sprint 1** : BF-001 (Authentification & Gestion des Roles) + BF-002 partiel (Profils de base) + Suppression de compte

---

## Table des matieres

1. [Architecture generale](#1-architecture-generale)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Format de reponse API](#4-format-de-reponse-api)
5. [Modeles de donnees](#5-modeles-de-donnees)
6. [Endpoints API](#6-endpoints-api)
7. [Pipeline de middlewares](#7-pipeline-de-middlewares)
8. [Strategie de tokens](#8-strategie-de-tokens)
9. [Gestion des erreurs](#9-gestion-des-erreurs)
10. [Service email](#10-service-email)
11. [Variables d'environnement](#11-variables-denvironnement)
12. [Mesures de securite](#12-mesures-de-securite)
13. [Docker](#13-docker)

---

## 1. Architecture generale

Le backend de ForMinds est une API REST construite avec **Express.js** et **TypeScript**. Elle utilise **MongoDB** comme base de donnees avec **Mongoose** comme ODM (Object-Document Mapper).

L'architecture suit un pattern en couches :

```
Requete HTTP
    |
    v
Middlewares (Helmet, CORS, Rate Limiter, Auth, Validation)
    |
    v
Controllers (validation Zod, orchestration)
    |
    v
Services (logique metier)
    |
    v
Models (Mongoose / MongoDB)
```

- **Controllers** : recoivent les requetes, valident les donnees avec Zod, et delegent aux services.
- **Services** : contiennent la logique metier (authentification, gestion des tokens, profils, emails).
- **Models** : definissent les schemas Mongoose et les interactions avec MongoDB.
- **Middlewares** : gerent les preoccupations transversales (authentification, autorisation, validation, rate limiting, gestion d'erreurs).

---

## 2. Stack technique

| Composant | Technologie | Version / Details |
|-----------|-------------|-------------------|
| Runtime | Node.js | 20 (Alpine) |
| Framework | Express.js | - |
| Langage | TypeScript | target ES2020, module CommonJS |
| Base de donnees | MongoDB | 7.0 |
| ODM | Mongoose | - |
| Authentification | JWT RS256 | jsonwebtoken + bcryptjs |
| Validation | Zod | - |
| Email | Nodemailer | SMTP ou Ethereal (test) |
| Upload fichiers | Multer | - |
| Securite | Helmet, CORS, express-rate-limit | - |
| Logging | Morgan | - |

---

## 3. Structure du projet

```
backend/src/
├── server.ts                # Point d'entree - charge l'env, connecte MongoDB, demarre le serveur
├── app.ts                   # Configuration Express, pile de middlewares, montage des routes
│
├── config/
│   ├── index.ts             # Configuration centrale (port, mongoUri, jwt, smtp, upload)
│   ├── database.ts          # Connexion MongoDB avec gestionnaires d'evenements
│   ├── jwt.ts               # Chargement de la paire de cles RSA depuis les fichiers PEM
│   └── mailer.ts            # Transporteur Nodemailer (SMTP ou fallback Ethereal)
│
├── models/
│   ├── User.ts              # Modele utilisateur (email, password, role, 2FA, etc.)
│   ├── Token.ts             # Modele token (refresh, verification, reset, 2FA)
│   ├── StudentProfile.ts    # Profil etudiant avec sous-documents embarques
│   └── RecruiterProfile.ts  # Profil recruteur (entreprise)
│
├── controllers/
│   ├── auth.controller.ts   # Handlers d'authentification + schemas Zod
│   ├── profile.controller.ts # Handlers CRUD profil + schemas Zod
│   └── user.controller.ts   # Gestion des utilisateurs (admin)
│
├── services/
│   ├── auth.service.ts      # Logique metier : register, login, verify, reset, 2FA
│   ├── token.service.ts     # Generation JWT, rotation refresh token, validation
│   ├── email.service.ts     # Envoi d'emails (verification, reset, code 2FA)
│   └── profile.service.ts   # CRUD profil, calcul de completion
│
├── middleware/
│   ├── authenticate.ts      # Verification JWT RS256
│   ├── authorize.ts         # Controle d'acces base sur les roles
│   ├── validate.ts          # Middleware de validation Zod
│   ├── upload.ts            # Upload fichiers Multer (CV: PDF 5Mo, Avatar: image 2Mo)
│   ├── rateLimiter.ts       # Rate limiting (global, auth, password reset)
│   └── errorHandler.ts      # Gestion centralisee des erreurs
│
├── utils/
│   ├── AppError.ts          # Classe d'erreur personnalisee avec statusCode
│   ├── constants.ts         # Enums : UserRole, AuthProvider, TokenType
│   └── asyncHandler.ts      # Wrapper try/catch pour les handlers async
│
├── types/
│   ├── index.ts             # Interfaces JwtPayload, ApiResponse
│   └── express.d.ts         # Augmentation de Express Request (req.user)
│
└── scripts/
    └── seedAdmin.ts         # Script de creation du compte admin initial
```

### Description des fichiers cles

| Fichier | Responsabilite |
|---------|----------------|
| `server.ts` | Point d'entree de l'application. Charge les variables d'environnement, etablit la connexion MongoDB, puis demarre le serveur HTTP. |
| `app.ts` | Configure l'instance Express avec la pile complete de middlewares et monte les routes. |
| `config/index.ts` | Exporte un objet de configuration centralise regroupant port, URI MongoDB, parametres JWT, SMTP et upload. |
| `config/database.ts` | Gere la connexion a MongoDB avec des gestionnaires pour les evenements `connected`, `error` et `disconnected`. |
| `config/jwt.ts` | Charge la paire de cles RSA (private.pem / public.pem) depuis le systeme de fichiers pour la signature et la verification JWT. |
| `config/mailer.ts` | Initialise le transporteur Nodemailer. Utilise les credentials SMTP si configures, sinon se rabat sur un compte Ethereal de test. |
| `utils/AppError.ts` | Classe d'erreur etendue qui inclut un `statusCode` HTTP et un indicateur `isOperational`. |
| `utils/asyncHandler.ts` | Fonction wrapper qui capture les rejets de promesses dans les handlers de routes et les transmet au middleware d'erreur. |

---

## 4. Format de reponse API

Toutes les reponses de l'API suivent un format standardise :

### Reponse de succes

```json
{
  "success": true,
  "message": "Message lisible par l'utilisateur",
  "data": {
    "...": "..."
  }
}
```

### Reponse d'erreur

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "nomDuChamp",
      "message": "Detail de l'erreur de validation"
    }
  ]
}
```

Le champ `errors` est un tableau present uniquement en cas d'erreurs de validation (Zod ou Mongoose). Chaque entree contient le nom du champ en erreur et le message descriptif associe.

---

## 5. Modeles de donnees

### 5.1 User (Utilisateur)

Le modele `User` represente un utilisateur de la plateforme (etudiant, recruteur ou administrateur).

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto-genere | Identifiant unique |
| `email` | String | unique, lowercase, requis | Adresse email de l'utilisateur |
| `password` | String | select: false | Hash bcrypt du mot de passe |
| `firstName` | String | 2-50 caracteres, requis | Prenom |
| `lastName` | String | 2-50 caracteres, requis | Nom de famille |
| `username` | String | unique, lowercase, 3-30 chars, regex: `/^[a-z0-9_-]+$/` | Nom d'utilisateur |
| `role` | String (enum) | `student`, `recruiter`, `admin` | Role de l'utilisateur |
| `authProvider` | String (enum) | `local`, `google`, `linkedin` | Fournisseur d'authentification |
| `isEmailVerified` | Boolean | defaut: `false` | Email verifie ou non |
| `is2FAEnabled` | Boolean | defaut: `false` | Authentification a deux facteurs activee |
| `isActive` | Boolean | defaut: `true` | Compte actif ou desactive |
| `avatar` | String | optionnel | URL de l'avatar |
| `lastLoginAt` | Date | optionnel | Date de derniere connexion |
| `createdAt` | Date | auto (timestamps) | Date de creation |
| `updatedAt` | Date | auto (timestamps) | Date de derniere modification |

**Index** : `role`, `email`, `username`

**Notes** :
- Le mot de passe est hashe avec **bcrypt (12 salt rounds)** avant stockage.
- Le champ `password` est exclu par defaut des requetes (`select: false`) pour eviter toute fuite accidentelle.
- Le champ `username` n'accepte que les lettres minuscules, chiffres, tirets et underscores.

### 5.2 Token

Le modele `Token` gere tous les jetons temporaires utilises dans les flux d'authentification.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto-genere | Identifiant unique |
| `userId` | ObjectId | ref: User, requis | Utilisateur associe |
| `token` | String | requis | Valeur du jeton |
| `type` | String (enum) | `refresh`, `email_verification`, `password_reset`, `two_factor` | Type de jeton |
| `expiresAt` | Date | requis | Date d'expiration |
| `isUsed` | Boolean | defaut: `false` | Jeton deja utilise ou non |
| `createdAt` | Date | auto (timestamps) | Date de creation |
| `updatedAt` | Date | auto (timestamps) | Date de modification |

**Index** :
- **TTL** sur `expiresAt` : suppression automatique des tokens expires par MongoDB.
- **Index compose** sur `userId` + `type` : acceleration des recherches de tokens par utilisateur et type.

### 5.3 StudentProfile (Profil Etudiant)

Le profil etudiant contient les informations academiques, professionnelles et les competences.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `userId` | ObjectId | ref: User, unique, requis | Utilisateur proprietaire |
| `headline` | String | max 120 caracteres | Titre professionnel court |
| `bio` | String | max 2000 caracteres | Biographie / presentation |
| `phone` | String | optionnel | Numero de telephone |
| `location` | String | optionnel | Localisation |
| `website` | String | optionnel | Site web personnel |
| `linkedinUrl` | String | optionnel | Profil LinkedIn |
| `githubUrl` | String | optionnel | Profil GitHub |
| `skills` | [String] | convertis en lowercase | Liste de competences |
| `education` | [Education] | sous-document embarque | Parcours academique |
| `experiences` | [Experience] | sous-document embarque | Experiences professionnelles |
| `projects` | [Project] | sous-document embarque | Projets realises |
| `cvUrl` | String | optionnel | URL du CV uploade |
| `profileCompletionPercent` | Number | 0-100 | Pourcentage de completion du profil |
| `isPublic` | Boolean | defaut: `true` | Profil visible publiquement |
| `createdAt` | Date | auto (timestamps) | Date de creation |
| `updatedAt` | Date | auto (timestamps) | Date de modification |

**Index** : `userId` (unique), `skills`, `location`

#### Sous-documents embarques

**Education** :

| Champ | Type | Description |
|-------|------|-------------|
| `institution` | String | Nom de l'etablissement |
| `degree` | String | Diplome obtenu |
| `field` | String | Domaine d'etudes |
| `startDate` | Date | Date de debut |
| `endDate` | Date | Date de fin (optionnel) |
| `current` | Boolean | En cours ou non |

**Experience** :

| Champ | Type | Description |
|-------|------|-------------|
| `company` | String | Nom de l'entreprise |
| `position` | String | Poste occupe |
| `description` | String | Description du poste |
| `startDate` | Date | Date de debut |
| `endDate` | Date | Date de fin (optionnel) |
| `current` | Boolean | En cours ou non |

**Project** :

| Champ | Type | Description |
|-------|------|-------------|
| `title` | String | Titre du projet |
| `description` | String | Description du projet |
| `technologies` | [String] | Technologies utilisees |
| `link` | String | Lien vers le projet |
| `image` | String | Image du projet |

### 5.4 RecruiterProfile (Profil Recruteur)

Le profil recruteur contient les informations relatives a l'entreprise.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `userId` | ObjectId | ref: User, unique, requis | Utilisateur proprietaire |
| `companyName` | String | max 150, defaut: `''` | Nom de l'entreprise |
| `sector` | String | defaut: `''` | Secteur d'activite |
| `companyDescription` | String | max 2000 | Description de l'entreprise |
| `companyWebsite` | String | optionnel | Site web de l'entreprise |
| `companyLogo` | String | optionnel | Logo de l'entreprise |
| `contactEmail` | String | lowercase | Email de contact |
| `contactPhone` | String | optionnel | Telephone de contact |
| `location` | String | optionnel | Localisation de l'entreprise |
| `isVerified` | Boolean | defaut: `false` | Entreprise verifiee par un admin |
| `createdAt` | Date | auto (timestamps) | Date de creation |
| `updatedAt` | Date | auto (timestamps) | Date de modification |

---

## 6. Endpoints API

### 6.1 Authentification (`/api/auth`)

#### Tableau recapitulatif

| Methode | Route | Auth | Rate Limit | Description |
|---------|-------|------|------------|-------------|
| POST | `/register` | Non | Auth (10/15min) | Inscription d'un nouvel utilisateur |
| POST | `/login` | Non | Auth (10/15min) | Connexion par email/mot de passe |
| POST | `/verify-email` | Non | - | Verification de l'email par token |
| POST | `/resend-verification` | Non | Auth (10/15min) | Renvoi de l'email de verification |
| POST | `/forgot-password` | Non | Password (3/h) | Demande de reinitialisation du mot de passe |
| POST | `/reset-password` | Non | - | Reinitialisation du mot de passe par token |
| POST | `/verify-2fa` | Non | - | Verification du code 2FA a la connexion |
| POST | `/refresh` | Non | - | Rafraichissement du token d'acces |
| POST | `/logout` | Oui | - | Deconnexion (revocation des tokens) |
| POST | `/enable-2fa` | Oui | - | Initiation de la configuration 2FA |
| POST | `/confirm-2fa` | Oui | - | Confirmation de l'activation 2FA |
| GET | `/me` | Oui | - | Recuperation des donnees utilisateur courant |

---

#### POST `/api/auth/register`

Inscription d'un nouvel utilisateur sur la plateforme.

**Corps de la requete** :

```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse1!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "username": "jean-dupont",
  "role": "student"
}
```

**Regles de validation** :

| Champ | Regles |
|-------|--------|
| `email` | Email valide, requis |
| `password` | Min 8 caracteres, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractere special |
| `firstName` | 2-50 caracteres, requis |
| `lastName` | 2-50 caracteres, requis |
| `username` | 3-30 caracteres, uniquement lettres minuscules, chiffres, tirets, underscores |
| `role` | `"student"` ou `"recruiter"` |

**Flux de traitement** :

1. Validation du corps de la requete avec le schema Zod.
2. Verification de l'unicite de l'email et du username.
3. Hashage du mot de passe avec bcrypt (12 rounds).
4. Creation de l'utilisateur en base de donnees.
5. Creation du profil vide correspondant au role (`StudentProfile` ou `RecruiterProfile`).
6. Generation d'un token de verification (UUID v4, expiration 24h).
7. Envoi de l'email de verification.
8. Retour de la reponse 201.

**Reponse 201 (succes)** :

```json
{
  "success": true,
  "message": "Registration successful...",
  "data": {
    "user": {
      "_id": "...",
      "email": "utilisateur@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "username": "jean-dupont",
      "role": "student",
      "isEmailVerified": false
    }
  }
}
```

**Reponse 409 (conflit)** :

```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

---

#### POST `/api/auth/login`

Connexion d'un utilisateur existant.

**Corps de la requete** :

```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse1!"
}
```

**Flux de traitement** :

1. Recherche de l'utilisateur par email (avec le champ `password` inclus).
2. Comparaison du mot de passe avec le hash bcrypt.
3. Verification que l'email est verifie (`isEmailVerified`).
4. Verification que le compte est actif (`isActive`).
5. **Si 2FA active** : generation d'un code a 6 chiffres, envoi par email, retour `{ requires2FA: true }`.
6. **Si 2FA desactive** : generation du token d'acces (JWT RS256) et du refresh token (UUID, hashe, 7 jours), positionnement du cookie httpOnly, retour des donnees utilisateur + accessToken.

**Reponse 200 (succes sans 2FA)** :

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "_id": "...",
      "email": "utilisateur@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "student"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

En parallele, un cookie `refreshToken` est positionne :

| Propriete | Valeur |
|-----------|--------|
| `httpOnly` | `true` |
| `secure` | `true` (production uniquement) |
| `sameSite` | `strict` |
| `maxAge` | 7 jours |
| `path` | `/api/auth` |

**Reponse 200 (2FA requis)** :

```json
{
  "success": true,
  "message": "2FA code sent.",
  "data": {
    "requires2FA": true
  }
}
```

---

#### POST `/api/auth/verify-email`

Verification de l'adresse email apres inscription.

**Corps de la requete** :

```json
{
  "token": "uuid-v4-token",
  "email": "utilisateur@example.com"
}
```

**Flux de traitement** :

1. Recherche du token en base (type: `email_verification`, non utilise, non expire).
2. Marquage du token comme utilise (`isUsed: true`).
3. Mise a jour de l'utilisateur : `isEmailVerified: true`.

---

#### POST `/api/auth/resend-verification`

Renvoi de l'email de verification.

**Corps de la requete** :

```json
{
  "email": "utilisateur@example.com"
}
```

**Rate limit** : 10 requetes par 15 minutes par IP.

---

#### POST `/api/auth/forgot-password`

Demande de reinitialisation du mot de passe.

**Corps de la requete** :

```json
{
  "email": "utilisateur@example.com"
}
```

**Flux de traitement** :

1. Retourne toujours un statut 200 (prevention de l'enumeration d'emails).
2. Si l'utilisateur existe : invalidation des anciens tokens de reset, creation d'un nouveau token (UUID, expiration 1h), envoi de l'email de reinitialisation.

**Reponse 200** (toujours, que l'email existe ou non) :

```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent."
}
```

**Rate limit** : 3 requetes par heure par IP.

---

#### POST `/api/auth/reset-password`

Reinitialisation du mot de passe avec un token.

**Corps de la requete** :

```json
{
  "token": "uuid-v4-token",
  "email": "utilisateur@example.com",
  "newPassword": "NouveauMotDePasse1!"
}
```

**Flux de traitement** :

1. Validation du token (type: `password_reset`, non utilise, non expire).
2. Hashage du nouveau mot de passe avec bcrypt.
3. Mise a jour du mot de passe de l'utilisateur.
4. Marquage du token comme utilise.
5. Revocation de tous les refresh tokens de l'utilisateur (force la re-connexion).

**Messages d'erreur specifiques** :

| Situation | Message |
|-----------|---------|
| Token introuvable | `"token not found"` |
| Token deja utilise | `"already used"` |
| Token expire | `"expired"` |

---

#### POST `/api/auth/enable-2fa`

Initiation de la configuration de l'authentification a deux facteurs.

**Authentification requise** : Oui (Bearer token).

**Flux** : Generation d'un code a 6 chiffres (expiration 10 minutes), envoi par email a l'utilisateur.

---

#### POST `/api/auth/confirm-2fa`

Confirmation de l'activation de la 2FA.

**Authentification requise** : Oui (Bearer token).

**Corps de la requete** :

```json
{
  "code": "123456"
}
```

**Flux** : Validation du code, activation de `is2FAEnabled` sur le modele User.

---

#### POST `/api/auth/verify-2fa`

Verification du code 2FA lors de la connexion.

**Corps de la requete** :

```json
{
  "email": "utilisateur@example.com",
  "code": "123456"
}
```

**Flux** : Validation du code 2FA, emission des tokens (access + refresh), positionnement du cookie.

---

#### POST `/api/auth/refresh`

Rafraichissement du token d'acces.

**Flux de traitement** :

1. Lecture du `refreshToken` depuis le cookie httpOnly.
2. Lecture optionnelle du header `Authorization` pour extraire le `userId` (meme si le token est expire, il est decode).
3. Recherche des refresh tokens valides en base de donnees pour cet utilisateur.
4. Comparaison bcrypt avec chaque token trouve.
5. Si correspondance : invalidation de l'ancien token, generation de nouveaux tokens (access + refresh), positionnement du nouveau cookie.

**Reponse 200 (succes)** :

```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

Un nouveau cookie `refreshToken` est egalement positionne.

**Reponse 401 (erreur)** : Aucun refresh token present ou token invalide.

---

#### POST `/api/auth/logout`

Deconnexion de l'utilisateur.

**Authentification requise** : Oui (Bearer token).

**Flux** : Revocation de tous les refresh tokens de l'utilisateur (`isUsed: true`), suppression du cookie.

**Reponse 200** :

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

#### GET `/api/auth/me`

Recuperation des informations de l'utilisateur courant.

**Authentification requise** : Oui (Bearer token).

**Reponse 200** : Retourne les donnees de l'utilisateur authentifie (sans le mot de passe).

---

### 6.2 Profils (`/api/profiles`)

#### Tableau recapitulatif

| Methode | Route | Auth | Role | Description |
|---------|-------|------|------|-------------|
| GET | `/me` | Oui | Tous | Recuperer son propre profil |
| PUT | `/me` | Oui | Tous | Mettre a jour son propre profil |
| POST | `/me/projects` | Oui | Student | Ajouter un projet |
| PUT | `/me/projects/:id` | Oui | Student | Modifier un projet |
| DELETE | `/me/projects/:id` | Oui | Student | Supprimer un projet |
| POST | `/me/education` | Oui | Student | Ajouter une formation |
| PUT | `/me/education/:id` | Oui | Student | Modifier une formation |
| DELETE | `/me/education/:id` | Oui | Student | Supprimer une formation |
| POST | `/me/experiences` | Oui | Student | Ajouter une experience |
| PUT | `/me/experiences/:id` | Oui | Student | Modifier une experience |
| DELETE | `/me/experiences/:id` | Oui | Student | Supprimer une experience |
| POST | `/me/cv` | Oui | Student | Uploader un CV (PDF, max 5Mo) |
| DELETE | `/me/cv` | Oui | Student | Supprimer le CV |
| POST | `/me/avatar` | Oui | Tous | Uploader un avatar (JPEG/PNG/WebP, max 2Mo) |
| DELETE | `/me/avatar` | Oui | Tous | Supprimer l'avatar |
| DELETE | `/me/cover` | Oui | Tous | Supprimer l'image de couverture |
| DELETE | `/me/account` | Oui | Tous | Supprimer definitivement son compte |
| GET | `/public/:username` | Non | - | Consulter un profil public |

---

#### GET `/api/profiles/me`

Recupere le profil de l'utilisateur connecte selon son role.

**Authentification requise** : Oui.

**Reponse 200** :

```json
{
  "success": true,
  "data": {
    "profile": { "...": "StudentProfile ou RecruiterProfile" }
  }
}
```

---

#### PUT `/api/profiles/me`

Mise a jour du profil de l'utilisateur connecte.

**Authentification requise** : Oui.

**Champs modifiables selon le role** :

| Role | Champs |
|------|--------|
| Student | `headline`, `bio`, `phone`, `location`, `website`, `linkedinUrl`, `githubUrl`, `skills`, `isPublic` |
| Recruiter | `companyName`, `sector`, `companyDescription`, `companyWebsite`, `contactEmail`, `contactPhone`, `location` |

**Implementation** : Utilise `findOneAndUpdate` avec l'operateur `$set` et l'option `{ new: true }` pour retourner le document mis a jour.

---

#### Sous-documents embarques (Student uniquement)

Les endpoints de gestion des sous-documents (projects, education, experiences) suivent un pattern CRUD uniforme :

**POST** (ajout) : Ajoute un nouvel element au tableau embarque et retourne le profil mis a jour.

**PUT** (modification) : Met a jour un element identifie par son `_id` dans le tableau embarque.

**DELETE** (suppression) : Retire un element du tableau embarque par son `_id`.

---

#### Upload de fichiers

**POST `/api/profiles/me/cv`**

| Propriete | Valeur |
|-----------|--------|
| Format accepte | PDF uniquement |
| Taille maximale | 5 Mo |
| Role requis | Student |

**POST `/api/profiles/me/avatar`**

| Propriete | Valeur |
|-----------|--------|
| Formats acceptes | JPEG, PNG, WebP |
| Taille maximale | 2 Mo |
| Role requis | Tous |

---

#### DELETE `/api/profiles/me/account`

Suppression definitive du compte utilisateur et de toutes les donnees associees.

**Authentification requise** : Oui.

**Corps de la requete** :

```json
{
  "password": "MotDePasse1!"
}
```

**Validation Zod** :

| Champ | Regles |
|-------|--------|
| `password` | Chaine non vide, requis |

**Flux de traitement** :

1. Verification du mot de passe de l'utilisateur (bcrypt.compare).
2. Collecte des chemins de fichiers a nettoyer (avatar, coverImage, CV).
3. Suppression en cascade de toutes les donnees associees :
   - Phase 1 : Likes, Comments, Applications (documents feuilles)
   - Phase 2 : Posts, Opportunities, Connections, Tokens (documents intermediaires)
   - Phase 3 : StudentProfile, RecruiterProfile, User (documents racines)
4. Nettoyage des fichiers uploades sur le disque (best-effort).

**Reponse 200 (succes)** :

```json
{
  "success": true,
  "message": "Account deleted successfully."
}
```

**Reponse 401 (mot de passe incorrect)** :

```json
{
  "success": false,
  "message": "Incorrect password."
}
```

---

#### Calcul de completion du profil (Student uniquement)

Le pourcentage de completion du profil est recalcule automatiquement a chaque mise a jour du profil.

| Critere | Poids |
|---------|-------|
| Avatar renseigne | 10% |
| Titre (headline) renseigne | 10% |
| Bio renseignee | 10% |
| Localisation renseignee | 5% |
| Telephone renseigne | 5% |
| 3 competences ou plus | 15% |
| 1 formation ou plus | 15% |
| 1 experience ou plus | 15% |
| 1 projet ou plus | 15% |
| **Total** | **100%** |

---

#### GET `/api/profiles/public/:username`

Acces public a un profil par nom d'utilisateur. Aucune authentification requise. Retourne le profil uniquement si `isPublic` est `true` (pour les etudiants).

---

### 6.3 Gestion des utilisateurs (`/api/users`) - Admin uniquement

| Methode | Route | Auth | Role | Description |
|---------|-------|------|------|-------------|
| GET | `/` | Oui | Admin | Lister tous les utilisateurs |
| GET | `/:id` | Oui | Admin | Recuperer un utilisateur par ID |
| PATCH | `/:id/status` | Oui | Admin | Activer/desactiver un utilisateur |

Ces endpoints sont reserves aux administrateurs et proteges par le middleware `authorize(UserRole.ADMIN)`.

---

## 7. Pipeline de middlewares

Les middlewares sont appliques dans l'ordre suivant dans `app.ts` :

| Ordre | Middleware | Description |
|-------|-----------|-------------|
| 1 | Desactivation ETag | `app.set('etag', false)` - Desactive la generation des ETags |
| 2 | Cache-Control | Ajoute `no-store, no-cache` sur toutes les routes `/api/*` |
| 3 | Helmet | Headers de securite (CSP, HSTS, X-Frame-Options, etc.) |
| 4 | CORS | Origine restreinte a l'URL du frontend, credentials actives |
| 5 | Compression | Compression gzip des reponses |
| 6 | Morgan | Logging HTTP (`dev` en developpement, `combined` en production) |
| 7 | Body parsers | JSON (limite 1 Mo) et URL-encoded |
| 8 | Rate limiter global | 100 requetes / 15 min par IP (10 000 en developpement) |
| 9 | Routes | Montage des routeurs (auth, profiles, users) |
| 10 | Handler 404 | Retourne une erreur 404 pour les routes non trouvees |
| 11 | Error handler global | Gestion centralisee de toutes les erreurs |

### Middleware d'authentification (`authenticate.ts`)

1. Extraction du Bearer token depuis le header `Authorization`.
2. Verification de la signature RS256 avec la cle publique.
3. Verification que l'utilisateur existe et que son compte est actif (`isActive`).
4. Attachement des informations utilisateur a la requete : `req.user = { userId, role, email }`.

### Middleware d'autorisation (`authorize.ts`)

Fonction factory qui accepte un ou plusieurs roles autorises :

```typescript
authorize(UserRole.STUDENT)
authorize(UserRole.ADMIN)
```

Verifie que `req.user.role` correspond a l'un des roles autorises. Retourne une erreur **403 Forbidden** si le role ne correspond pas.

### Rate limiters

| Limiteur | Limite (production) | Limite (developpement) | Fenetre |
|----------|--------------------|-----------------------|---------|
| Global | 100 requetes | 10 000 requetes | 15 minutes |
| Auth | 10 requetes | 100 requetes | 15 minutes |
| Password Reset | 3 requetes | 50 requetes | 1 heure |

Les limites sont appliquees par adresse IP.

---

## 8. Strategie de tokens

### Tableau recapitulatif

| Type de token | Format | Stockage | Expiration | Hashe en base |
|---------------|--------|----------|------------|---------------|
| Access Token | JWT RS256 | Memoire frontend | 15 minutes | Non (signe) |
| Refresh Token | UUID v4 | Cookie httpOnly + base de donnees | 7 jours | Oui (bcrypt) |
| Verification email | UUID v4 | Base de donnees (clair) | 24 heures | Non |
| Reset mot de passe | UUID v4 | Base de donnees (clair) | 1 heure | Non |
| Code 2FA | Nombre a 6 chiffres | Base de donnees (clair) | 10 minutes | Non |

### Access Token (JWT RS256)

- Signe avec la cle privee RSA, verifie avec la cle publique.
- Contient le `userId`, le `role` et l'`email` dans le payload.
- Stocke en memoire cote frontend (pas dans le localStorage ni les cookies).
- Duree de vie courte (15 minutes) pour limiter l'impact en cas de compromission.

### Refresh Token

- Genere sous forme d'UUID v4.
- Stocke en base de donnees sous forme hashee (bcrypt).
- Transmis au client via un cookie httpOnly, secure, sameSite strict.
- **Rotation** : a chaque utilisation du refresh token, l'ancien est invalide (`isUsed: true`) et un nouveau est genere. Ce mecanisme permet de detecter le vol de token (si un token deja utilise est presente, tous les tokens de l'utilisateur sont revoques).

### Nettoyage automatique des tokens

MongoDB supprime automatiquement les tokens expires grace a un **index TTL** sur le champ `expiresAt`. Aucune tache cron n'est necessaire.

---

## 9. Gestion des erreurs

La gestion des erreurs est centralisee dans le middleware `errorHandler.ts`. Tous les types d'erreurs sont interceptes et transformes en reponses standardisees.

| Type d'erreur | Code HTTP | Traitement |
|---------------|-----------|------------|
| `AppError` | Variable (selon `statusCode`) | Erreurs operationnelles personnalisees avec message et code HTTP |
| `ZodError` (validation) | 400 | Transformation en tableau d'erreurs par champ (`field` + `message`) |
| `Mongoose ValidationError` | 400 | Erreurs de validation de schema Mongoose |
| `Mongoose CastError` | 400 | `"Invalid ID format"` (ID MongoDB malformes) |
| MongoDB duplicate key (code 11000) | 409 | `"Duplicate value..."` (violation de contrainte d'unicite) |
| Erreurs inconnues | 500 | En production : message generique sans stack trace |

### Classe AppError

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

Les erreurs operationnelles (`isOperational: true`) sont des erreurs previsibles (utilisateur non trouve, token invalide, etc.). Les erreurs non operationnelles sont des bugs non anticipes et sont loggees avec leur stack trace en developpement.

### Wrapper asyncHandler

Tous les handlers de routes asynchrones sont enveloppes avec `asyncHandler` pour capturer automatiquement les rejets de promesses et les transmettre au middleware d'erreur global, evitant ainsi les blocs try/catch repetitifs.

---

## 10. Service email

Le service email utilise **Nodemailer** pour l'envoi de tous les emails transactionnels.

### Configuration

- Si les credentials SMTP sont configures (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), le transporteur utilise le serveur SMTP specifie.
- Si les credentials sont absents, le service se rabat sur un compte **Ethereal** de test et affiche l'URL de previsualisation dans la console.

### Templates d'emails

| Template | Contenu | Expiration |
|----------|---------|------------|
| **Email de verification** | HTML avec bouton et lien de verification | 24 heures |
| **Email de reinitialisation** | HTML avec bouton et lien de reinitialisation du mot de passe | 1 heure |
| **Email de code 2FA** | HTML avec affichage du code a 6 chiffres en grand format | 10 minutes |

Chaque template est un email HTML avec un design coherent incluant le branding ForMinds.

---

## 11. Variables d'environnement

| Variable | Valeur par defaut | Description |
|----------|-------------------|-------------|
| `NODE_ENV` | `development` | Environnement d'execution |
| `PORT` | `5001` | Port d'ecoute du serveur |
| `MONGODB_URI` | `mongodb://localhost:27017/forminds` | URI de connexion MongoDB |
| `JWT_PRIVATE_KEY_PATH` | `./keys/private.pem` | Chemin vers la cle privee RSA |
| `JWT_PUBLIC_KEY_PATH` | `./keys/public.pem` | Chemin vers la cle publique RSA |
| `JWT_ACCESS_EXPIRY` | `15m` | Duree de validite du token d'acces |
| `JWT_REFRESH_EXPIRY_DAYS` | `7` | Duree de validite du refresh token (jours) |
| `FRONTEND_URL` | `http://localhost:3000` | URL du frontend (pour CORS et liens emails) |
| `SMTP_HOST` | *(vide = Ethereal)* | Hote du serveur SMTP |
| `SMTP_PORT` | `587` | Port du serveur SMTP |
| `SMTP_USER` | *(vide)* | Utilisateur SMTP |
| `SMTP_PASS` | *(vide)* | Mot de passe SMTP |
| `SMTP_FROM` | `ForMinds <noreply@forminds.com>` | Adresse d'expediteur des emails |
| `UPLOAD_DIR` | `./uploads` | Repertoire de stockage des fichiers uploades |
| `MAX_FILE_SIZE` | `5242880` (5 Mo) | Taille maximale des fichiers uploades |

### Cles RSA

Les cles RSA sont necessaires pour la signature et la verification des JWT RS256. Elles doivent etre generees et placees dans le repertoire `keys/` :

```bash
# Generation de la cle privee
openssl genrsa -out keys/private.pem 2048

# Extraction de la cle publique
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

---

## 12. Mesures de securite

Le backend met en oeuvre les mesures de securite suivantes :

| # | Mesure | Description |
|---|--------|-------------|
| 1 | **Helmet** | Configure les headers de securite HTTP (Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, etc.) |
| 2 | **CORS** | Restreint les origines autorisees a l'URL du frontend uniquement, avec `credentials: true` pour permettre l'envoi des cookies |
| 3 | **Rate Limiting** | Trois niveaux de limitation : global (100/15min), authentification (10/15min), reinitialisation de mot de passe (3/h) |
| 4 | **Hashage des mots de passe** | bcrypt avec 12 rounds de salt pour un hashage resistant aux attaques par force brute |
| 5 | **JWT RS256** | Signature asymetrique des tokens JWT : la cle privee signe, la cle publique verifie. Permet de distribuer la cle publique sans compromettre la securite |
| 6 | **Cookies httpOnly** | Le refresh token est stocke dans un cookie httpOnly, secure (en production), sameSite strict, inaccessible au JavaScript cote client |
| 7 | **Rotation des tokens** | Les refresh tokens sont a usage unique. Chaque utilisation invalidate l'ancien et genere un nouveau token |
| 8 | **Nettoyage automatique** | L'index TTL de MongoDB supprime automatiquement les tokens expires |
| 9 | **Prevention de l'enumeration d'emails** | L'endpoint `forgot-password` retourne toujours un status 200, rendant impossible la detection de l'existence d'un compte |
| 10 | **Validation des entrees** | Schemas Zod sur tous les endpoints pour une validation stricte cote serveur |
| 11 | **Validation des uploads** | Verification du type MIME et de la taille des fichiers uploades |
| 12 | **Desactivation du cache API** | ETag desactive et header `Cache-Control: no-store` sur toutes les routes API pour empecher la mise en cache de donnees sensibles |
| 13 | **Confirmation par mot de passe** | La suppression de compte necessite la saisie du mot de passe actuel pour prevenir les suppressions accidentelles ou non autorisees |

---

## 13. Docker

Le fichier `Dockerfile.backend` utilise un build multi-etapes pour optimiser la taille de l'image et la securite.

### Etape 1 : Build

```dockerfile
FROM node:20-alpine AS build
# Installation des dependances
RUN npm ci
# Compilation TypeScript
RUN npm run build
```

### Etape 2 : Runtime

```dockerfile
FROM node:20-alpine
# Copie des fichiers necessaires
COPY dist/
COPY node_modules/
COPY keys/
# Creation d'un utilisateur non-root
USER appuser (UID 1001)
# Demarrage
CMD ["node", "dist/server.js"]
```

**Points cles** :

- L'image de base `node:20-alpine` est legere (environ 180 Mo).
- Le build multi-etapes separe les dependances de developpement du runtime.
- L'application s'execute en tant qu'utilisateur non-root (`appuser`, UID 1001) pour limiter les privileges en cas de compromission.
- Seuls les fichiers necessaires a l'execution sont copies dans l'image finale : le code compile (`dist/`), les dependances de production (`node_modules/`) et les cles RSA (`keys/`).

---

## Annexe : Script de seeding admin

Le script `scripts/seedAdmin.ts` permet de creer le compte administrateur initial. Il est execute manuellement ou au premier deploiement pour initialiser le systeme avec un utilisateur ayant le role `admin`.

---

*Document genere pour le Sprint 1 de la plateforme ForMinds.*
*Couvre les fonctionnalites BF-001 (Authentification & Gestion des Roles) et BF-002 partiel (Profils de base).*
