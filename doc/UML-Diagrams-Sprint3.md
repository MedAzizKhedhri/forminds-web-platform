# Diagrammes UML — ForMinds Platform (Sprint 3)

---

## 1. Diagramme de Cas d'Utilisation — Sprint 3

Sprint 3 couvre : **BF-005 (Matching IA)** + **BF-006 (Evenements Hybrides & QR Code)**

```plantuml
@startuml UC_Sprint3
!theme plain
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseBackgroundColor #E8EAF6
skinparam usecaseBorderColor #283593
skinparam actorBackgroundColor #FFCC00
left to right direction

actor "Etudiant" as student
actor "Recruteur" as recruiter
actor "Service IA\n(FastAPI)" as ai <<system>>
actor "Service Email\n(Nodemailer)" as email <<system>>

rectangle "ForMinds — Sprint 3" {

  package "BF-005 : Matching IA" {
    usecase "Obtenir recommandations\npersonnalisees" as UC_GET_RECO
    usecase "Calculer score\nde matching" as UC_CALC_SCORE
    usecase "Consulter detail\ndu matching" as UC_VIEW_MATCH
    usecase "Rafraichir\nrecommandations" as UC_REFRESH_RECO
  }

  package "BF-006 : Evenements Hybrides" {
    usecase "Creer un evenement" as UC_CREATE_EVENT
    usecase "Modifier un evenement" as UC_EDIT_EVENT
    usecase "Annuler un evenement" as UC_CANCEL_EVENT
    usecase "Supprimer un evenement" as UC_DELETE_EVENT
    usecase "Consulter liste\nevenements" as UC_LIST_EVENTS
    usecase "Consulter detail\nevenement" as UC_VIEW_EVENT
    usecase "S'inscrire a\nun evenement" as UC_REGISTER_EVENT
    usecase "Annuler son\ninscription" as UC_CANCEL_REGISTRATION
    usecase "Consulter mes\ntickets" as UC_MY_TICKETS
    usecase "Generer QR Code\nparticipant" as UC_GEN_QR
    usecase "Check-in QR\n(scanner)" as UC_QR_CHECKIN
    usecase "Consulter liste\nparticipants" as UC_LIST_PARTICIPANTS
  }

}

' --- Etudiant ---
student --> UC_GET_RECO
student --> UC_VIEW_MATCH
student --> UC_REFRESH_RECO
student --> UC_LIST_EVENTS
student --> UC_VIEW_EVENT
student --> UC_REGISTER_EVENT
student --> UC_CANCEL_REGISTRATION
student --> UC_MY_TICKETS
student --> UC_GEN_QR

' --- Recruteur ---
recruiter --> UC_CREATE_EVENT
recruiter --> UC_EDIT_EVENT
recruiter --> UC_CANCEL_EVENT
recruiter --> UC_DELETE_EVENT
recruiter --> UC_LIST_EVENTS
recruiter --> UC_VIEW_EVENT
recruiter --> UC_LIST_PARTICIPANTS
recruiter --> UC_QR_CHECKIN

' --- Relations ---
UC_GET_RECO ..> ai : <<include>>\nAppel moteur IA
UC_CALC_SCORE ..> ai : <<include>>\nCalcul similarite
UC_GET_RECO ..> UC_CALC_SCORE : <<include>>

UC_REGISTER_EVENT ..> email : <<extend>>\nConfirmation inscription
UC_CANCEL_EVENT ..> email : <<include>>\nNotification participants
UC_QR_CHECKIN ..> UC_GEN_QR : <<extend>>
UC_DELETE_EVENT ..> UC_CANCEL_EVENT : <<include>>

@enduml
```

---

## 2. Diagrammes de Sequence — Sprint 3

### 2.1 Obtenir des Recommandations Personnalisees (BF-005)

```plantuml
@startuml SEQ_GetRecommendations
!theme plain
skinparam sequenceMessageAlign center

actor Etudiant as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Service IA\n(FastAPI)" as ai

user -> front : Naviguer vers /recommendations
front -> api : GET /api/matching/recommendations\n?limit=10\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw -> mw : Verifier JWT (RS256)
mw -> db : Verifier User existe et actif
mw --> api : req.user = {userId, role}

api -> mw : authorize(STUDENT)
alt Role !== student
  mw --> front : 403 {success: false,\nmessage: "Forbidden"}
  front --> user : Afficher erreur
else Role autorise
  api -> db : Chercher StudentProfile\npar userId\n(skills, location, education,\nexperiences)

  alt Profil non trouve ou skills vide
    api --> front : 400 {success: false,\nmessage: "Please complete your\nprofile to get recommendations"}
    front --> user : Afficher message\n+ lien vers /profile
  else Profil valide
    api -> db : Chercher Opportunities\n{status: "approved",\ndeadline >= now ou null}

    alt Aucune opportunite disponible
      api --> front : 200 {success: true,\ndata: {\n  recommendations: [],\n  total: 0\n}}
      front --> user : Afficher message\n"Aucune recommandation"
    else Opportunites trouvees
      api -> ai : POST /api/match\n{\n  student: {skills, location,\n    education, experiences},\n  opportunities: [{id, title,\n    skills, location, domain,\n    type, requirements}]\n}

      ai -> ai : Calculer similarite semantique\n(TF-IDF / embeddings)\n+ regles metier\n(skills match, location match,\ndomain match)

      ai -> ai : Generer score pour\nchaque opportunite\n(0-100%)

      ai --> api : 200 {\n  matches: [\n    {opportunityId, score,\n     breakdown: {\n       skillsScore,\n       locationScore,\n       domainScore\n     },\n     explanation}\n  ]\n}

      note right of api
        Fallback deterministe si
        service IA indisponible :
        - Skills: intersection / Jaccard
        - Location: exact match
        - Domain: score fixe (50%)
      end note

      api -> api : Trier par score desc\n+ limiter resultats

      api -> db : Populate opportunites\n(title, type, location,\ndomain, recruiterId ->\nfirstName, lastName,\nusername, avatar)

      api --> front : 200 {success: true,\ndata: {\n  recommendations: [...],\n  total\n}}

      front --> user : Afficher liste de cartes :\ntitre opportunite, recruteur,\ntype (badge), score (%),\nbarres de progression,\nexplication du matching,\nboutons "Voir detail"\net "Postuler"
    end
  end
end

@enduml
```

### 2.2 Consulter le Detail du Matching (BF-005)

```plantuml
@startuml SEQ_ViewMatchDetail
!theme plain
skinparam sequenceMessageAlign center

actor Etudiant as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Service IA\n(FastAPI)" as ai

user -> front : Cliquer "Voir detail"\nsur une recommandation
front -> api : GET /api/matching/score/:opportunityId\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(STUDENT)
mw --> api : req.user = {userId, role}

api -> db : Chercher StudentProfile par userId

alt Profil non trouve ou skills vide
  api --> front : 400 {success: false,\nmessage: "Please complete your\nprofile to get recommendations"}
  front --> user : Afficher erreur
else Profil valide
  api -> db : Chercher Opportunity par _id\n+ populate recruiterId

  alt Opportunite non trouvee
    api --> front : 404 {success: false,\nmessage: "Opportunity not found"}
    front --> user : Afficher erreur
  else Opportunite trouvee
    api -> ai : POST /api/match/score\n{\n  student: {skills, location,\n    education, experiences},\n  opportunity: {title, skills,\n    location, domain, type,\n    requirements}\n}

    ai -> ai : Calcul detaille du matching :\n1. Skills overlap (Jaccard)\n2. Location proximity\n3. Domain relevance\n4. Experience fit

    ai --> api : 200 {\n  overallScore: 85,\n  breakdown: {\n    skillsScore: 90,\n    locationScore: 80,\n    domainScore: 85,\n    experienceScore: 80\n  },\n  matchedSkills: ["react", "node"],\n  missingSkills: ["docker"],\n  explanation: "Strong match based\n  on technical skills."\n}

    api --> front : 200 {success: true,\ndata: {\n  opportunity,\n  matching: {\n    overallScore,\n    breakdown,\n    matchedSkills,\n    missingSkills,\n    explanation\n  }\n}}

    front --> user : Afficher page detail :\n- Fiche opportunite\n- Jauge score global (%)\n- Barres de progression\n  par critere (skills,\n  location, domain, experience)\n- Skills correspondants (vert)\n- Skills manquants (rouge)\n- Explication textuelle IA\n- Bouton "Postuler"
  end
end

@enduml
```

### 2.3 Creer un Evenement (BF-006 — Recruteur)

```plantuml
@startuml SEQ_CreateEvent
!theme plain
skinparam sequenceMessageAlign center

actor Recruteur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /events/create\nRemplir formulaire :\ntitle, description, type,\nlocation, date, startTime,\nendTime, capacity, isOnline,\nmeetingUrl (si online),\nimage (upload optionnel)
front -> front : Validation Zod cote client

alt Image selectionnee
  front -> api : POST /api/events/upload-image\n(multipart/form-data)\n(Authorization: Bearer <token>)
  api --> front : 200 {data: {imageUrl}}
end

front -> api : POST /api/events\n{title, description, type,\nlocation, date, startTime,\nendTime, capacity, isOnline,\nmeetingUrl, image}\n(Authorization: Bearer <token>)

api -> mw : authenticate\n+ authorize(RECRUITER)
alt Role non autorise
  mw --> front : 403 {success: false,\nmessage: "Forbidden"}
  front --> user : Afficher erreur
else Role autorise
  mw --> api : req.user = {userId, role}
  api -> api : Validation Zod cote serveur\n(title 1-200 chars,\ndescription 1-5000 chars,\ntype enum EventType,\ncapacity >= 1)

  alt Donnees invalides
    api --> front : 400 {success: false,\nerrors: [{field, message}]}
    front --> user : Afficher erreurs de validation
  else Donnees valides
    api -> db : Creer Event\n{organizerId: req.user.userId,\ntitle, description, type,\nlocation, date, startTime,\nendTime, capacity,\nregisteredCount: 0,\nisOnline, meetingUrl, image,\nstatus: "pending"}
    db --> api : Event cree
    api --> front : 201 {success: true,\nmessage: "Event created",\ndata: {event}}
    front --> user : Rediriger vers\n/events/mine\n+ toast succes
  end
end

@enduml
```

### 2.4 S'inscrire a un Evenement (BF-006 — Etudiant)

```plantuml
@startuml SEQ_RegisterEvent
!theme plain
skinparam sequenceMessageAlign center

actor Etudiant as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Consulter detail evenement\n(/events/:id)
front -> api : GET /api/events/:eventId
api -> db : Chercher Event par _id\n+ populate organizerId
db --> api : Event
api --> front : 200 {data: {event}}
front --> user : Afficher detail evenement\navec bouton "S'inscrire"

user -> front : Cliquer "S'inscrire"
front -> api : POST /api/events/:eventId/register\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Event par _id
alt Evenement non trouve
  api --> front : 404 {success: false,\nmessage: "Event not found"}
  front --> user : Afficher erreur
else Evenement trouve
  alt event.status !== "upcoming"
    api --> front : 400 {success: false,\nmessage: "Event is not open\nfor registration"}
    front --> user : Afficher erreur
  else Evenement ouvert (upcoming)
    alt event.date < now
      api --> front : 400 {success: false,\nmessage: "Event has already passed"}
      front --> user : Afficher erreur
    else Date valide
      api -> db : Chercher Registration existante\n{eventId, userId}
      alt Registration existante et active
        api --> front : 409 {success: false,\nmessage: "Already registered\nfor this event"}
        front --> user : Afficher erreur
      else Pas d'inscription active
        api -> api : Verifier capacite\n(registeredCount < capacity)
        alt Capacite atteinte
          api --> front : 400 {success: false,\nmessage: "Event is full"}
          front --> user : Afficher erreur
        else Places disponibles
          api -> db : Creer Registration\n{eventId, userId,\nstatus: "registered",\nqrCode: uuid(),\ncheckedIn: false}
          api -> db : Incrementer\nEvent.registeredCount (+1)
          db --> api : Registration creee

          api -> mail : Envoyer email confirmation\n(details evenement + QR code)

          api --> front : 201 {success: true,\nmessage: "Registration successful",\ndata: {registration}}
          front --> user : Mettre a jour bouton\n"Inscrit" + afficher\nlien "Voir mon ticket"\n+ toast succes
        end
      end
    end
  end
end

@enduml
```

### 2.5 Generer et Afficher le QR Code Participant (BF-006)

```plantuml
@startuml SEQ_GenerateQR
!theme plain
skinparam sequenceMessageAlign center

actor Etudiant as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /events/my-tickets\nou cliquer "Voir mon ticket"\nsur un evenement
front -> api : GET /api/events/registrations/mine\n?page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Registrations\n{userId, status != "cancelled"}\n+ populate eventId\n(title, date, startTime,\nendTime, location, isOnline)\n+ populate event.organizerId

alt Aucune inscription
  api --> front : 200 {success: true,\ndata: {registrations: [], total: 0}}
  front --> user : Afficher message\n"Aucun ticket"
else Inscriptions trouvees
  api --> front : 200 {success: true,\ndata: {\n  registrations: [\n    {_id, eventId, userId,\n    status, qrCode,\n    checkedIn, checkedInAt}\n  ],\n  total\n}}

  front -> front : Generer images QR Code\na partir du qrCode string\n(bibliotheque qrcode.react\nQRCodeSVG 112px)

  front --> user : Afficher liste de tickets :\n- QR Code par ticket\n- Statut check-in\n  (Non presente / Presente)\n- Type evenement (badge)\n- Titre, date, heure, lieu
end

@enduml
```

### 2.6 Check-in QR Code (BF-006 — Organisateur)

```plantuml
@startuml SEQ_QRCheckin
!theme plain
skinparam sequenceMessageAlign center

actor "Organisateur\n(Recruteur)" as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /events/:eventId/checkin\n(page scanner QR)
front -> front : Choisir mode :\n- Camera (html5-qrcode)\n- Saisie manuelle

alt Mode camera
  front -> front : Activer camera arriere\n(facingMode: environment)\n+ scanner QR (html5-qrcode\n10fps, 250x250)
  user -> front : Scanner le QR Code\nd'un participant
  front -> front : Decoder le QR Code\n→ extraire qrCode string
else Mode manuel
  user -> front : Saisir le code QR\nmanuellement
end

front -> api : POST /api/events/:eventId/checkin\n{qrCode}\n(Authorization: Bearer <token>)

api -> mw : authenticate\n+ authorize(RECRUITER)
mw --> api : req.user = {userId, role}

api -> db : Chercher Event par _id
alt Evenement non trouve
  api --> front : 404 {success: false,\nmessage: "Event not found"}
  front --> user : Afficher erreur
else Evenement trouve
  api -> api : Verifier ownership\n(event.organizerId === req.user.userId)
  alt Pas l'organisateur
    api --> front : 403 {success: false,\nmessage: "Forbidden"}
    front --> user : Afficher erreur
  else Autorise
    api -> db : Chercher Registration\n{eventId, qrCode}
    alt Registration non trouvee
      api --> front : 404 {success: false,\nmessage: "Invalid QR code"}
      front --> user : Afficher alerte rouge\n"QR Code invalide"
    else Registration trouvee
      alt registration.checkedIn === true
        api --> front : 409 {success: false,\nmessage: "Already checked in",\ndata: {checkedInAt}}
        front --> user : Afficher alerte jaune\n"Deja presente a\n{checkedInAt}"
      else Pas encore check-in
        api -> db : Mettre a jour Registration\n{checkedIn: true,\ncheckedInAt: new Date(),\nstatus: "checked_in"}
        db --> api : Registration mise a jour

        api -> db : Populate userId\n(firstName, lastName, avatar)

        api --> front : 200 {success: true,\nmessage: "Check-in successful",\ndata: {\n  registration: {\n    user: {firstName,\n      lastName, avatar},\n    checkedInAt\n  }\n}}
        front --> user : Afficher alerte verte\n"Check-in reussi"\n+ nom et avatar du participant
      end
    end
  end
end

@enduml
```

---

## 3. Diagramme de Classes — Sprint 3

```plantuml
@startuml CLASS_Sprint3
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 13
skinparam classAttributeFontSize 11

' ============================================================
' MODELES EXISTANTS (Sprint 1 & 2) - contexte
' ============================================================

class User <<Document>> #E8F5E9 {
  - _id : ObjectId
  - email : string {unique}
  - password : string {select: false}
  - firstName : string
  - lastName : string
  - username : string {unique}
  - role : UserRole
  - authProvider : AuthProvider
  - isEmailVerified : boolean
  - is2FAEnabled : boolean
  - isActive : boolean
  - avatar? : string
  - coverImage? : string
  - lastLoginAt? : Date
  - createdAt : Date
  - updatedAt : Date
}

class StudentProfile <<Document>> #E8F5E9 {
  - _id : ObjectId
  - userId : ObjectId {unique} <<FK>>
  - headline? : string
  - bio? : string
  - skills : string[]
  - location? : string
  - phone? : string
  - website? : string
  - linkedinUrl? : string
  - githubUrl? : string
  - education : Education[]
  - experiences : Experience[]
  - projects : Project[]
  - cvUrl? : string
  - profileCompletionPercent : number
  - isPublic : boolean
}

class RecruiterProfile <<Document>> #E8F5E9 {
  - _id : ObjectId
  - userId : ObjectId {unique} <<FK>>
  - companyName : string
  - sector : string
  - companyDescription? : string
  - location? : string
  - isVerified : boolean
}

class Opportunity <<Document>> #FFF3E0 {
  - _id : ObjectId
  - recruiterId : ObjectId <<FK>>
  - title : string
  - description : string
  - type : OpportunityType
  - location : string
  - domain : string
  - skills : string[]
  - requirements? : string
  - deadline? : Date
  - status : OpportunityStatus
  - createdAt : Date
  - updatedAt : Date
}

note right of User
  Modeles existants Sprint 1 & 2.
  Fond vert = Sprint 1.
  Fond orange = Sprint 2.
end note

' ============================================================
' NOUVEAUX ENUMS (Sprint 3)
' ============================================================

enum EventType {
  CONFERENCE = "conference"
  WORKSHOP = "workshop"
  NETWORKING = "networking"
  WEBINAR = "webinar"
  CAREER_FAIR = "career_fair"
}

enum EventStatus {
  PENDING = "pending"
  UPCOMING = "upcoming"
  ONGOING = "ongoing"
  COMPLETED = "completed"
  CANCELLED = "cancelled"
  REJECTED = "rejected"
}

enum RegistrationStatus {
  REGISTERED = "registered"
  CANCELLED = "cancelled"
  CHECKED_IN = "checked_in"
}


' ============================================================
' NOUVEAUX MODELES (Sprint 3)
' ============================================================

class Event <<Document>> #E8EAF6 {
  - _id : ObjectId
  - organizerId : ObjectId <<FK>>
  - title : string {max: 200}
  - description : string {max: 5000}
  - type : EventType
  - location : string
  - date : Date
  - startTime : string
  - endTime : string
  - capacity : number {min: 1}
  - registeredCount : number {default: 0}
  - isOnline : boolean {default: false}
  - meetingUrl? : string
  - image? : string
  - status : EventStatus {default: "pending"}
  - createdAt : Date
  - updatedAt : Date
  __
  Index: {organizerId}
  Index: {status, date}
  Index: {date}
  Index: {type}
}

class Registration <<Document>> #E8EAF6 {
  - _id : ObjectId
  - eventId : ObjectId <<FK>>
  - userId : ObjectId <<FK>>
  - status : RegistrationStatus {default: "registered"}
  - qrCode : string {unique}
  - checkedIn : boolean {default: false}
  - checkedInAt? : Date
  - createdAt : Date
  - updatedAt : Date
  __
  Index: {eventId, userId} unique
  Index: {eventId, status}
  Index: {qrCode} unique
  Index: {userId}
}


note right of Event
  Nouveaux modeles du Sprint 3.
  Fond bleu = Sprint 3.
end note

' ============================================================
' NOUVEAUX SERVICES (Sprint 3)
' ============================================================

class MatchingService <<Service>> {
  + getRecommendations(userId, limit?) : {recommendations, total}
  + getMatchScore(userId, opportunityId) : {opportunity, matching}
}

class AIService <<Service>> {
  + calculateMatches(student, opportunities) : MatchResult[]
  + calculateScore(student, opportunity) : DetailedMatchResult
  - calculateBasicMatches(student, opportunities) : MatchResult[]
  - calculateBasicScore(student, opportunity) : DetailedMatchResult
}

class EventService <<Service>> {
  + createEvent(organizerId, data) : IEvent
  + updateEvent(eventId, organizerId, data) : IEvent
  + cancelEvent(eventId, organizerId) : IEvent
  + deleteEvent(eventId, organizerId) : void
  + getEvent(eventId) : IEvent
  + listEvents(filters, page?, limit?) : {events, total}
  + getOrganizerEvents(organizerId, page?, limit?) : {events, total}
  + registerForEvent(eventId, userId) : IRegistration
  + cancelRegistration(eventId, userId) : void
  + getMyRegistration(eventId, userId) : IRegistration
  + checkinByQR(eventId, qrCode, organizerId) : IRegistration
  + getEventParticipants(eventId, organizerId, page?, limit?) : {participants, total}
  + getUserRegistrations(userId, page?, limit?) : {registrations, total}
}


' ============================================================
' SERVICES EXISTANTS (Sprint 1 & 2)
' ============================================================

class EmailService <<Service>> #E8F5E9 {
  + sendVerificationEmail(...) : void
  + sendPasswordResetEmail(...) : void
  + send2FACode(...) : void
  + sendConnectionNotification(...) : void
  + sendApplicationNotification(...) : void
  + sendApplicationStatusUpdate(...) : void
  __ Sprint 3 — nouvelles methodes __
  + sendEventRegistrationConfirmation(email, firstName, eventTitle, date, qrCode) : void
  + sendEventCancellationNotification(email, firstName, eventTitle) : void
}

' ============================================================
' RELATIONS
' ============================================================

' --- FK Relations ---
User "1" -- "0..*" Event : organise\n(organizerId) >
User "1" -- "0..*" Registration : s'inscrit\n(userId) >
Event "1" -- "0..*" Registration : contient >
User "1" -- "0..1" StudentProfile : a >
User "1" -- "0..1" RecruiterProfile : a >
User "1" -- "0..*" Opportunity : publie >

' --- Enum usage ---
Event ..> EventType : utilise >
Event ..> EventStatus : utilise >
Registration ..> RegistrationStatus : utilise >

' --- Service dependencies ---
MatchingService ..> StudentProfile : consulte >
MatchingService ..> Opportunity : consulte >
MatchingService ..> AIService : utilise >

EventService ..> Event : manipule >
EventService ..> Registration : manipule >
EventService ..> User : consulte >
EventService ..> EmailService : utilise >

@enduml
```

---

## 4. Diagramme d'Activite — Workflow de Matching IA

```plantuml
@startuml ACT_MatchingWorkflow
!theme plain
skinparam activityBackgroundColor #E8EAF6
skinparam activityBorderColor #283593
skinparam activityDiamondBackgroundColor #C5CAE9
skinparam activityDiamondBorderColor #283593
skinparam swimlaneBackgroundColor #FAFAFA
skinparam swimlaneBorderColor #999999

|Etudiant|
start
:Naviguer vers\n/recommendations;

|Systeme Backend|
:Authentifier l'etudiant\n(JWT RS256);

if (Profil etudiant\nexiste et skills\nnon vide ?) then (non)
  :Retourner erreur\n"Completez votre profil";
  |Etudiant|
  :Afficher message +\nbouton "Completer le profil"\n-> naviguer vers /profile;
  stop
else (oui)
endif

:Extraire donnees profil\n(skills, location,\neducation, experiences);

:Charger opportunites\napprouvees et actives\n(status: approved,\ndeadline valide ou null);

if (Opportunites\ndisponibles ?) then (non)
  :Retourner liste vide\n"Aucune recommandation";
  |Etudiant|
  :Afficher message;
  stop
else (oui)
endif

|Service IA (FastAPI)|
:Recevoir donnees :\n- profil etudiant\n- liste opportunites;

:Calculer similarite\nsemantique (TF-IDF)\nentre skills etudiant\net skills/requirements\nopportunites;

:Appliquer regles metier :\n- Bonus location match\n- Bonus domain match\n- Poids experience pertinente;

:Generer score global\npour chaque opportunite\n(0-100%);

:Generer explication\ntextuelle pour\nchaque match;

:Trier par score desc;

note right
  Fallback deterministe si
  service IA indisponible :
  skillsScore * 0.5 +
  locationScore * 0.25 +
  domainScore * 0.25
end note

|Systeme Backend|
:Recevoir resultats IA;
:Enrichir avec donnees\nopportunites (populate\nrecruteur);

|Etudiant|
:Afficher recommandations :\n- Score (jauge circulaire %)\n- Titre opportunite\n- Nom recruteur\n- Type (badge)\n- Barres : skills, location,\n  domain\n- Explication matching;

if (Interesse ?) then (oui)
  :Cliquer "Voir detail";

  |Service IA (FastAPI)|
  :Calcul detaille :\n- Skills overlap\n- Location proximity\n- Domain relevance\n- Experience fit;

  |Etudiant|
  :Afficher detail matching :\n- Jauge score global\n- Barres par critere\n  (skills, location, domain,\n  experience)\n- Skills correspondants (vert)\n- Skills manquants (rouge)\n- Explication detaillee IA;

  if (Postuler ?) then (oui)
    :Cliquer "Postuler";
    note right
      Redirige vers la page
      de l'opportunite
      /opportunities/:id
      (candidature BF-004,
      implemente au Sprint 2)
    end note
    |Etudiant|
    :Naviguer vers\n/opportunities/:id;
  else (non)
    :Retour aux\nrecommandations;
  endif
else (non)
  :Parcourir d'autres\nrecommandations\nou rafraichir la liste;
endif

stop

@enduml
```

---

## 5. Diagramme d'Activite — Workflow Evenement Hybride

```plantuml
@startuml ACT_EventWorkflow
!theme plain
skinparam activityBackgroundColor #E8EAF6
skinparam activityBorderColor #283593
skinparam activityDiamondBackgroundColor #C5CAE9
skinparam activityDiamondBorderColor #283593
skinparam swimlaneBackgroundColor #FAFAFA
skinparam swimlaneBorderColor #999999

|Organisateur (Recruteur)|
start
:Creer un evenement\n(titre, description, type,\nlieu, date, horaires,\ncapacite, online/presentiel,\nimage optionnelle);

|Systeme|
:Valider donnees (Zod);
if (Donnees valides ?) then (oui)
  :Creer Event\n(status: "pending",\nregisteredCount: 0);
  note right
    L'evenement est en attente
    de validation par l'admin
    (BF-007, Sprint 4).
  end note
else (non)
  :Retourner erreurs\nde validation;
  |Organisateur (Recruteur)|
  :Corriger le formulaire;
  detach
endif

== Validation par Admin (Sprint 4) ==

|Admin|
:Approuver l'evenement\n(status -> "upcoming");

== Evenement disponible ==

|Etudiant|
:Naviguer vers /events;
:Consulter les evenements\ndisponibles (filtres :\ntype, recherche);

|Systeme|
:Retourner evenements\n{status: "upcoming",\ndate >= now};

|Etudiant|
:Consulter detail\nd'un evenement;

|Systeme|
if (Places disponibles ?) then (oui)
  |Etudiant|
  :Cliquer "S'inscrire";

  |Systeme|
  :Verifier pas deja inscrit;
  :Verifier capacite;

  if (Tout valide ?) then (oui)
    :Creer Registration\n+ generer QR Code unique\n(UUID v4);
    :Incrementer registeredCount;
    :Envoyer email confirmation\n+ QR Code;

    |Etudiant|
    :Recevoir confirmation\n+ QR Code par email;
    :Acceder a "Mes Tickets"\n(/events/my-tickets);

    |Systeme|
    :Afficher QR Code\ndu participant\n(qrcode.react QRCodeSVG);
  else (non)
    :Retourner erreur\n(deja inscrit ou complet);
    |Etudiant|
    :Afficher message d'erreur;
    detach
  endif
else (non)
  |Etudiant|
  :Afficher "Complet";
  detach
endif

== Jour de l'evenement ==

|Organisateur (Recruteur)|
:Ouvrir page check-in\n/events/:id/checkin;
:Choisir mode :\ncamera ou saisie manuelle;

|Etudiant|
:Presenter son QR Code\n(ecran telephone\nou email imprime);

|Organisateur (Recruteur)|
:Scanner / saisir\nle QR Code;

|Systeme|
:Chercher Registration\npar qrCode;

if (QR valide ?) then (oui)
  if (Deja check-in ?) then (non)
    :Marquer checkedIn: true\n+ checkedInAt: now\n+ status: "checked_in";
    :Afficher succes\n+ nom et avatar participant;
    |Organisateur (Recruteur)|
    :Confirmer entree;
  else (oui)
    :Afficher alerte\n"Deja presente";
    |Organisateur (Recruteur)|
    :Informer le participant;
  endif
else (non)
  :Afficher alerte\n"QR invalide";
  |Organisateur (Recruteur)|
  :Refuser entree;
endif

|Organisateur (Recruteur)|
:Consulter liste participants\n+ ratio presences\n(checked-in / total);

stop

@enduml
```

---

## Legende

| Diagramme | Description |
|-----------|-------------|
| **1. UC Sprint 3** | Cas d'utilisation specifiques au Sprint 3 : BF-005 (Matching IA) et BF-006 (Evenements Hybrides). Le recruteur organise les evenements, l'etudiant obtient des recommandations et s'inscrit |
| **2. Sequences** | Flux detailles des interactions pour chaque fonctionnalite du Sprint 3 (6 diagrammes : 2 IA Matching, 4 Evenements). Inclut le fallback deterministe du service IA |
| **3. Classes** | Nouveaux modeles de donnees (Event, Registration), enums (EventType avec 5 types, EventStatus avec 6 statuts incluant pending/rejected, RegistrationStatus) et services (MatchingService, AIService avec fallback, EventService avec 13 methodes). Les modeles Sprint 1 et 2 sont affiches en contexte |
| **4. Activite IA** | Workflow complet du matching IA : extraction profil -> chargement opportunites -> calcul similarite (IA ou fallback) -> scoring -> recommandations -> consultation detail -> candidature |
| **5. Activite Evenement** | Workflow complet du cycle de vie d'un evenement : creation (status pending) -> validation admin -> inscription -> generation QR -> check-in (camera ou manuel) -> consultation presence |

---

*Document genere pour le Sprint 3 de la plateforme ForMinds.*
*Couvre les fonctionnalites BF-005 (Matching IA) et BF-006 (Evenements Hybrides & QR Code).*
*Mis a jour le 10 mars 2026 pour correspondre a l'implementation reelle du code.*
