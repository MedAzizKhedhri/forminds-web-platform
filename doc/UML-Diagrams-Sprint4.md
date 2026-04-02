# Diagrammes UML — ForMinds Platform (Sprint 4)

---

## 1. Diagramme de Cas d'Utilisation — Sprint 4

Sprint 4 couvre : **BF-007 (Administration & Gouvernance)**

```plantuml
@startuml UC_Sprint4
!theme plain
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseBackgroundColor #E8EAF6
skinparam usecaseBorderColor #283593
skinparam actorBackgroundColor #FFCC00
left to right direction

actor "Admin" as admin
actor "Service Email\n(Nodemailer)" as email <<system>>

rectangle "ForMinds — Sprint 4" {

  package "BF-007 : Administration & Gouvernance" {
    usecase "Consulter dashboard\nadmin" as UC_DASHBOARD
    usecase "Consulter statistiques\nplateforme" as UC_STATS
    usecase "Valider / Rejeter\nopportunite" as UC_VALIDATE_OPP
    usecase "Valider / Rejeter\nevenement" as UC_VALIDATE_EVENT
    usecase "Valider role\nrecruteur" as UC_VALIDATE_RECRUITER
    usecase "Suspendre\nutilisateur" as UC_SUSPEND_USER
    usecase "Reactiver\nutilisateur" as UC_REACTIVATE_USER
    usecase "Consulter journal\nd'audit" as UC_AUDIT_LOG
  }
}

' --- Admin ---
admin --> UC_DASHBOARD
admin --> UC_STATS
admin --> UC_VALIDATE_OPP
admin --> UC_VALIDATE_EVENT
admin --> UC_VALIDATE_RECRUITER
admin --> UC_SUSPEND_USER
admin --> UC_REACTIVATE_USER
admin --> UC_AUDIT_LOG

' --- Relations ---
UC_VALIDATE_OPP ..> email : <<include>>\nNotification recruteur
UC_VALIDATE_EVENT ..> email : <<include>>\nNotification organisateur
UC_VALIDATE_RECRUITER ..> email : <<include>>\nNotification recruteur
UC_SUSPEND_USER ..> email : <<include>>\nNotification utilisateur
UC_REACTIVATE_USER ..> email : <<include>>\nNotification utilisateur

UC_DASHBOARD ..> UC_STATS : <<include>>

@enduml
```

---

## 2. Diagrammes de Sequence — Sprint 4

### 2.1 Valider / Rejeter une Opportunite (BF-007 — Admin)

```plantuml
@startuml SEQ_ValidateOpportunity
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

== Consulter les opportunites en attente ==

user -> front : Naviguer vers /admin/opportunities
front -> api : GET /api/admin/opportunities\n?status=pending\n&page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : req.user = {userId, role: "admin"}

api -> db : Chercher Opportunities\n{status: "pending"}\nPopulate recruiterId ->\n(firstName, lastName,\ncompanyName, avatar)\nSort par createdAt asc\nSkip + Limit

db --> api : Opportunities + total

api --> front : 200 {success: true,\ndata: {\n  opportunities: [...],\n  pagination: {page, limit,\n    total, totalPages}\n}}

front --> user : Afficher liste :\ntitre, type, recruteur,\nentreprise, date soumission,\nboutons Approuver / Rejeter

== Approuver ou rejeter une opportunite ==

user -> front : Cliquer "Approuver"\nou "Rejeter" (avec motif\noptionnel si rejet)
front -> api : PATCH /api/admin/opportunities/:opportunityId\n{status: "approved" | "rejected",\nrejectionReason?}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> api : Validation Zod\n(status: enum, rejectionReason\noptionnel si rejected)

api -> db : Chercher Opportunity par _id
alt Opportunite non trouvee
  api --> front : 404 {success: false,\nmessage: "Opportunity not found"}
  front --> user : Afficher erreur
else Opportunite trouvee
  alt opportunity.status !== "pending"
    api --> front : 400 {success: false,\nmessage: "Opportunity already processed"}
    front --> user : Afficher erreur
  else Status pending
    api -> db : Mettre a jour Opportunity\n{status, rejectionReason?,\nreviewedBy: req.user.userId,\nreviewedAt: new Date()}
    db --> api : Opportunity mise a jour

    api -> db : Creer AuditLog\n{adminId: req.user.userId,\naction: "opportunity_validated"\n| "opportunity_rejected",\ntargetType: "Opportunity",\ntargetId: opportunityId,\ndetails: {status, rejectionReason}}

    api -> db : Chercher recruteur\n(User par opportunity.recruiterId)
    api -> mail : Notifier le recruteur\n"Votre opportunite a ete\napprouvee / rejetee"\n(+ motif si rejet)

    api --> front : 200 {success: true,\nmessage: "Opportunity approved/rejected",\ndata: {opportunity}}
    front --> user : Mettre a jour la liste\n+ toast succes
  end
end

@enduml
```

### 2.2 Valider le Role Recruteur (BF-007 — Admin)

```plantuml
@startuml SEQ_ValidateRecruiter
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Naviguer vers /admin/recruiters
front -> api : GET /api/admin/recruiters\n?verified=false\n&page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Chercher RecruiterProfiles\n{isVerified: false}\nPopulate userId ->\n(firstName, lastName, email,\navatar, createdAt)\nSort par createdAt asc\nSkip + Limit

db --> api : Profiles + total

api --> front : 200 {success: true,\ndata: {\n  recruiters: [...],\n  pagination\n}}

front --> user : Afficher liste :\nnom, entreprise, secteur,\ndate inscription,\nbouton Valider / Rejeter

user -> front : Cliquer "Valider"
front -> api : PATCH /api/admin/recruiters/:userId/verify\n{verified: true}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Chercher RecruiterProfile\npar userId
alt Profil non trouve
  api --> front : 404 {success: false,\nmessage: "Recruiter profile not found"}
  front --> user : Afficher erreur
else Profil trouve
  api -> db : Mettre a jour RecruiterProfile\n{isVerified: true}
  db --> api : Profil mis a jour

  api -> db : Creer AuditLog\n{adminId, action: "recruiter_verified",\ntargetType: "User",\ntargetId: userId}

  api -> db : Chercher User par userId
  api -> mail : Notifier le recruteur\n"Votre compte a ete verifie.\nVous pouvez maintenant\npublier des opportunites."

  api --> front : 200 {success: true,\nmessage: "Recruiter verified",\ndata: {profile}}
  front --> user : Mettre a jour la liste\n+ toast succes
end

@enduml
```

### 2.3 Suspendre / Reactiver un Utilisateur (BF-007 — Admin)

```plantuml
@startuml SEQ_ManageUser
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

== Consulter les utilisateurs ==

user -> front : Naviguer vers /admin/users
front -> api : GET /api/users\n?page=1&limit=20\n(Authorization: Bearer <token>)

note right of api
  Route existante (Sprint 1) :
  GET /api/users (admin only)
  Sprint 4 ajoute filtres
  role et status.
end note

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Chercher Users\n(filtres optionnels : role, isActive)\nProjection : firstName, lastName,\nemail, username, role, isActive,\nisEmailVerified, createdAt,\nlastLoginAt\nSort par createdAt desc\nSkip + Limit

db --> api : Users + total

api --> front : 200 {success: true,\ndata: {\n  users: [...],\n  pagination\n}}

front --> user : Afficher tableau :\nnom, email, role (badge),\nstatut (actif/suspendu),\ndate inscription,\nboutons d'action

== Suspendre un utilisateur ==

user -> front : Cliquer "Suspendre"\nsur un utilisateur\n(confirmation dialog\navec motif)
front -> api : PATCH /api/users/:userId/status\n{isActive: false, reason: "..."}\n(Authorization: Bearer <token>)

note right of api
  Route existante (Sprint 1) :
  PATCH /api/users/:id/status
  Sprint 4 etend pour accepter
  isActive et reason dans le body
  (actuellement un toggle simple).
end note

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Chercher User par _id
alt User non trouve
  api --> front : 404 {success: false,\nmessage: "User not found"}
  front --> user : Afficher erreur
else User trouve
  alt user.role === "admin"
    api --> front : 403 {success: false,\nmessage: "Cannot suspend an admin"}
    front --> user : Afficher erreur
  else Autorise
    api -> db : Mettre a jour User\n{isActive: false}
    db --> api : User mis a jour

    api -> db : Creer AuditLog\n{adminId, action: "user_suspended",\ntargetType: "User",\ntargetId: userId,\ndetails: {reason}}

    api -> mail : Notifier l'utilisateur\n"Votre compte a ete suspendu.\nMotif : {reason}"

    api --> front : 200 {success: true,\nmessage: "User suspended",\ndata: {user}}
    front --> user : Mettre a jour badge statut\n+ toast succes
  end
end

== Reactiver un utilisateur ==

user -> front : Cliquer "Reactiver"\nsur un utilisateur suspendu
front -> api : PATCH /api/users/:userId/status\n{isActive: true}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Mettre a jour User\n{isActive: true}
api -> db : Creer AuditLog\n{adminId, action: "user_reactivated",\ntargetType: "User",\ntargetId: userId}

api -> mail : Notifier l'utilisateur\n"Votre compte a ete reactive."

api --> front : 200 {success: true,\nmessage: "User reactivated",\ndata: {user}}
front --> user : Mettre a jour badge statut\n+ toast succes

@enduml
```

### 2.4 Dashboard Admin & Statistiques (BF-007)

```plantuml
@startuml SEQ_AdminDashboard
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /admin
front -> api : GET /api/admin/stats\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Aggregation parallele\n(Promise.all) :

note right of db
  1. User.countDocuments()
  2. User.countDocuments({role: "student"})
  3. User.countDocuments({role: "recruiter"})
  4. User.countDocuments({isActive: false})
  5. Opportunity.countDocuments({status: "pending"})
  6. Opportunity.countDocuments({status: "approved"})
  7. Opportunity.countDocuments({status: "rejected"})
  8. Application.countDocuments()
  9. User.countDocuments(createdAt > 30j)
  10. Event.countDocuments({status: "pending"})
end note

db --> api : Resultats des comptages

api --> front : 200 {success: true,\ndata: {\n  stats: {\n    totalUsers,\n    totalStudents,\n    totalRecruiters,\n    suspendedUsers,\n    pendingOpportunities,\n    approvedOpportunities,\n    rejectedOpportunities,\n    totalApplications,\n    newUsersLast30Days,\n    pendingEvents\n  }\n}}

front --> user : Afficher dashboard :\n- Cartes KPI (utilisateurs,\n  opportunites en attente,\n  evenements en attente,\n  candidatures)\n- Graphiques (inscriptions/mois,\n  opportunites par statut)\n- Actions rapides\n  (liens vers sections admin)

@enduml
```

### 2.5 Consulter le Journal d'Audit (BF-007 — Admin)

```plantuml
@startuml SEQ_AuditLog
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /admin/audit-log
front -> api : GET /api/admin/audit-log\n?page=1&limit=50\n&action=all\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> db : Chercher AuditLogs\n(filtres optionnels : action, adminId,\ntargetType, dateRange)\nPopulate adminId ->\n(firstName, lastName, username)\nSort par createdAt desc\nSkip + Limit

db --> api : AuditLogs + total

api --> front : 200 {success: true,\ndata: {\n  logs: [\n    {\n      _id,\n      adminId: {firstName,\n        lastName, username},\n      action,\n      targetType,\n      targetId,\n      details,\n      ipAddress,\n      createdAt\n    }\n  ],\n  pagination\n}}

front --> user : Afficher tableau d'audit :\ndate, admin (nom),\naction (badge couleur),\ncible (type + id),\ndetails (tooltip),\nadresse IP

@enduml
```

### 2.6 Valider / Rejeter un Evenement (BF-007 — Admin)

```plantuml
@startuml SEQ_ValidateEvent
!theme plain
skinparam sequenceMessageAlign center

actor Admin as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

== Consulter les evenements en attente ==

user -> front : Naviguer vers /admin/events
front -> api : GET /api/admin/events\n?page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : req.user = {userId, role: "admin"}

api -> db : Chercher Events\n{status: "pending"}\nPopulate organizerId ->\n(firstName, lastName,\nemail, avatar)\nSort par createdAt asc\nSkip + Limit

db --> api : Events + total

api --> front : 200 {success: true,\ndata: {\n  events: [...],\n  pagination: {page, limit,\n    total, totalPages}\n}}

front --> user : Afficher liste :\ntitre, type, organisateur,\ndate evenement, date soumission,\nboutons Approuver / Rejeter

== Approuver ou rejeter un evenement ==

user -> front : Cliquer "Approuver"\nou "Rejeter" (avec motif\noptionnel si rejet)
front -> api : PATCH /api/admin/events/:eventId\n{status: "upcoming" | "rejected",\nrejectionReason?}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(ADMIN)
mw --> api : OK

api -> api : Validation Zod\n(status: enum, rejectionReason\noptionnel si rejected)

api -> db : Chercher Event par _id
alt Evenement non trouve
  api --> front : 404 {success: false,\nmessage: "Event not found"}
  front --> user : Afficher erreur
else Evenement trouve
  alt event.status !== "pending"
    api --> front : 400 {success: false,\nmessage: "Event already processed"}
    front --> user : Afficher erreur
  else Status pending
    api -> db : Mettre a jour Event\n{status, rejectionReason?,\nreviewedBy: req.user.userId,\nreviewedAt: new Date()}
    db --> api : Event mis a jour

    api -> db : Creer AuditLog\n{adminId: req.user.userId,\naction: "event_approved"\n| "event_rejected",\ntargetType: "Event",\ntargetId: eventId,\ndetails: {status, rejectionReason}}

    api -> db : Chercher organisateur\n(User par event.organizerId)
    api -> mail : sendEventValidationNotification\n(email, firstName, eventTitle,\nstatus, rejectionReason?)\n"Votre evenement a ete\napprouve / rejete"\n(+ motif si rejet)

    api --> front : 200 {success: true,\nmessage: "Event approved/rejected",\ndata: {event}}
    front --> user : Mettre a jour la liste\n+ toast succes
  end
end

@enduml
```

---

## 3. Diagramme de Classes — Sprint 4

```plantuml
@startuml CLASS_Sprint4
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
  __ Sprint 4 — nouveaux champs __
  - reviewedBy? : ObjectId <<FK>>
  - reviewedAt? : Date
  - rejectionReason? : string
}

class Application <<Document>> #FFF3E0 {
  - _id : ObjectId
  - studentId : ObjectId <<FK>>
  - opportunityId : ObjectId <<FK>>
  - status : ApplicationStatus
  - coverLetter? : string
  - appliedAt : Date
}

class Event <<Document>> #E8EAF6 {
  - _id : ObjectId
  - organizerId : ObjectId <<FK>>
  - title : string
  - description : string
  - type : EventType
  - date : Date
  - endDate? : Date
  - location? : string
  - isOnline : boolean
  - meetingLink? : string
  - maxParticipants? : number
  - status : EventStatus
  - rejectionReason? : string
  - reviewedBy? : ObjectId <<FK>>
  - reviewedAt? : Date
  - createdAt : Date
  - updatedAt : Date
}

note right of User
  Modeles existants Sprint 1 & 2.
  Fond vert = Sprint 1.
  Fond orange = Sprint 2.
  Champs avec "Sprint 4" =
  nouvelles extensions.
end note

note right of Event
  Modele existant Sprint 3.
  Fond bleu = Sprint 3.
  Sprint 4 etend ce modele
  avec la validation admin
  (status peut etre "rejected"
  via admin).
end note

' ============================================================
' NOUVEAUX ENUMS (Sprint 4)
' ============================================================

enum AuditAction {
  OPPORTUNITY_APPROVED = "opportunity_approved"
  OPPORTUNITY_REJECTED = "opportunity_rejected"
  RECRUITER_VERIFIED = "recruiter_verified"
  USER_SUSPENDED = "user_suspended"
  USER_REACTIVATED = "user_reactivated"
  EVENT_APPROVED = "event_approved"
  EVENT_REJECTED = "event_rejected"
}

' ============================================================
' NOUVEAUX MODELES (Sprint 4)
' ============================================================

class AuditLog <<Document>> #E8EAF6 {
  - _id : ObjectId
  - adminId : ObjectId <<FK>>
  - action : AuditAction
  - targetType : string
  - targetId : ObjectId
  - details? : object
  - ipAddress? : string
  - createdAt : Date
  __
  Index: {adminId}
  Index: {action}
  Index: {createdAt}
  Index: {targetType, targetId}
}

note right of AuditLog
  Nouveau modele du Sprint 4.
  Fond bleu = a implementer.
end note

' ============================================================
' NOUVEAUX SERVICES (Sprint 4)
' ============================================================

class AdminService <<Service>> {
  + getStats() : DashboardStats
  + getUsers(filters, page?, limit?) : {users, total}
  + updateUserStatus(userId, adminId, isActive, reason?) : User
  + getPendingOpportunities(page?, limit?) : {opportunities, total}
  + validateOpportunity(opportunityId, adminId, status, reason?) : Opportunity
  + getPendingEvents(page?, limit?) : {events, total}
  + validateEvent(eventId, adminId, status, reason?) : Event
  + getUnverifiedRecruiters(page?, limit?) : {recruiters, total}
  + verifyRecruiter(userId, adminId) : RecruiterProfile
  + getAuditLogs(filters, page?, limit?) : {logs, total}
}

class AuditService <<Service>> {
  + logAction(adminId, action, targetType, targetId, details?, ipAddress?) : IAuditLog
  + getAuditLogs(filters, page?, limit?) : {logs, total}
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
  __ Sprint 4 — nouvelles methodes __
  + sendOpportunityValidationNotification(email, firstName, opportunityTitle, status, reason?) : void
  + sendRecruiterVerificationNotification(email, firstName) : void
  + sendAccountSuspensionNotification(email, firstName, reason) : void
  + sendAccountReactivationNotification(email, firstName) : void
  + sendEventValidationNotification(email, firstName, eventTitle, status, reason?) : void
}

' ============================================================
' RELATIONS
' ============================================================

' --- FK Relations ---
User "1" -- "0..*" AuditLog : genere\n(adminId) >
User "1" -- "0..1" RecruiterProfile : a >
User "1" -- "0..*" Opportunity : publie >
User "1" -- "0..*" Event : organise >

' --- Enum usage ---
AuditLog ..> AuditAction : utilise >

' --- Service dependencies ---
AdminService ..> User : manipule >
AdminService ..> Opportunity : manipule >
AdminService ..> Event : manipule >
AdminService ..> RecruiterProfile : manipule >
AdminService ..> AuditService : utilise >
AdminService ..> EmailService : utilise >

AuditService ..> AuditLog : manipule >

@enduml
```

---

## 4. Diagramme d'Activite — Workflow Administration & Gouvernance

```plantuml
@startuml ACT_AdminWorkflow
!theme plain
skinparam activityBackgroundColor #E8EAF6
skinparam activityBorderColor #283593
skinparam activityDiamondBackgroundColor #C5CAE9
skinparam activityDiamondBorderColor #283593
skinparam swimlaneBackgroundColor #FAFAFA
skinparam swimlaneBorderColor #999999

|Admin|
start
:Se connecter au dashboard\n/admin;

|Systeme|
:Charger statistiques\n(KPIs plateforme);

|Admin|
:Consulter dashboard :\n- Total utilisateurs\n- Opportunites en attente\n- Evenements en attente\n- Candidatures totales;

fork
  |Admin|
  :Gerer les opportunites\nen attente;

  |Systeme|
  :Charger Opportunities\n{status: "pending"};

  |Admin|
  :Examiner une opportunite\n(titre, description,\nrecruteur, entreprise);

  if (Approuver ?) then (oui)
    :Cliquer "Approuver";
    |Systeme|
    :Mettre a jour status\n-> "approved";
    :Enregistrer dans\njournal d'audit;
    :Notifier le recruteur\npar email;
    |Admin|
    :Passer a l'opportunite\nsuivante;
  else (non)
    :Cliquer "Rejeter"\n+ saisir motif;
    |Systeme|
    :Mettre a jour status\n-> "rejected"\n+ rejectionReason;
    :Enregistrer dans\njournal d'audit;
    :Notifier le recruteur\npar email (avec motif);
    |Admin|
    :Passer a l'opportunite\nsuivante;
  endif

fork again
  |Admin|
  :Gerer les evenements\nen attente;
  |Systeme|
  :Charger Events\n{status: "pending"};
  |Admin|
  :Examiner un evenement;
  if (Approuver ?) then (oui)
    :Cliquer "Approuver";
    |Systeme|
    :Mettre a jour status\n-> "upcoming";
    :Enregistrer dans\njournal d'audit;
    :Notifier l'organisateur\npar email;
  else (non)
    :Cliquer "Rejeter"\n+ saisir motif;
    |Systeme|
    :Mettre a jour status\n-> "rejected"\n+ rejectionReason;
    :Enregistrer dans\njournal d'audit;
    :Notifier l'organisateur\npar email (avec motif);
  endif

fork again
  |Admin|
  :Gerer les recruteurs\nnon verifies;

  |Systeme|
  :Charger RecruiterProfiles\n{isVerified: false};

  |Admin|
  :Examiner profil\nrecruteur (entreprise,\nsecteur, contact);

  if (Verifier ?) then (oui)
    :Cliquer "Verifier";
    |Systeme|
    :Mettre a jour\nisVerified -> true;
    :Enregistrer dans\njournal d'audit;
    :Notifier le recruteur;
  else (non)
    :Ignorer / Reporter;
  endif

fork again
  |Admin|
  :Gerer les utilisateurs;

  |Systeme|
  :Charger liste Users\navec filtres;

  |Admin|
  if (Action requise ?) then (suspendre)
    :Cliquer "Suspendre"\n+ saisir motif;
    |Systeme|
    :isActive -> false;
    :Enregistrer dans\njournal d'audit;
    :Notifier l'utilisateur;
  else (reactiver)
    :Cliquer "Reactiver";
    |Systeme|
    :isActive -> true;
    :Enregistrer dans\njournal d'audit;
    :Notifier l'utilisateur;
  endif

end fork

|Admin|
:Consulter journal d'audit\n/admin/audit-log;

|Systeme|
:Charger AuditLogs\navec filtres et pagination;

|Admin|
:Afficher historique\ndes actions admin\n(date, admin, action,\ncible, details);

stop

@enduml
```

---

## Legende

| Diagramme | Description |
|-----------|-------------|
| **1. UC Sprint 4** | Cas d'utilisation specifiques au Sprint 4 : BF-007 (Administration & Gouvernance), incluant la validation des evenements |
| **2. Sequences** | Flux detailles des interactions pour chaque fonctionnalite du Sprint 4 (6 diagrammes : validation opportunites, verification recruteurs, gestion utilisateurs, dashboard admin, journal d'audit, validation evenements) |
| **3. Classes** | Nouveau modele de donnees (AuditLog), enum (AuditAction), extensions du modele Opportunity, modele Event (Sprint 3) etendu avec validation admin, et services (AdminService, AuditService). Les modeles Sprint 1 et 2 sont affiches en contexte |
| **4. Activite Admin** | Workflow du panneau d'administration : dashboard -> validation opportunites -> validation evenements -> verification recruteurs -> gestion utilisateurs -> journal d'audit |

---

*Document genere pour le Sprint 4 de la plateforme ForMinds.*
*Couvre la fonctionnalite BF-007 (Administration & Gouvernance).*
*Mis a jour le 10/03/2026 — ajout de la validation des evenements par l'admin.*
