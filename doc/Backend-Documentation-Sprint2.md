# Documentation Backend -- Sprint 2

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 2.0
**Date** : 07 mars 2026
**Sprint** : Sprint 2 -- BF-003 (Reseau Social, Fil d'actualite, Annuaire) + BF-004 (Opportunites, Candidatures)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 2)](#2-structure-du-projet-ajouts-sprint-2)
3. [Enums et constantes](#3-enums-et-constantes)
4. [Modeles de donnees (Mongoose)](#4-modeles-de-donnees-mongoose)
5. [Services (logique metier)](#5-services-logique-metier)
6. [Controllers et validation Zod](#6-controllers-et-validation-zod)
7. [Routes](#7-routes)
8. [Notifications email](#8-notifications-email)
9. [Montage dans app.ts](#9-montage-dans-appts)
10. [Recapitulatif des endpoints API](#10-recapitulatif-des-endpoints-api)
11. [Index MongoDB](#11-index-mongodb)
12. [Gestion des erreurs](#12-gestion-des-erreurs)
13. [Patterns transversaux](#13-patterns-transversaux)

---

## 1. Vue d'ensemble

Le Sprint 2 etend le backend ForMinds avec trois domaines fonctionnels couvrant deux blocs fonctionnels :

| Bloc fonctionnel | Perimetre Sprint 2 |
|---|---|
| **BF-003** -- Reseau social | Gestion des connexions (demandes, acceptation, suppression), suggestions de contacts, fil d'actualite (posts, likes, commentaires), annuaire de profils avec recherche et filtres |
| **BF-004** -- Opportunites | Publication d'opportunites (stages, emplois, benevolat) par les recruteurs, recherche/filtrage pour les etudiants, candidatures avec lettre de motivation, suivi des statuts |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouveaux modeles Mongoose | 6 |
| Nouveaux services | 5 |
| Nouveaux controllers | 5 |
| Nouveaux fichiers de routes | 5 |
| Nouveaux enums | 4 |
| Nouvelles methodes email | 3 |
| Fichiers existants modifies | 3 |
| Nouveaux endpoints API | 30 |
| **Total nouveaux fichiers** | **21** |

### Architecture maintenue

L'architecture reste identique au Sprint 1 : **Routes -> Controllers -> Services -> Models** avec middlewares transversaux (`authenticate`, `authorize`, `errorHandler`).

---

## 2. Structure du projet (ajouts Sprint 2)

```
backend/src/
├── models/
│   ├── Connection.ts          ← NOUVEAU
│   ├── Opportunity.ts         ← NOUVEAU
│   ├── Application.ts         ← NOUVEAU
│   ├── Post.ts                ← NOUVEAU
│   ├── Like.ts                ← NOUVEAU
│   └── Comment.ts             ← NOUVEAU
│
├── services/
│   ├── connection.service.ts  ← NOUVEAU
│   ├── opportunity.service.ts ← NOUVEAU
│   ├── application.service.ts ← NOUVEAU
│   ├── directory.service.ts   ← NOUVEAU
│   ├── post.service.ts        ← NOUVEAU
│   └── email.service.ts       ← MODIFIE (+3 methodes)
│
├── controllers/
│   ├── connection.controller.ts  ← NOUVEAU
│   ├── opportunity.controller.ts ← NOUVEAU
│   ├── application.controller.ts ← NOUVEAU
│   ├── directory.controller.ts   ← NOUVEAU
│   └── post.controller.ts        ← NOUVEAU
│
├── routes/
│   ├── connection.routes.ts    ← NOUVEAU
│   ├── opportunity.routes.ts   ← NOUVEAU
│   ├── application.routes.ts   ← NOUVEAU
│   ├── directory.routes.ts     ← NOUVEAU
│   └── post.routes.ts          ← NOUVEAU
│
├── utils/
│   └── constants.ts            ← MODIFIE (+4 enums)
│
└── app.ts                      ← MODIFIE (+5 routeurs)
```

---

## 3. Enums et constantes

Fichier : `backend/src/utils/constants.ts`

Quatre nouveaux enums ajoutes apres les constantes existantes :

### 3.1 ConnectionStatus

```typescript
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}
```

### 3.2 OpportunityType

```typescript
export enum OpportunityType {
  STAGE = 'stage',
  EMPLOI = 'emploi',
  BENEVOLAT = 'benevolat',
}
```

### 3.3 OpportunityStatus

```typescript
export enum OpportunityStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}
```

### 3.4 ApplicationStatus

```typescript
export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}
```

---

## 4. Modeles de donnees (Mongoose)

Tous les modeles suivent le pattern etabli au Sprint 1 : interface TypeScript `extends Document`, schema Mongoose avec `timestamps: true`, indexes explicites, export par defaut du modele.

### 4.1 Connection (`models/Connection.ts`)

**Interface :**

```typescript
export interface IConnection extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `senderId` | `ObjectId` ref `User` | required |
| `receiverId` | `ObjectId` ref `User` | required |
| `status` | `String` enum `ConnectionStatus` | default: `PENDING` |

**Indexes :**

| Index | Options |
|---|---|
| `{ senderId: 1, receiverId: 1 }` | `unique: true` |
| `{ receiverId: 1, status: 1 }` | -- |
| `{ senderId: 1, status: 1 }` | -- |

### 4.2 Opportunity (`models/Opportunity.ts`)

**Interface :**

```typescript
export interface IOpportunity extends Document {
  recruiterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: OpportunityType;
  location: string;
  domain: string;
  skills: string[];
  requirements?: string;
  deadline?: Date;
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `recruiterId` | `ObjectId` ref `User` | required |
| `title` | `String` | required, trim, maxlength: 200 |
| `description` | `String` | required, trim, maxlength: 5000 |
| `type` | `String` enum `OpportunityType` | required |
| `location` | `String` | required, trim |
| `domain` | `String` | required, trim |
| `skills` | `[String]` | default: [], lowercase via setter |
| `requirements` | `String` | trim, maxlength: 3000 |
| `deadline` | `Date` | optionnel |
| `status` | `String` enum `OpportunityStatus` | default: `PENDING` |

**Indexes :**

| Index |
|---|
| `{ recruiterId: 1 }` |
| `{ status: 1, type: 1 }` |
| `{ skills: 1 }` |
| `{ domain: 1 }` |
| `{ location: 1 }` |
| `{ createdAt: -1 }` |

### 4.3 Application (`models/Application.ts`)

**Interface :**

```typescript
export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  coverLetter?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `studentId` | `ObjectId` ref `User` | required |
| `opportunityId` | `ObjectId` ref `Opportunity` | required |
| `status` | `String` enum `ApplicationStatus` | default: `PENDING` |
| `coverLetter` | `String` | trim, maxlength: 3000 |
| `appliedAt` | `Date` | default: `Date.now` |

**Indexes :**

| Index | Options |
|---|---|
| `{ studentId: 1, opportunityId: 1 }` | `unique: true` |
| `{ opportunityId: 1, status: 1 }` | -- |
| `{ studentId: 1 }` | -- |

### 4.4 Post (`models/Post.ts`)

**Interface :**

```typescript
export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `authorId` | `ObjectId` ref `User` | required |
| `content` | `String` | required, trim, minlength: 1, maxlength: 2000 |
| `likesCount` | `Number` | default: 0 |
| `commentsCount` | `Number` | default: 0 |

**Indexes :**

| Index |
|---|
| `{ authorId: 1 }` |
| `{ createdAt: -1 }` |

### 4.5 Like (`models/Like.ts`)

**Interface :**

```typescript
export interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `userId` | `ObjectId` ref `User` | required |
| `postId` | `ObjectId` ref `Post` | required |

**Indexes :**

| Index | Options |
|---|---|
| `{ userId: 1, postId: 1 }` | `unique: true` |
| `{ postId: 1 }` | -- |

### 4.6 Comment (`models/Comment.ts`)

**Interface :**

```typescript
export interface IComment extends Document {
  authorId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `authorId` | `ObjectId` ref `User` | required |
| `postId` | `ObjectId` ref `Post` | required |
| `content` | `String` | required, trim, minlength: 1, maxlength: 1000 |

**Indexes :**

| Index |
|---|
| `{ postId: 1, createdAt: 1 }` |
| `{ authorId: 1 }` |

---

## 5. Services (logique metier)

Tous les services suivent le pattern etabli au Sprint 1 : fonctions asynchrones exportees nommees, types de retour `Promise<T>`, erreurs via `AppError`.

### 5.1 ConnectionService (`services/connection.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `sendRequest` | `senderId, receiverId` | `IConnection` | Verifie que sender !== receiver, pas de connexion existante, destinataire actif. Cree Connection status `pending`. |
| `respondToRequest` | `connectionId, userId, status` | `IConnection` | Verifie que userId === receiverId et status est `pending`. Met a jour le status. |
| `getConnections` | `userId, page?, limit?` | `{ connections, total }` | Liste des connexions `accepted` ou sender/receiver === userId. Populate user info. Pagination. |
| `getPendingRequests` | `userId, page?, limit?` | `{ connections, total }` | Demandes recues en attente (receiverId === userId, status `pending`). Populate sender. |
| `getSentRequests` | `userId, page?, limit?` | `{ connections, total }` | Demandes envoyees (senderId === userId, status `pending`). Populate receiver. |
| `getSuggestions` | `userId, limit?` | `Document[]` | Pipeline d'aggregation MongoDB : exclut les connexions existantes, joint les profils student/recruiter, calcule un score de pertinence base sur les skills et le secteur commun, trie par pertinence decroissante. Limite par defaut 10. |
| `removeConnection` | `connectionId, userId` | `void` | Verifie que userId est sender ou receiver. Supprime le document. |
| `getConnectionStatus` | `userId1, userId2` | `{ status, connectionId }` | Retourne le statut de la connexion ou `null` si aucune connexion. |

**Logique de suggestions :**

Le service utilise un pipeline `aggregate` MongoDB en 7 etapes :
1. `$match` : utilisateurs actifs, exclure les connexions existantes et l'utilisateur courant
2. `$lookup` : joindre `studentprofiles` et `recruiterprofiles`
3. `$addFields` : choisir le profil pertinent (student ou recruiter)
4. `$addFields` : calculer un `relevanceScore` (intersection des skills + bonus secteur commun)
5. `$sort` : par pertinence decroissante, puis par date de creation
6. `$limit` : limiter les resultats
7. `$project` : projeter les champs necessaires (nom, avatar, headline, location, companyName)

### 5.2 DirectoryService (`services/directory.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `searchProfiles` | `filters, userId, page?, limit?` | `{ profiles, total }` | Pipeline d'aggregation MongoDB avec filtres dynamiques. |

**Interface des filtres :**

```typescript
interface DirectoryFilters {
  skills?: string[];   // Intersection avec les skills du profil
  domain?: string;     // Regex sur sector ou field of study
  city?: string;       // Regex sur location
}
```

**Pipeline d'aggregation (10 etapes) :**

1. `$match` : utilisateurs actifs, exclure l'utilisateur courant
2. `$lookup` : joindre `studentprofiles`
3. `$lookup` : joindre `recruiterprofiles`
4. `$addFields` : selectionner le profil pertinent
5. `$match` : filtrer les profils publics (students) ou tout role (recruiter/admin)
6. `$match` (conditionnel) : filtre skills si fourni (`$in` sur skills en lowercase)
7. `$match` (conditionnel) : filtre domain si fourni (regex sur `sector` ou `education.field`)
8. `$match` (conditionnel) : filtre city si fourni (regex sur `location`)
9. `$project` : projection des champs (firstName, lastName, username, avatar, role, headline, location, skills, companyName, sector)
10. `$sort` + `$skip` + `$limit` : tri alphabetique + pagination

Le total est calcule separement via un pipeline `$count` pour permettre la pagination.

### 5.3 PostService (`services/post.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `createPost` | `authorId, content` | `IPost` | Cree un Post avec likesCount: 0, commentsCount: 0. |
| `updatePost` | `postId, userId, role, content` | `IPost` | Verifie ownership (authorId === userId) OU role === `admin`. |
| `deletePost` | `postId, userId, role` | `void` | Verifie ownership OU admin. **Suppression en cascade** : post + tous les Likes + tous les Comments associes (via `Promise.all`). |
| `getFeed` | `userId, page?, limit?` | `{ posts, total }` | Pipeline d'aggregation avec lookup `isLikedByMe`. |
| `getPost` | `postId` | `IPost` | Populate authorId (nom, avatar, username, role). |
| `likePost` | `userId, postId` | `ILike` | Verifie post existe + pas deja like. Cree Like. Incremente `Post.likesCount` (+1 via `$inc`). |
| `unlikePost` | `userId, postId` | `void` | Verifie Like existe. Supprime Like. Decremente `Post.likesCount` (-1 via `$inc`). |
| `addComment` | `authorId, postId, content` | `IComment` | Verifie post existe. Cree Comment. Incremente `Post.commentsCount` (+1). |
| `getComments` | `postId, page?, limit?` | `{ comments, total }` | Populate authorId. Tri `createdAt` ascendant. Pagination. |
| `deleteComment` | `commentId, userId, role` | `void` | Verifie ownership OU admin. Decremente `Post.commentsCount` (-1). |

**Pipeline du fil d'actualite (getFeed) :**

```
$sort(createdAt: -1) → $skip → $limit → $lookup(users) → $unwind(author)
→ $lookup(likes pour isLikedByMe) → $project(champs finaux)
```

Le lookup `isLikedByMe` utilise une sous-pipeline avec `$expr` pour verifier si un document Like existe pour le `postId` et le `userId` courant.

### 5.4 OpportunityService (`services/opportunity.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `createOpportunity` | `recruiterId, data` | `IOpportunity` | Cree avec status `pending`. |
| `updateOpportunity` | `opportunityId, recruiterId, data` | `IOpportunity` | Verifie ownership. Seules les opportunites non fermees sont modifiables. |
| `closeOpportunity` | `opportunityId, recruiterId` | `IOpportunity` | Verifie ownership. Met status a `closed`. |
| `getOpportunity` | `opportunityId` | `IOpportunity` | Populate recruiterId (nom, avatar, username). |
| `searchOpportunities` | `filters, page?, limit?` | `{ opportunities, total }` | Filtre par status `approved` (public), type, location (regex), domain (regex), skills (intersection). Tri `createdAt` desc. |
| `getRecruiterOpportunities` | `recruiterId, page?, limit?` | `{ opportunities, total }` | Toutes les opportunites du recruteur (tous statuts). |

**Interface des filtres :**

```typescript
interface OpportunityFilters {
  type?: string;       // Filtrage exact sur OpportunityType
  location?: string;   // Regex case-insensitive
  domain?: string;     // Regex case-insensitive
  skills?: string[];   // $in sur skills en lowercase
}
```

### 5.5 ApplicationService (`services/application.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `apply` | `studentId, opportunityId, coverLetter?` | `IApplication` | Verifie opportunite `approved` + deadline non depassee + pas deja postule. Cree Application. |
| `getStudentApplications` | `studentId, page?, limit?` | `{ applications, total }` | Populate opportunityId (title, type, location, domain) et recruiterId (nom, avatar). Tri `appliedAt` desc. |
| `getOpportunityApplications` | `opportunityId, recruiterId, page?, limit?` | `{ applications, total }` | Verifie ownership de l'opportunite. Populate studentId (nom, avatar, email). |
| `updateApplicationStatus` | `applicationId, recruiterId, status` | `IApplication` | Verifie ownership de l'opportunite liee. Met a jour status. |
| `getApplication` | `applicationId` | `IApplication` | Populate student et opportunite avec toutes les references. |

**Validations metier du `apply` :**

1. L'opportunite doit exister
2. L'opportunite doit etre en status `approved`
3. La deadline ne doit pas etre depassee (si definie)
4. L'etudiant ne doit pas avoir deja postule (index unique `studentId + opportunityId`)

---

## 6. Controllers et validation Zod

Tous les controllers suivent le pattern etabli au Sprint 1 : schemas Zod definis en haut du fichier, handlers wrapes dans `asyncHandler()`, validation inline via `schema.parse(req.body)`, reponses au format `ApiResponse`.

### 6.1 ConnectionController (`controllers/connection.controller.ts`)

**Schemas Zod :**

```typescript
const sendRequestSchema = z.object({
  receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
});

const respondRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});
```

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `sendRequest` | POST | `/request` | `sendRequestSchema` (body) | 201 |
| `respondToRequest` | PATCH | `/:connectionId` | `respondRequestSchema` (body) | 200 |
| `getConnections` | GET | `/` | query: page, limit | 200 |
| `getPendingRequests` | GET | `/pending` | query: page, limit | 200 |
| `getSentRequests` | GET | `/sent` | query: page, limit | 200 |
| `getSuggestions` | GET | `/suggestions` | query: limit | 200 |
| `removeConnection` | DELETE | `/:connectionId` | params: connectionId | 200 |
| `getConnectionStatus` | GET | `/status/:userId` | params: userId | 200 |

**Pagination :**

Les handlers de liste retournent un objet `pagination` standardise :

```typescript
pagination: {
  page: number,
  limit: number,
  total: number,
  totalPages: number,   // Math.ceil(total / limit)
}
```

### 6.2 DirectoryController (`controllers/directory.controller.ts`)

**Handlers :**

| Handler | HTTP | Route | Query params | Status |
|---|---|---|---|---|
| `searchProfiles` | GET | `/` | `skills` (comma-separated), `domain`, `city`, `page`, `limit` | 200 |

La decomposition des skills depuis la query string :

```typescript
const skills = req.query.skills
  ? (req.query.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
  : undefined;
```

### 6.3 PostController (`controllers/post.controller.ts`)

**Schemas Zod :**

```typescript
const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(2000),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});
```

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `createPost` | POST | `/` | `createPostSchema` (body) | 201 |
| `getFeed` | GET | `/` | query: page, limit | 200 |
| `getPost` | GET | `/:postId` | params: postId | 200 |
| `updatePost` | PATCH | `/:postId` | `updatePostSchema` (body) | 200 |
| `deletePost` | DELETE | `/:postId` | params: postId | 200 |
| `likePost` | POST | `/:postId/like` | params: postId | 201 |
| `unlikePost` | DELETE | `/:postId/like` | params: postId | 200 |
| `addComment` | POST | `/:postId/comments` | `createCommentSchema` (body) | 201 |
| `getComments` | GET | `/:postId/comments` | query: page, limit | 200 |
| `deleteComment` | DELETE | `/:postId/comments/:commentId` | params: postId, commentId | 200 |

### 6.4 OpportunityController (`controllers/opportunity.controller.ts`)

**Schemas Zod :**

```typescript
const createOpportunitySchema = z.object({
  title:        z.string().min(1).max(200),
  description:  z.string().min(1).max(5000),
  type:         z.enum(['stage', 'emploi', 'benevolat']),
  location:     z.string().min(1),
  domain:       z.string().min(1),
  skills:       z.array(z.string()).optional().default([]),
  requirements: z.string().max(3000).optional(),
  deadline:     z.string().datetime().optional(),
});

const updateOpportunitySchema = createOpportunitySchema.partial();
```

**Note :** Le champ `deadline` arrive en ISO string et est converti en `Date` dans le controller avant d'etre passe au service.

**Handlers :**

| Handler | HTTP | Route | Auth | Role | Status |
|---|---|---|---|---|---|
| `createOpportunity` | POST | `/` | Oui | Recruiter | 201 |
| `updateOpportunity` | PATCH | `/:opportunityId` | Oui | Recruiter | 200 |
| `closeOpportunity` | PATCH | `/:opportunityId/close` | Oui | Recruiter | 200 |
| `getOpportunity` | GET | `/:opportunityId` | Non | -- | 200 |
| `searchOpportunities` | GET | `/` | Non | -- | 200 |
| `getRecruiterOpportunities` | GET | `/mine` | Oui | Recruiter | 200 |

### 6.5 ApplicationController (`controllers/application.controller.ts`)

**Schemas Zod :**

```typescript
const applySchema = z.object({
  opportunityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  coverLetter:   z.string().max(3000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['reviewed', 'shortlisted', 'accepted', 'rejected']),
});
```

**Handlers :**

| Handler | HTTP | Route | Auth | Role | Status |
|---|---|---|---|---|---|
| `apply` | POST | `/` | Oui | Student | 201 |
| `getStudentApplications` | GET | `/mine` | Oui | Student | 200 |
| `getOpportunityApplications` | GET | `/opportunity/:oppId` | Oui | Recruiter | 200 |
| `updateApplicationStatus` | PATCH | `/:applicationId/status` | Oui | Recruiter | 200 |
| `getApplication` | GET | `/:applicationId` | Oui | Student/Recruiter | 200 |

---

## 7. Routes

### 7.1 Connection Routes (`routes/connection.routes.ts`)

**Prefixe** : `/api/connections`

```
POST   /request              → authenticate → sendRequest
GET    /                     → authenticate → getConnections
GET    /pending              → authenticate → getPendingRequests
GET    /sent                 → authenticate → getSentRequests
GET    /suggestions          → authenticate → getSuggestions
GET    /status/:userId       → authenticate → getConnectionStatus
PATCH  /:connectionId        → authenticate → respondToRequest
DELETE /:connectionId        → authenticate → removeConnection
```

Toutes les routes sont authentifiees, sans restriction de role.

### 7.2 Directory Routes (`routes/directory.routes.ts`)

**Prefixe** : `/api/profiles/directory`

```
GET    /                     → authenticate → searchProfiles
```

### 7.3 Post Routes (`routes/post.routes.ts`)

**Prefixe** : `/api/posts`

```
POST   /                           → authenticate → createPost
GET    /                           → authenticate → getFeed
GET    /:postId                    → authenticate → getPost
PATCH  /:postId                    → authenticate → updatePost
DELETE /:postId                    → authenticate → deletePost
POST   /:postId/like               → authenticate → likePost
DELETE /:postId/like               → authenticate → unlikePost
POST   /:postId/comments           → authenticate → addComment
GET    /:postId/comments           → authenticate → getComments
DELETE /:postId/comments/:commentId → authenticate → deleteComment
```

Toutes les routes sont authentifiees, sans restriction de role. L'autorisation auteur/admin est geree dans le service.

### 7.4 Opportunity Routes (`routes/opportunity.routes.ts`)

**Prefixe** : `/api/opportunities`

```
GET    /                     → searchOpportunities          (public)
GET    /mine                 → authenticate → authorize(RECRUITER) → getRecruiterOpportunities
POST   /                     → authenticate → authorize(RECRUITER) → createOpportunity
GET    /:opportunityId       → getOpportunity               (public)
PATCH  /:opportunityId       → authenticate → authorize(RECRUITER) → updateOpportunity
PATCH  /:opportunityId/close → authenticate → authorize(RECRUITER) → closeOpportunity
```

**Important** : `/mine` est place AVANT `/:opportunityId` pour eviter le conflit de parametres Express.

### 7.5 Application Routes (`routes/application.routes.ts`)

**Prefixe** : `/api/applications`

```
POST   /                           → authenticate → authorize(STUDENT)   → apply
GET    /mine                       → authenticate → authorize(STUDENT)   → getStudentApplications
GET    /opportunity/:oppId         → authenticate → authorize(RECRUITER) → getOpportunityApplications
GET    /:applicationId             → authenticate → getApplication
PATCH  /:applicationId/status      → authenticate → authorize(RECRUITER) → updateApplicationStatus
```

---

## 8. Notifications email

Fichier : `backend/src/services/email.service.ts`

Trois nouvelles methodes ajoutees, suivant le pattern existant (HTML inline, preview URL en dev, transporter via Ethereal en dev) :

### 8.1 sendConnectionNotification

```typescript
sendConnectionNotification(
  email: string,
  firstName: string,
  senderName: string
): Promise<void>
```

Notifie l'utilisateur d'une nouvelle demande de connexion. Inclut un bouton CTA vers `/network`.

### 8.2 sendApplicationNotification

```typescript
sendApplicationNotification(
  email: string,
  opportunityTitle: string,
  applicantName: string
): Promise<void>
```

Notifie le recruteur d'une nouvelle candidature sur son opportunite. Inclut le titre de l'opportunite et un bouton CTA vers `/opportunities`.

### 8.3 sendApplicationStatusUpdate

```typescript
sendApplicationStatusUpdate(
  email: string,
  firstName: string,
  opportunityTitle: string,
  status: string
): Promise<void>
```

Notifie l'etudiant d'un changement de statut de sa candidature. Affiche le nouveau statut de maniere proeminente avec un mapping lisible : `reviewed` → `Reviewed`, `shortlisted` → `Shortlisted`, `accepted` → `Accepted`, `rejected` → `Rejected`.

---

## 9. Montage dans app.ts

Fichier : `backend/src/app.ts`

Cinq nouveaux routeurs montes apres les routeurs Sprint 1 :

```typescript
import connectionRoutes from './routes/connection.routes';
import opportunityRoutes from './routes/opportunity.routes';
import applicationRoutes from './routes/application.routes';
import directoryRoutes from './routes/directory.routes';
import postRoutes from './routes/post.routes';

// Dans la section routes
app.use('/api/connections', connectionRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profiles/directory', directoryRoutes);
app.use('/api/posts', postRoutes);
```

**Ordre de montage complet :**

| # | Prefixe | Routeur |
|---|---|---|
| 1 | `/api/health` | healthRoutes |
| 2 | `/api/auth` | authRoutes |
| 3 | `/api/profiles` | profileRoutes |
| 4 | `/api/users` | userRoutes |
| 5 | `/api/connections` | connectionRoutes |
| 6 | `/api/opportunities` | opportunityRoutes |
| 7 | `/api/applications` | applicationRoutes |
| 8 | `/api/profiles/directory` | directoryRoutes |
| 9 | `/api/posts` | postRoutes |

**Note** : Le routeur directory est monte sous `/api/profiles/directory`, qui est un sous-chemin du routeur profile monte sur `/api/profiles`. Express gere cela correctement car les routes plus specifiques sont evaluees en premier.

---

## 10. Recapitulatif des endpoints API

### 10.1 Connections (`/api/connections`) -- 8 endpoints

| # | Methode | Route | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/request` | Oui | Envoyer une demande de connexion |
| 2 | GET | `/` | Oui | Lister ses connexions acceptees |
| 3 | GET | `/pending` | Oui | Lister les demandes recues en attente |
| 4 | GET | `/sent` | Oui | Lister les demandes envoyees |
| 5 | GET | `/suggestions` | Oui | Obtenir des suggestions de connexion |
| 6 | GET | `/status/:userId` | Oui | Verifier le statut avec un utilisateur |
| 7 | PATCH | `/:connectionId` | Oui | Accepter ou refuser une demande |
| 8 | DELETE | `/:connectionId` | Oui | Supprimer une connexion |

### 10.2 Directory (`/api/profiles/directory`) -- 1 endpoint

| # | Methode | Route | Auth | Description |
|---|---|---|---|---|
| 1 | GET | `/` | Oui | Rechercher dans l'annuaire des profils |

### 10.3 Posts / Social Feed (`/api/posts`) -- 10 endpoints

| # | Methode | Route | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/` | Oui | Creer un post |
| 2 | GET | `/` | Oui | Consulter le fil d'actualite (pagine) |
| 3 | GET | `/:postId` | Oui | Voir un post |
| 4 | PATCH | `/:postId` | Oui | Modifier son post (auteur/admin) |
| 5 | DELETE | `/:postId` | Oui | Supprimer un post (auteur/admin) |
| 6 | POST | `/:postId/like` | Oui | Liker un post |
| 7 | DELETE | `/:postId/like` | Oui | Retirer son like |
| 8 | POST | `/:postId/comments` | Oui | Commenter un post |
| 9 | GET | `/:postId/comments` | Oui | Lister les commentaires d'un post |
| 10 | DELETE | `/:postId/comments/:commentId` | Oui | Supprimer un commentaire (auteur/admin) |

### 10.4 Opportunities (`/api/opportunities`) -- 6 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | GET | `/` | Non | -- | Rechercher des opportunites (public) |
| 2 | GET | `/mine` | Oui | Recruiter | Lister ses propres opportunites |
| 3 | POST | `/` | Oui | Recruiter | Creer une opportunite |
| 4 | GET | `/:opportunityId` | Non | -- | Voir le detail d'une opportunite |
| 5 | PATCH | `/:opportunityId` | Oui | Recruiter | Modifier une opportunite |
| 6 | PATCH | `/:opportunityId/close` | Oui | Recruiter | Fermer une opportunite |

### 10.5 Applications (`/api/applications`) -- 5 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | POST | `/` | Oui | Student | Postuler a une opportunite |
| 2 | GET | `/mine` | Oui | Student | Suivi de ses candidatures |
| 3 | GET | `/opportunity/:oppId` | Oui | Recruiter | Candidatures recues pour une offre |
| 4 | GET | `/:applicationId` | Oui | Student/Recruiter | Detail d'une candidature |
| 5 | PATCH | `/:applicationId/status` | Oui | Recruiter | Changer le statut d'une candidature |

### Total Sprint 2 : 30 nouveaux endpoints

---

## 11. Index MongoDB

Resume de tous les index crees par les modeles Sprint 2 :

| Collection | Index | Type | Objectif |
|---|---|---|---|
| `connections` | `{ senderId, receiverId }` | Unique | Empecher les doublons |
| `connections` | `{ receiverId, status }` | Compose | Requetes demandes recues |
| `connections` | `{ senderId, status }` | Compose | Requetes demandes envoyees |
| `opportunities` | `{ recruiterId }` | Simple | Requetes par recruteur |
| `opportunities` | `{ status, type }` | Compose | Recherche filtree |
| `opportunities` | `{ skills }` | Multi-key | Recherche par competences |
| `opportunities` | `{ domain }` | Simple | Recherche par domaine |
| `opportunities` | `{ location }` | Simple | Recherche par localisation |
| `opportunities` | `{ createdAt }` | Desc (-1) | Tri chronologique |
| `applications` | `{ studentId, opportunityId }` | Unique | Empecher les doublons |
| `applications` | `{ opportunityId, status }` | Compose | Requetes recruteur |
| `applications` | `{ studentId }` | Simple | Requetes etudiant |
| `posts` | `{ authorId }` | Simple | Requetes par auteur |
| `posts` | `{ createdAt }` | Desc (-1) | Tri fil d'actualite |
| `likes` | `{ userId, postId }` | Unique | Empecher les doublons |
| `likes` | `{ postId }` | Simple | Comptage par post |
| `comments` | `{ postId, createdAt }` | Compose | Liste commentaires tries |
| `comments` | `{ authorId }` | Simple | Requetes par auteur |

**Total : 18 index** (dont 3 uniques)

---

## 12. Gestion des erreurs

Les erreurs metier sont gerees via `AppError` avec des codes HTTP semantiques :

| Code HTTP | Utilisation |
|---|---|
| `400` | Validation echouee, operation invalide (ex: modifier une opportunite fermee, deadline depassee) |
| `401` | Authentification requise (`req.user` manquant) |
| `403` | Autorisation refusee (ex: modifier le post d'un autre, repondre a une demande non recue) |
| `404` | Ressource introuvable (ex: connexion, post, opportunite) |
| `409` | Conflit / doublon (ex: connexion deja existante, deja like, deja postule) |

Les erreurs Zod (`ZodError`) sont interceptees par le `errorHandler` global existant et formatees en reponse `ApiResponse` avec le detail des champs invalides.

---

## 13. Patterns transversaux

### 13.1 Format de reponse

Toutes les reponses suivent l'interface `ApiResponse<T>` :

```typescript
{
  success: boolean;
  message: string;
  data?: {
    [entity]: T;           // Ex: { connection }, { post }, { opportunity }
    pagination?: {         // Present sur les listes
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### 13.2 Pagination

Toutes les listes supportent la pagination via query params `page` (defaut: 1) et `limit` (defaut: 20). Le calcul se fait via :

```typescript
const skip = (page - 1) * limit;
const totalPages = Math.ceil(total / limit);
```

### 13.3 Populate conditionnel

Les references ObjectId sont ressolues (`populate`) avec des projections minimales pour limiter la taille des reponses :

| Reference | Champs populated |
|---|---|
| `senderId` / `receiverId` | `firstName lastName username avatar role` |
| `authorId` (posts/comments) | `firstName lastName username avatar role` |
| `recruiterId` | `firstName lastName username avatar` |
| `studentId` | `firstName lastName username avatar email` |
| `opportunityId` | `title type location domain recruiterId` |

### 13.4 Ownership et autorisation

L'autorisation se fait a deux niveaux :

1. **Middleware `authorize()`** : verification du role au niveau de la route (Student, Recruiter)
2. **Service** : verification de l'ownership au niveau metier (ex: `post.authorId === userId`, `opportunity.recruiterId === recruiterId`)

Les admins ont un bypass dans les services du social feed : `role === 'admin'` permet de modifier/supprimer tout post ou commentaire.

### 13.5 Suppression en cascade

La suppression d'un Post declenche la suppression de toutes ses ressources dependantes :

```
deletePost(postId) → Promise.all([
  Post.findByIdAndDelete(postId),
  Like.deleteMany({ postId }),
  Comment.deleteMany({ postId }),
])
```

### 13.6 Compteurs atomiques

Les compteurs `likesCount` et `commentsCount` du modele Post sont mis a jour via l'operateur MongoDB `$inc` pour eviter les conditions de concurrence :

```typescript
await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
```

---

*Documentation generee pour le Sprint 2 Backend de la plateforme ForMinds.*
