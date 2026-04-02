![][image1]

Code PFE: PFE2526\_DSI3\_42

AU : 2025-2026

**Cahier des Charges**

**Projet de Fin d'Études — Licence Technologies de l'Informatique**

| Titre du projet Conception et développement d’une Digital Community Engagement Platform (ForMinds) orientée networking professionnel, intégrant un système IA de matching profils–opportunités |
| ----- |

**Entreprise d'accueil :** WEVE Digital

**Réalisé par :**

Étudiant 1 : Yahya Somrani — Spécialité : DSI3

Étudiant 2 : Med Aziz Khedhri — Spécialité : DSI3

**Encadré par :**

ISET de Jendouba : Me. Chayma Sakouhi

Entreprise d'accueil : M. Oussama Ouertani

Institut Supérieur des Études Technologiques de Jendouba  
Campus universitaire — 8189 Jendouba du Nord  |  Tél : \+216 78 610 100

# **1\. Cadre et contexte du projet**

## **1.1 Cadre académique**

Ce projet s'inscrit dans le cadre du Projet de Fin d'Études pour l'obtention du diplôme de Licence Appliquée en Technologies de l'Informatique, spécialité Développement des Systèmes d'Information (DSI3), à l'ISET de Jendouba.

## **1.2 Contexte général**

L’écosystème de l’emploi, du networking professionnel et du développement des compétences en Tunisie et en Afrique reste fragmenté et peu structuré. 

Les étudiants et jeunes diplômés rencontrent plusieurs difficultés majeures :

* Difficulté à identifier des opportunités adaptées à leurs compétences réelles  
* Manque de visibilité et de crédibilité auprès des recruteurs  
* Processus de candidature long, répétitif et peu optimisé  
* Absence d’un réseau professionnel structuré (mentorat, événements, collaboration)  
* Accès limité à des expériences hybrides (digitales et terrain) favorisant des connexions durables

Du côté des entreprises, ONG et partenaires :

* Temps de recrutement long et coûteux  
* Difficulté à identifier des profils réellement engagés et actifs  
* Manque d’informations fiables sur les compétences techniques et comportementales  
* Absence d’une plateforme locale centralisée facilitant l’identification et l’activation des talents

Malgré la multiplication des plateformes digitales, les jeunes diplômés et étudiants manquent toujours d’un écosystème structuré leur permettant de développer un réseau professionnel actif, d’accéder à du mentorat et de transformer leurs compétences en opportunités concrètes.Les solutions existantes restent fragmentées :

* réseaux sociaux généralistes  
* plateformes d’emploi isolées  
* événements ponctuels sans continuité digitale

## **1.3 Problématique**

| Comment développer un MVP d’une plateforme communautaire intelligente permettant d’optimiser la mise en relation entre talents, experts et organisations, tout en intégrant un mécanisme de recommandation automatisé par l’intelligence artificielle favorisant la conversion de l’engagement digital en opportunités professionnelles réelles ? |
| :---- |

# **2\. Présentation du projet ForMinds**

## **2.1 Vision**

ForMinds est une Digital Community Engagement Platform dédiée à la structuration d’un écosystème professionnel intelligent et collaboratif.

Elle combine :

* un réseau communautaire digital (profils dynamiques, connexions, mentorat, événements hybrides)  
* un système intelligent de recommandation et de matching

L’objectif est de permettre à chaque utilisateur de :

* construire sa crédibilité à travers son engagement  
* développer un réseau professionnel actif  
* participer à des événements hybrides  
* accéder à des opportunités adaptées à son profil

ForMinds ne se limite pas au recrutement : elle transforme l’engagement communautaire en opportunités concrètes.

## **2.2 Objectifs**

Le projet vise à concevoir et développer un MVP web responsive intégrant les fonctionnalités essentielles suivantes :

Gestion des profils

* Création et gestion de profils utilisateurs (Étudiant, Recruteur, Expert)  
* Profil public dynamique avec portfolio  
* Indicateurs d’engagement et de complétion

Networking & Annuaire

* Système de connexions professionnelles  
* Annuaire intelligent filtrable  
* Historique d’interactions

Gestion des opportunités

* Publication d’opportunités (stages, projets, mentorat, événements)  
* Recherche et filtrage avancé  
* Candidature via la plateforme

 Matching intelligent

* Système de recommandation basé sur des critères définis

Administration & modération

* Validation des profils et rôles  
* Validation et modération des opportunités  
* Dashboard de gestion

Module événements hybrides

* Création et gestion d’événements

# **3\. Analyse des besoins fonctionnels**

## **3.1 BF-001 : Authentification & Gestion des rôles**

**Priorité : P0 — Critique**

Description : Le système doit permettre l'inscription, la connexion et la gestion des comptes avec support multi-rôles.

Fonctionnalités :

* Inscription par email avec vérification  
* Login / logout sécurisé  
* Réinitialisation de mot de passe sécurisée  
* Authentification à deux facteurs (2FA) par Email  
* Support multi-rôles (RBAC) : Étudiant, Recruteur, Admin  
* OAuth Google et LinkedIn (si temps disponible)

## **3.2 BF-002 : Profils utilisateurs, Portfolio & visibilité (ADN ForMinds)** 

**Priorité : P0 — Critique**

Description : Le système doit permettre la création de profils complets et publics, servant de base au networking et au matching IA.

 Fonctionnalités : 

* Profil Étudiant : infos, compétences (tags), éducation, expériences, projets Portfolio public partageable (URL profil public)   
* Ajout de projets : titre, description, technologies, lien (GitHub/Behance/Drive)   
* Upload CV (optionnel)   
* Profil Recruteur : entreprise, secteur, description, contact 

## **3.3 BF-003 : Networking professionnel (Connexions & annuaire)**

**Priorité : P1 — Haute**

Description : Le système doit permettre la création d’un réseau professionnel structuré pour soutenir l’employabilité. 

Fonctionnalités : 

* Demande de connexion / acceptation / suppression   
* Liste de connexions \+ suggestions simples (même domaine/skills)   
* Annuaire profils (recherche par skills, domaine, ville) 
* Minimal social feed (Like , comment , Gestion post (CRUD)) (Admin , Student , Recruter)


## **3.4 BF-004 : Gestion des opportunités & candidatures** 

**Priorité : P0 — Critique**

Description : Le système doit permettre la publication, la recherche et la candidature aux opportunités, en cohérence avec la dimension communautaire.

Fonctionnalités : 

* Publication d'opportunités (stages, emplois, bénévolat) par recruteurs   
* Recherche \+ filtres simples (localisation, domaine, type)   
* Candidature en un clic (profil pré-rempli)   
* Suivi des candidatures  
* Notifications email (optionnel si temps)


## **3.5 BF-005 : Matching IA (Opportunités \+ Explication)** 

**Priorité : P0 — Critique**

Description : Le système doit proposer des opportunités pertinentes à l’étudiant en s’appuyant sur un score IA explicable. 

Fonctionnalités : 

* Basé sur : similarité sémantique \+ règles simples (skills, localisation, type)   
* Page recommandations personnalisées 

## 

## **3.6 BF-006 : Gestion des événements hybrides**

**Priorité : P1 — Haute**

Description : Le système doit permettre l’organisation d’événements physiques/online et assurer le check-in même en absence de réseau.

Fonctionnalités : 

* Création d’événements (admin/recruteur) \+ infos \+ capacité   
* Génération QR code participant   
* Check-in QR 

## **3.7 BF-007 : Administration (validation & gouvernance)**  

**Priorité : P1 — Critique**

Description : Le système doit fournir des outils d’administration pour garantir la qualité et la confiance. 

Fonctionnalités : 

* Dashboard admin simple (utilisateurs, opportunités en attente, événements)   
* Validation opportunités : Approved/Rejected avec motif   
* Validation rôle recruteur (si besoin : justificatif entreprise)   
* Gestion utilisateurs : suspendre / réactiver   
* Journal minimal (audit log) des actions admin 


# 

# 

# 

# **4\. Besoins non fonctionnels**

## **4.1 Performance**

| ID | Fonctionnalité | Priorité |
| :---- | :---- | :---- |
| **BNF-P1** | Pages principales chargées en \< 3s (environnement de test) | **P1 \- Haute** |
| **BNF-P2** | Support 500 utilisateurs simultanés | **P1 \- Haute** |

## **4.2 Sécurité**

| ID | Fonctionnalité | Priorité |
| :---- | :---- | :---- |
| **BNF-S1** | Hash des mots de passe : bcrypt | **P0 \- Critique** |
| **BNF-S2** | JWT \+ refresh token (RS256)  | **P0 \- Critique** |
| **BNF-S3** | Rate limiting sur auth et endpoints critiques | **P0 \- Critique** |
| **BNF-S4** | RBAC strict par rôle | **P0 \- Critique** |
| **BNF-S5** | HTTPS / TLS 1.3 en production via NGINX | **P0 \- Critique** |

## **4.3 Qualité & testabilité**

| ID | Fonctionnalité | Priorité |
| :---- | :---- | :---- |
| **BNF-Q1** | Tests unitaires sur les endpoints API principaux (auth, opportunités, matching) | **P0 \- Critique** |
| **BNF-Q2** | Tests front de base (formulaires, navigation) | **P1 \- Haute** |
| **BNF-Q3** | CI/CD : lint \+ build \+ tests automatisés (GitHub Actions) | **P1 \- Haute** |

## **4.4 Utilisabilité**

* Interface responsive : mobile 320px, tablette 768px, desktop 1024px+

* Support Français / Anglais

* Compatible navigateurs modernes

# **5\. Architecture technique**

## **5.1 MERN Stack technologique**

| Couche | Technologie | Justification |
| :---- | :---- | :---- |
| **Frontend** | Next JS (React \+ TypeScript )  | Performances, typage, hot reload |
| **Backend** | [Node.js](http://Node.js) \+ Express.js | Architecture modulaire et scalable |
| **Base de données** | MongoDB |  |
| **Module IA** | FastAPI | Service IA isolé pour le matching intelligent, API haute performance |
| **Temps réel** | WebSocket | messagerie temps réel |
| **Déploiement** | Docker Compose \+ NGINX | Reproductible, reverse proxy, SSL |
| **CI/CD** | GitHub Actions | Automatisation lint/build/test |

# **6\. Méthodologie et planification**

## **6.1 Méthodologie Agile Scrum**

* Durée totale : 4 mois (Février – Mai 2026).

* 4 sprints

* Revue sprint à chaque fin de sprint : démo \+ rétrospective avec les encadrants.

## **6.2 Découpage des sprints**

| Sprint | Période | Objectifs & BF couverts |
| ----- | :---- | :---- |
| **S1** | Fév – mi-mars 2026 | Infrastructure Docker/NGINX/CI-CD, Auth complète (BF-001), Profils de base (BF-002 partiel) \+ Documentation of sprint |
| **S2** | Mi-mars – mi-avr 2026 | Profils complets \+ Portfolio (BF-002), Networking & Annuaire (BF-003), Opportunités & Candidatures (BF-004) \+ Documentation of sprint |
| **S3** | Mi-avr – mi-mai 2026 | Module IA Matching (BF-005), Événements \+ QR code \+ Documentation of sprint |
| **S4** | Mi-avr – mi-mai 2026 | (BF-007) \+ Documentation of sprint |

## 

[image1]: <data:image/png;base64,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>