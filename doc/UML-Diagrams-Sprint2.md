# Diagrammes UML — ForMinds Platform (Sprint 2)

---

## 1. Diagramme de Cas d'Utilisation — Sprint 2

Sprint 2 couvre : **BF-003 (Networking, Annuaire & Minimal Social Feed)** + **BF-004 (Opportunites & Candidatures)**

```plantuml
@startuml UC_Sprint2
!theme plain
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseBackgroundColor #FFF3E0
skinparam usecaseBorderColor #E65100
skinparam actorBackgroundColor #FFCC00
left to right direction

actor "Etudiant" as student
actor "Recruteur" as recruiter
actor "Admin" as admin
actor "Service Email\n(Nodemailer)" as email <<system>>

rectangle "ForMinds — Sprint 2" {

  package "BF-003 : Networking, Annuaire & Social Feed" {
    usecase "Envoyer demande\nde connexion" as UC_SEND_CONN
    usecase "Accepter connexion" as UC_ACCEPT_CONN
    usecase "Refuser connexion" as UC_REJECT_CONN
    usecase "Consulter liste\nde connexions" as UC_LIST_CONN
    usecase "Voir suggestions\nde connexion" as UC_SUGGEST_CONN
    usecase "Supprimer\nune connexion" as UC_REMOVE_CONN
    usecase "Consulter annuaire\ndes profils" as UC_DIRECTORY
    usecase "Rechercher profils\n(skills, domaine, ville)" as UC_SEARCH_PROFILES

    ' --- Minimal Social Feed ---
    usecase "Creer un post" as UC_CREATE_POST
    usecase "Consulter le fil\nd'actualite" as UC_VIEW_FEED
    usecase "Modifier son post" as UC_EDIT_POST
    usecase "Supprimer son post" as UC_DELETE_POST
    usecase "Liker un post" as UC_LIKE_POST
    usecase "Commenter un post" as UC_COMMENT_POST
    usecase "Supprimer\nun commentaire" as UC_DELETE_COMMENT
    usecase "Moderer les posts\net commentaires" as UC_MODERATE_FEED
  }

  package "BF-004 : Opportunites & Candidatures" {
    usecase "Publier une\nopportunite" as UC_POST_OPP
    usecase "Modifier une\nopportunite" as UC_EDIT_OPP
    usecase "Fermer une\nopportunite" as UC_CLOSE_OPP
    usecase "Rechercher\nopportunites" as UC_SEARCH_OPP
    usecase "Consulter detail\nopportunite" as UC_VIEW_OPP
    usecase "Postuler a une\nopportunite (1-click)" as UC_APPLY
    usecase "Suivre ses\ncandidatures" as UC_TRACK_APP_STU
    usecase "Consulter candidatures\nrecues" as UC_TRACK_APP_REC
    usecase "Mettre a jour statut\ncandidature" as UC_UPDATE_APP_STATUS
  }
}

' --- Etudiant ---
student --> UC_SEND_CONN
student --> UC_ACCEPT_CONN
student --> UC_REJECT_CONN
student --> UC_LIST_CONN
student --> UC_SUGGEST_CONN
student --> UC_REMOVE_CONN
student --> UC_DIRECTORY
student --> UC_SEARCH_PROFILES
student --> UC_SEARCH_OPP
student --> UC_VIEW_OPP
student --> UC_APPLY
student --> UC_TRACK_APP_STU
student --> UC_CREATE_POST
student --> UC_VIEW_FEED
student --> UC_EDIT_POST
student --> UC_DELETE_POST
student --> UC_LIKE_POST
student --> UC_COMMENT_POST
student --> UC_DELETE_COMMENT

' --- Recruteur ---
recruiter --> UC_SEND_CONN
recruiter --> UC_ACCEPT_CONN
recruiter --> UC_REJECT_CONN
recruiter --> UC_LIST_CONN
recruiter --> UC_SUGGEST_CONN
recruiter --> UC_REMOVE_CONN
recruiter --> UC_DIRECTORY
recruiter --> UC_SEARCH_PROFILES
recruiter --> UC_POST_OPP
recruiter --> UC_EDIT_OPP
recruiter --> UC_CLOSE_OPP
recruiter --> UC_SEARCH_OPP
recruiter --> UC_VIEW_OPP
recruiter --> UC_TRACK_APP_REC
recruiter --> UC_UPDATE_APP_STATUS
recruiter --> UC_CREATE_POST
recruiter --> UC_VIEW_FEED
recruiter --> UC_EDIT_POST
recruiter --> UC_DELETE_POST
recruiter --> UC_LIKE_POST
recruiter --> UC_COMMENT_POST
recruiter --> UC_DELETE_COMMENT

' --- Admin ---
admin --> UC_DIRECTORY
admin --> UC_SEARCH_PROFILES
admin --> UC_CREATE_POST
admin --> UC_VIEW_FEED
admin --> UC_EDIT_POST
admin --> UC_DELETE_POST
admin --> UC_LIKE_POST
admin --> UC_COMMENT_POST
admin --> UC_DELETE_COMMENT
admin --> UC_MODERATE_FEED

' --- Relations ---
UC_APPLY ..> email : <<include>>\nNotification recruteur
UC_UPDATE_APP_STATUS ..> email : <<include>>\nNotification etudiant
UC_SEND_CONN ..> email : <<extend>>\nNotification destinataire
UC_ACCEPT_CONN ..> email : <<extend>>\nNotification expediteur

@enduml
```

---

## 2. Diagrammes de Sequence — Sprint 2

### 2.1 Envoyer une Demande de Connexion (BF-003)

```plantuml
@startuml SEQ_SendConnection
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Cliquer "Se connecter"\nsur le profil d'un autre utilisateur
front -> api : POST /api/connections/request\n{receiverId}\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw -> mw : Verifier JWT (RS256)
mw -> db : Verifier User existe et actif
mw --> api : req.user = {userId, role, email}

api -> api : Validation Zod\n(receiverId requis, ObjectId valide)

alt senderId === receiverId
  api --> front : 400 {success: false,\nmessage: "Cannot connect with yourself"}
  front --> user : Afficher erreur
else Utilisateurs differents
  api -> db : Chercher Connection existante\n(senderId + receiverId\nou receiverId + senderId)
  alt Connexion ou demande deja existante
    api --> front : 409 {success: false,\nmessage: "Connection already exists\nor request already pending"}
    front --> user : Afficher erreur
  else Aucune connexion existante
    api -> db : Verifier que le destinataire existe\net est actif
    alt Destinataire non trouve ou inactif
      api --> front : 404 {success: false,\nmessage: "User not found"}
      front --> user : Afficher erreur
    else Destinataire valide
      api -> db : Creer Connection\n{senderId: req.user.userId,\nreceiverId, status: "pending"}
      db --> api : Connection creee
      api -> mail : Envoyer notification email\nau destinataire (optionnel)
      api --> front : 201 {success: true,\nmessage: "Connection request sent",\ndata: {connection}}
      front --> user : Afficher toast succes\n"Demande envoyee"
    end
  end
end

@enduml
```

### 2.2 Accepter / Refuser une Connexion (BF-003)

```plantuml
@startuml SEQ_RespondConnection
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Naviguer vers /network\n(onglet "Demandes recues")
front -> api : GET /api/connections/pending\n(Authorization: Bearer <token>)
api -> mw : authenticate
mw --> api : req.user = {userId, role}
api -> db : Chercher Connections\n{receiverId: req.user.userId,\nstatus: "pending"}
db --> api : Liste des demandes en attente
api --> front : 200 {data: {connections, total}}
front --> user : Afficher liste des demandes\navec boutons Accepter / Refuser

user -> front : Cliquer "Accepter" ou "Refuser"
front -> api : PATCH /api/connections/:connectionId\n{status: "accepted" | "rejected"}

api -> mw : authenticate
mw --> api : OK
api -> api : Validation Zod\n(status: "accepted" ou "rejected")
api -> db : Chercher Connection par _id
alt Connection non trouvee
  api --> front : 404 {success: false,\nmessage: "Connection not found"}
  front --> user : Afficher erreur
else Connection trouvee
  alt req.user.userId !== connection.receiverId
    api --> front : 403 {success: false,\nmessage: "Only the recipient\ncan respond to this request"}
    front --> user : Afficher erreur
  else Utilisateur autorise (destinataire)
    alt connection.status !== "pending"
      api --> front : 400 {success: false,\nmessage: "Request already processed"}
      front --> user : Afficher erreur
    else Demande en attente
      api -> db : Mettre a jour Connection\n{status: "accepted" | "rejected"}
      db --> api : Connection mise a jour
      alt Status = "accepted"
        api -> mail : Notifier l'expediteur\n"Votre demande a ete acceptee"\n(optionnel)
      end
      api --> front : 200 {success: true,\nmessage: "Connection accepted/rejected",\ndata: {connection}}
      front --> user : Mettre a jour la liste\n+ afficher toast succes
    end
  end
end

@enduml
```

### 2.3 Consulter l'Annuaire / Rechercher des Profils (BF-003)

```plantuml
@startuml SEQ_SearchDirectory
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /directory
front -> api : GET /api/profiles/directory\n?skills=react,node\n&domain=IT\n&city=Tunis\n&page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> api : Extraire et valider\nquery params

api -> db : Pipeline d'aggregation :\n1. Lookup User (join)\n2. Filtre isActive: true\n3. Filtre isPublic: true (etudiants)\n4. Filtre skills (intersection tableau)\n5. Filtre domain (regex sur sector/field)\n6. Filtre city (regex sur location)\n7. Exclure l'utilisateur courant\n8. Projection : nom, avatar, headline,\n   skills, location, role\n9. Sort par pertinence / createdAt\n10. Skip + Limit (pagination)

db --> api : Profils filtres\n+ count total

api --> front : 200 {success: true,\ndata: {\n  profiles: [...],\n  total,\n  page,\n  totalPages\n}}

front --> user : Afficher grille de cartes profil\n(avatar, nom, headline, skills badges,\nlocalisation, bouton "Se connecter")

== Recherche avec nouveaux filtres ==

user -> front : Modifier filtres\n(skills, domaine, ville)
front -> api : GET /api/profiles/directory\n?skills=python&domain=Data\n&page=1&limit=20
note right of front : Debounce 300ms\npour eviter les requetes excessives
api -> db : Pipeline d'aggregation\navec nouveaux filtres
db --> api : Nouveaux resultats
api --> front : 200 {data: {profiles, total, ...}}
front --> user : Mettre a jour la grille

@enduml
```

### 2.4 Publier une Opportunite (BF-004 — Recruteur)

```plantuml
@startuml SEQ_PostOpportunity
!theme plain
skinparam sequenceMessageAlign center

actor Recruteur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /opportunities/create\nRemplir formulaire :\ntitle, description, type,\nlocation, domain, skills[],\nrequirements, deadline
front -> front : Validation Zod cote client

front -> api : POST /api/opportunities\n{title, description, type,\nlocation, domain, skills,\nrequirements, deadline}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(RECRUITER)
alt Role !== recruiter
  mw --> front : 403 {success: false,\nmessage: "Forbidden"}
  front --> user : Afficher erreur
else Role autorise
  mw --> api : req.user = {userId, role}
  api -> api : Validation Zod cote serveur\n(title requis, type enum,\nskills tableau, deadline Date)

  alt Donnees invalides
    api --> front : 400 {success: false,\nerrors: [{field, message}]}
    front --> user : Afficher erreurs de validation
  else Donnees valides
    api -> db : Creer Opportunity\n{recruiterId: req.user.userId,\ntitle, description, type,\nlocation, domain, skills,\nrequirements, deadline,\nstatus: "pending"}
    db --> api : Opportunity creee
    api --> front : 201 {success: true,\nmessage: "Opportunity created\n(pending approval)",\ndata: {opportunity}}
    front --> user : Rediriger vers\n/opportunities/mine\n+ toast succes
  end
end

note right of db
  Status "pending" par defaut.
  La validation admin (BF-007)
  sera implementee au Sprint 3.
end note

@enduml
```

### 2.5 Rechercher des Opportunites (BF-004)

```plantuml
@startuml SEQ_SearchOpportunities
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db

user -> front : Naviguer vers /opportunities
front -> api : GET /api/opportunities\n?type=stage\n&location=Tunis\n&domain=IT\n&page=1&limit=20

note right of front : Endpoint public,\npas d'authentification requise\npour consulter les opportunites

api -> api : Valider query params\n(type enum optionnel,\npage/limit numeriques)

api -> db : Requete Opportunity :\n1. Filtre status: "approved"\n2. Filtre type (si specifie)\n3. Filtre location (regex)\n4. Filtre domain (regex)\n5. Filtre skills (intersection, si specifie)\n6. Sort par createdAt desc\n7. Populate recruiterId ->\n   (companyName, avatar, username)\n8. Skip + Limit (pagination)

db --> api : Opportunites filtrees\n+ count total

api --> front : 200 {success: true,\ndata: {\n  opportunities: [...],\n  total,\n  page,\n  totalPages\n}}

front --> user : Afficher liste de cartes :\ntitle, type (badge), location,\ndomain, deadline, recruteur\n(logo + nom entreprise)

== Appliquer de nouveaux filtres ==

user -> front : Changer filtres\n(type, localisation, domaine)
front -> api : GET /api/opportunities\n?type=emploi&domain=Dev\n&page=1&limit=20
api -> db : Requete avec nouveaux filtres
db --> api : Nouveaux resultats
api --> front : 200 {data: {opportunities, ...}}
front --> user : Mettre a jour la liste

@enduml
```

### 2.6 Postuler a une Opportunite (BF-004 — Etudiant)

```plantuml
@startuml SEQ_ApplyOpportunity
!theme plain
skinparam sequenceMessageAlign center

actor Etudiant as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Consulter detail opportunite\n(/opportunities/:id)
front -> api : GET /api/opportunities/:id
api -> db : Chercher Opportunity par _id\n+ populate recruiterId
db --> api : Opportunity
api --> front : 200 {data: {opportunity}}
front --> user : Afficher detail opportunite\navec bouton "Postuler"

user -> front : Cliquer "Postuler"\n(coverLetter optionnel)
front -> api : POST /api/applications\n{opportunityId, coverLetter?}\n(Authorization: Bearer <token>)

api -> mw : authenticate + authorize(STUDENT)
alt Role !== student
  mw --> front : 403 {success: false,\nmessage: "Only students can apply"}
  front --> user : Afficher erreur
else Autorise
  mw --> api : req.user = {userId, role}
  api -> api : Validation Zod\n(opportunityId requis)

  api -> db : Chercher Opportunity par _id
  alt Opportunite non trouvee ou status !== "approved"
    api --> front : 404 {success: false,\nmessage: "Opportunity not found\nor not available"}
    front --> user : Afficher erreur
  else Opportunite trouvee et approuvee
    api -> api : Verifier deadline\n(deadline >= now ou null)
    alt Deadline depassee
      api --> front : 400 {success: false,\nmessage: "Opportunity no longer\naccepting applications"}
      front --> user : Afficher erreur
    else Deadline valide
      api -> db : Chercher Application existante\n{studentId, opportunityId}
      alt Deja postule
        api --> front : 409 {success: false,\nmessage: "Already applied\nto this opportunity"}
        front --> user : Afficher erreur
      else Premiere candidature
        api -> db : Creer Application\n{studentId: req.user.userId,\nopportunityId,\nstatus: "pending",\ncoverLetter,\nappliedAt: new Date()}
        db --> api : Application creee
        api -> mail : Notifier le recruteur\n"Nouvelle candidature recue"\n(optionnel)
        api --> front : 201 {success: true,\nmessage: "Application submitted",\ndata: {application}}
        front --> user : Mettre a jour bouton\n"Deja postule"\n+ toast succes
      end
    end
  end
end

@enduml
```

### 2.7 Suivre les Candidatures (BF-004 — Etudiant & Recruteur)

```plantuml
@startuml SEQ_TrackApplications
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

== Perspective Etudiant : Suivre ses candidatures ==

user -> front : Naviguer vers /applications
front -> api : GET /api/applications/mine\n?page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Applications\n{studentId: req.user.userId}\nPopulate opportunityId ->\n(title, type, location, domain,\nstatus, recruiterId -> companyName)\nSort par appliedAt desc\nSkip + Limit

db --> api : Applications + total

api --> front : 200 {success: true,\ndata: {\n  applications: [...],\n  total, page, totalPages\n}}

front --> user : Afficher liste de candidatures :\ntitre opportunite, entreprise,\ntype (badge), date candidature,\nstatut (badge couleur)

== Perspective Recruteur : Consulter candidatures recues ==

user -> front : Naviguer vers detail opportunite\npuis onglet "Candidatures"
front -> api : GET /api/applications/opportunity/:oppId\n?page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Opportunity par _id
api -> api : Verifier opportunity.recruiterId\n=== req.user.userId
alt Pas le proprietaire
  api --> front : 403 {success: false,\nmessage: "Forbidden"}
  front --> user : Afficher erreur
else Proprietaire confirme
  api -> db : Chercher Applications\n{opportunityId}\nPopulate studentId ->\n(firstName, lastName, avatar,\nusername, email)\nPopulate profil etudiant ->\n(headline, skills, location)\nSort par appliedAt desc\nSkip + Limit

  db --> api : Applications + total

  api --> front : 200 {success: true,\ndata: {\n  applications: [...],\n  total, page, totalPages\n}}

  front --> user : Afficher liste des candidats :\navatar, nom, headline, skills,\ndate candidature, statut,\nboutons d'action
end

== Recruteur : Mettre a jour le statut ==

user -> front : Changer statut candidature\n(reviewed / shortlisted /\naccepted / rejected)
front -> api : PATCH /api/applications/:applicationId/status\n{status: "accepted"}\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : OK

api -> api : Validation Zod\n(status: enum ApplicationStatus)

api -> db : Chercher Application par _id\n+ populate opportunityId
api -> api : Verifier opportunity.recruiterId\n=== req.user.userId

alt Pas le proprietaire de l'opportunite
  api --> front : 403 {success: false}
  front --> user : Afficher erreur
else Autorise
  api -> db : Mettre a jour Application\n{status: nouveau statut}
  db --> api : Application mise a jour

  api -> mail : Notifier l'etudiant\ndu changement de statut\n(optionnel)

  api --> front : 200 {success: true,\nmessage: "Application status updated",\ndata: {application}}
  front --> user : Mettre a jour badge statut\n+ toast succes
end

@enduml
```

### 2.8 Creer / Modifier / Supprimer un Post — Social Feed (BF-003)

```plantuml
@startuml SEQ_PostCRUD
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

== Creer un Post ==

user -> front : Remplir formulaire\n(contenu texte)
front -> front : Validation Zod cote client\n(content requis, max 2000 car.)
front -> api : POST /api/posts\n{content}\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> api : Validation Zod serveur\n(content: string, 1-2000 car.)

alt Donnees invalides
  api --> front : 400 {success: false,\nerrors: [{field, message}]}
  front --> user : Afficher erreurs
else Donnees valides
  api -> db : Creer Post\n{authorId: req.user.userId,\ncontent, likesCount: 0,\ncommentsCount: 0}
  db --> api : Post cree
  api --> front : 201 {success: true,\nmessage: "Post created",\ndata: {post}}
  front --> user : Ajouter le post\nen haut du fil\n+ toast succes
end

== Modifier un Post ==

user -> front : Cliquer "Modifier"\nsur son propre post
front -> front : Afficher editeur\navec contenu actuel
user -> front : Modifier le contenu\net valider
front -> api : PATCH /api/posts/:postId\n{content}\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Post par _id
alt Post non trouve
  api --> front : 404 {success: false,\nmessage: "Post not found"}
  front --> user : Afficher erreur
else Post trouve
  alt req.user.userId !== post.authorId\nAND req.user.role !== "admin"
    api --> front : 403 {success: false,\nmessage: "Forbidden"}
    front --> user : Afficher erreur
  else Autorise (auteur ou admin)
    api -> api : Validation Zod\n(content: 1-2000 car.)
    api -> db : Mettre a jour Post\n{content, updatedAt}
    db --> api : Post mis a jour
    api --> front : 200 {success: true,\nmessage: "Post updated",\ndata: {post}}
    front --> user : Mettre a jour le post\ndans le fil + toast succes
  end
end

== Supprimer un Post ==

user -> front : Cliquer "Supprimer"\nsur son propre post
front -> front : Afficher dialogue\nde confirmation
user -> front : Confirmer suppression
front -> api : DELETE /api/posts/:postId\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Post par _id
alt Post non trouve
  api --> front : 404 {success: false,\nmessage: "Post not found"}
  front --> user : Afficher erreur
else Post trouve
  alt req.user.userId !== post.authorId\nAND req.user.role !== "admin"
    api --> front : 403 {success: false,\nmessage: "Forbidden"}
    front --> user : Afficher erreur
  else Autorise (auteur ou admin)
    api -> db : Supprimer Post par _id
    api -> db : Supprimer tous les Likes\nassocies au post
    api -> db : Supprimer tous les Commentaires\nassocies au post
    db --> api : Suppression effectuee
    api --> front : 200 {success: true,\nmessage: "Post deleted"}
    front --> user : Retirer le post du fil\n+ toast succes
  end
end

@enduml
```

### 2.9 Consulter le Fil d'Actualite — Social Feed (BF-003)

```plantuml
@startuml SEQ_ViewFeed
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

user -> front : Naviguer vers /feed
front -> api : GET /api/posts\n?page=1&limit=20\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Pipeline d'aggregation :\n1. Sort par createdAt desc\n2. Populate authorId ->\n   (firstName, lastName, avatar,\n   username, role)\n3. Ajouter champ isLikedByMe\n   (lookup Likes)\n4. Skip + Limit (pagination)

db --> api : Posts + count total

api --> front : 200 {success: true,\ndata: {\n  posts: [...],\n  total,\n  page,\n  totalPages\n}}

front --> user : Afficher fil d'actualite :\navatar auteur, nom, role (badge),\ncontenu post, date,\nlikesCount, commentsCount,\nboutons Like / Commenter

== Charger plus ==

user -> front : Scroll vers le bas\n(infinite scroll ou bouton)
front -> api : GET /api/posts\n?page=2&limit=20
api -> db : Pipeline avec offset
db --> api : Posts page 2
api --> front : 200 {data: {posts, ...}}
front --> user : Ajouter les posts\nau fil existant

@enduml
```

### 2.10 Liker / Unliker un Post — Social Feed (BF-003)

```plantuml
@startuml SEQ_LikePost
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

== Liker un Post ==

user -> front : Cliquer sur le bouton\n"Like" (coeur vide)
front -> front : Mise a jour optimiste\n(coeur rempli, likesCount + 1)
front -> api : POST /api/posts/:postId/like\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Post par _id
alt Post non trouve
  api --> front : 404 {success: false,\nmessage: "Post not found"}
  front --> user : Annuler mise a jour optimiste
else Post trouve
  api -> db : Chercher Like existant\n{userId, postId}
  alt Deja like
    api --> front : 409 {success: false,\nmessage: "Already liked"}
    front --> user : Garder etat actuel
  else Pas encore like
    api -> db : Creer Like\n{userId: req.user.userId,\npostId}
    api -> db : Incrementer Post.likesCount\n(+1)
    db --> api : Like cree
    api --> front : 201 {success: true,\nmessage: "Post liked",\ndata: {likesCount}}
    front --> user : Confirmer mise a jour\n(coeur rempli)
  end
end

== Unliker un Post ==

user -> front : Cliquer sur le bouton\n"Like" (coeur rempli)
front -> front : Mise a jour optimiste\n(coeur vide, likesCount - 1)
front -> api : DELETE /api/posts/:postId/like\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Like\n{userId, postId}
alt Like non trouve
  api --> front : 404 {success: false,\nmessage: "Like not found"}
  front --> user : Annuler mise a jour optimiste
else Like trouve
  api -> db : Supprimer Like
  api -> db : Decrementer Post.likesCount\n(-1)
  db --> api : Like supprime
  api --> front : 200 {success: true,\nmessage: "Post unliked",\ndata: {likesCount}}
  front --> user : Confirmer mise a jour\n(coeur vide)
end

@enduml
```

### 2.11 Commenter un Post — Social Feed (BF-003)

```plantuml
@startuml SEQ_CommentPost
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

== Ajouter un Commentaire ==

user -> front : Ecrire un commentaire\net cliquer "Envoyer"
front -> api : POST /api/posts/:postId/comments\n{content}\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> api : Validation Zod\n(content: string, 1-1000 car.)

api -> db : Chercher Post par _id
alt Post non trouve
  api --> front : 404 {success: false,\nmessage: "Post not found"}
  front --> user : Afficher erreur
else Post trouve
  api -> db : Creer Comment\n{authorId: req.user.userId,\npostId, content}
  api -> db : Incrementer Post.commentsCount\n(+1)
  db --> api : Comment cree
  api --> front : 201 {success: true,\nmessage: "Comment added",\ndata: {comment}}
  front --> user : Afficher le commentaire\nsous le post\n+ incrementer compteur
end

== Consulter les Commentaires ==

user -> front : Cliquer "Voir commentaires"\nsur un post
front -> api : GET /api/posts/:postId/comments\n?page=1&limit=10\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Comments\n{postId}\nPopulate authorId ->\n(firstName, lastName, avatar, username)\nSort par createdAt asc\nSkip + Limit

db --> api : Comments + total

api --> front : 200 {success: true,\ndata: {\n  comments: [...],\n  total, page, totalPages\n}}

front --> user : Afficher liste des commentaires\n(avatar, nom, contenu, date,\nbouton supprimer si auteur)

== Supprimer un Commentaire ==

user -> front : Cliquer "Supprimer"\nsur son commentaire
front -> front : Afficher dialogue\nde confirmation
user -> front : Confirmer suppression
front -> api : DELETE /api/posts/:postId/comments/:commentId\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw --> api : req.user = {userId, role}

api -> db : Chercher Comment par _id
alt Comment non trouve
  api --> front : 404 {success: false,\nmessage: "Comment not found"}
  front --> user : Afficher erreur
else Comment trouve
  alt req.user.userId !== comment.authorId\nAND req.user.role !== "admin"
    api --> front : 403 {success: false,\nmessage: "Forbidden"}
    front --> user : Afficher erreur
  else Autorise (auteur ou admin)
    api -> db : Supprimer Comment par _id
    api -> db : Decrementer Post.commentsCount\n(-1)
    db --> api : Comment supprime
    api --> front : 200 {success: true,\nmessage: "Comment deleted"}
    front --> user : Retirer commentaire\nde la liste\n+ decrementer compteur
  end
end

@enduml
```

---

## 3. Diagramme de Classes — Sprint 2

```plantuml
@startuml CLASS_Sprint2
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 13
skinparam classAttributeFontSize 11

' ============================================================
' MODELES EXISTANTS (Sprint 1) - contexte
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
  - education : Education[]
  - experiences : Experience[]
  - projects : Project[]
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

note right of User
  Modeles existants du Sprint 1.
  Fond vert = deja implementes.
end note

' ============================================================
' NOUVEAUX ENUMS (Sprint 2)
' ============================================================

enum ConnectionStatus {
  PENDING = "pending"
  ACCEPTED = "accepted"
  REJECTED = "rejected"
}

enum OpportunityType {
  STAGE = "stage"
  EMPLOI = "emploi"
  BENEVOLAT = "benevolat"
}

enum OpportunityStatus {
  PENDING = "pending"
  APPROVED = "approved"
  REJECTED = "rejected"
  CLOSED = "closed"
}

enum ApplicationStatus {
  PENDING = "pending"
  REVIEWED = "reviewed"
  SHORTLISTED = "shortlisted"
  ACCEPTED = "accepted"
  REJECTED = "rejected"
}

' ============================================================
' NOUVEAUX MODELES (Sprint 2)
' ============================================================

class Connection <<Document>> #FFF3E0 {
  - _id : ObjectId
  - senderId : ObjectId <<FK>>
  - receiverId : ObjectId <<FK>>
  - status : ConnectionStatus
  - createdAt : Date
  - updatedAt : Date
  __
  Index: {senderId, receiverId} unique
  Index: {receiverId, status}
  Index: {senderId, status}
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
  __
  Index: {recruiterId}
  Index: {status, type}
  Index: {skills}
  Index: {domain}
  Index: {location}
}

class Application <<Document>> #FFF3E0 {
  - _id : ObjectId
  - studentId : ObjectId <<FK>>
  - opportunityId : ObjectId <<FK>>
  - status : ApplicationStatus
  - coverLetter? : string
  - appliedAt : Date
  - updatedAt : Date
  __
  Index: {studentId, opportunityId} unique
  Index: {opportunityId, status}
  Index: {studentId}
}

class Post <<Document>> #FFF3E0 {
  - _id : ObjectId
  - authorId : ObjectId <<FK>>
  - content : string {1-2000}
  - likesCount : number {default: 0}
  - commentsCount : number {default: 0}
  - createdAt : Date
  - updatedAt : Date
  __
  Index: {authorId}
  Index: {createdAt}
}

class Like <<Document>> #FFF3E0 {
  - _id : ObjectId
  - userId : ObjectId <<FK>>
  - postId : ObjectId <<FK>>
  - createdAt : Date
  __
  Index: {userId, postId} unique
  Index: {postId}
}

class Comment <<Document>> #FFF3E0 {
  - _id : ObjectId
  - authorId : ObjectId <<FK>>
  - postId : ObjectId <<FK>>
  - content : string {1-1000}
  - createdAt : Date
  - updatedAt : Date
  __
  Index: {postId, createdAt}
  Index: {authorId}
}

note right of Connection
  Nouveaux modeles du Sprint 2.
  Fond orange = a implementer.
end note

' ============================================================
' NOUVEAUX SERVICES (Sprint 2)
' ============================================================

class ConnectionService <<Service>> {
  + sendRequest(senderId, receiverId) : Connection
  + respondToRequest(connectionId, userId, status) : Connection
  + getConnections(userId, page, limit) : {connections, total}
  + getPendingRequests(userId, page, limit) : {connections, total}
  + getSentRequests(userId, page, limit) : {connections, total}
  + getSuggestions(userId, limit) : User[]
  + removeConnection(connectionId, userId) : void
  + getConnectionStatus(userId1, userId2) : string | null
}

class OpportunityService <<Service>> {
  + createOpportunity(recruiterId, data) : Opportunity
  + updateOpportunity(opportunityId, recruiterId, data) : Opportunity
  + closeOpportunity(opportunityId, recruiterId) : Opportunity
  + getOpportunity(opportunityId) : Opportunity
  + searchOpportunities(filters, page, limit) : {opportunities, total}
  + getRecruiterOpportunities(recruiterId, page, limit) : {opportunities, total}
}

class ApplicationService <<Service>> {
  + apply(studentId, opportunityId, coverLetter?) : Application
  + getStudentApplications(studentId, page, limit) : {applications, total}
  + getOpportunityApplications(oppId, recruiterId, page, limit) : {applications, total}
  + updateApplicationStatus(applicationId, recruiterId, status) : Application
  + getApplication(applicationId) : Application
}

class DirectoryService <<Service>> {
  + searchProfiles(filters, page, limit) : {profiles, total}
}

class PostService <<Service>> {
  + createPost(authorId, content) : Post
  + updatePost(postId, userId, role, content) : Post
  + deletePost(postId, userId, role) : void
  + getFeed(userId, page, limit) : {posts, total}
  + getPost(postId) : Post
  + likePost(userId, postId) : Like
  + unlikePost(userId, postId) : void
  + addComment(authorId, postId, content) : Comment
  + getComments(postId, page, limit) : {comments, total}
  + deleteComment(commentId, userId, role) : void
}

' ============================================================
' SERVICE EXISTANT (Sprint 1)
' ============================================================

class EmailService <<Service>> #E8F5E9 {
  + sendVerificationEmail(email, firstName, token) : void
  + sendPasswordResetEmail(email, firstName, token) : void
  + send2FACode(email, firstName, code) : void
  + sendConnectionNotification(email, firstName, senderName) : void
  + sendApplicationNotification(email, opportunityTitle, applicantName) : void
  + sendApplicationStatusUpdate(email, firstName, opportunityTitle, status) : void
}

note left of EmailService
  Methodes en italique =
  nouvelles methodes ajoutees
  au Sprint 2.
end note

' ============================================================
' RELATIONS
' ============================================================

' --- FK Relations ---
User "1" -- "0..*" Connection : envoie\n(senderId) >
User "1" -- "0..*" Connection : recoit\n(receiverId) >
User "1" -- "0..*" Opportunity : publie\n(recruiterId) >
User "1" -- "0..*" Application : postule\n(studentId) >
Opportunity "1" -- "0..*" Application : recoit >
User "1" -- "0..1" StudentProfile : a >
User "1" -- "0..1" RecruiterProfile : a >
User "1" -- "0..*" Post : publie\n(authorId) >
User "1" -- "0..*" Like : donne\n(userId) >
User "1" -- "0..*" Comment : redige\n(authorId) >
Post "1" -- "0..*" Like : recoit >
Post "1" -- "0..*" Comment : contient >

' --- Enum usage ---
Connection ..> ConnectionStatus : utilise >
Opportunity ..> OpportunityType : utilise >
Opportunity ..> OpportunityStatus : utilise >
Application ..> ApplicationStatus : utilise >

' --- Service dependencies ---
ConnectionService ..> Connection : manipule >
ConnectionService ..> User : consulte >
ConnectionService ..> EmailService : utilise >
OpportunityService ..> Opportunity : manipule >
OpportunityService ..> User : consulte >
ApplicationService ..> Application : manipule >
ApplicationService ..> Opportunity : consulte >
ApplicationService ..> User : consulte >
ApplicationService ..> EmailService : utilise >
DirectoryService ..> StudentProfile : consulte >
DirectoryService ..> RecruiterProfile : consulte >
DirectoryService ..> User : consulte >
PostService ..> Post : manipule >
PostService ..> Like : manipule >
PostService ..> Comment : manipule >
PostService ..> User : consulte >

@enduml
```

---

## 4. Diagramme d'Activite — Workflow Candidature Opportunite

```plantuml
@startuml ACT_ApplicationWorkflow
!theme plain
skinparam activityBackgroundColor #FFF3E0
skinparam activityBorderColor #E65100
skinparam activityDiamondBackgroundColor #FFECB3
skinparam activityDiamondBorderColor #E65100
skinparam swimlaneBackgroundColor #FAFAFA
skinparam swimlaneBorderColor #999999

|Recruteur|
start
:Remplir formulaire opportunite\n(titre, description, type,\nlocalisation, domaine,\ncompetences, deadline);

|Systeme|
:Valider donnees (Zod);
if (Donnees valides ?) then (oui)
  :Creer Opportunity\n(status: "pending");
  note right
    Admin validation (BF-007)
    sera ajoutee au Sprint 3.
    Pour le MVP Sprint 2,
    les opportunites restent
    en statut "pending" jusqu'a
    validation admin.
  end note
  :Publier dans l'annuaire\n(si status = "approved");
else (non)
  :Retourner erreurs\nde validation;
  |Recruteur|
  :Corriger le formulaire;
  stop
endif

|Etudiant|
:Naviguer vers /opportunities;
:Appliquer filtres\n(type, localisation, domaine);

|Systeme|
:Retourner opportunites\nfiltrees (status: "approved");

|Etudiant|
:Consulter detail\nopportunite;

|Systeme|
if (Deadline depassee ?) then (oui)
  :Afficher "Candidatures\nfermees";
  |Etudiant|
  stop
else (non)
endif

if (Deja postule ?) then (oui)
  :Afficher "Deja postule";
  |Etudiant|
  stop
else (non)
endif

|Etudiant|
:Cliquer "Postuler"\n(profil pre-rempli,\ncoverLetter optionnel);

|Systeme|
:Creer Application\n(status: "pending",\nappliedAt: maintenant);
:Envoyer notification\nemail au recruteur\n(optionnel);

|Recruteur|
:Consulter candidatures\nrecues pour l'opportunite;
:Examiner profil\nde l'etudiant;

if (Decision ?) then (Interesse)
  :Changer statut\n-> "reviewed";

  |Systeme|
  :Mettre a jour Application;

  |Recruteur|
  if (Preselectioner ?) then (oui)
    :Changer statut\n-> "shortlisted";
    |Systeme|
    :Notifier etudiant\n(optionnel);
  else (non)
  endif

  |Recruteur|
  if (Accepter ?) then (oui)
    :Changer statut\n-> "accepted";
    |Systeme|
    :Notifier etudiant\n"Candidature acceptee";
  else (non)
    :Changer statut\n-> "rejected";
    |Systeme|
    :Notifier etudiant\n"Candidature refusee";
  endif

else (Refuser directement)
  :Changer statut\n-> "rejected";
  |Systeme|
  :Notifier etudiant\n"Candidature refusee";
endif

|Etudiant|
:Consulter suivi\ncandidatures (/applications);
:Voir nouveau statut\n(badge mis a jour);

stop

@enduml
```

---

## Legende

| Diagramme | Description |
|-----------|-------------|
| **1. UC Sprint 2** | Cas d'utilisation specifiques au Sprint 2 : BF-003 (Networking, Annuaire & Social Feed) + BF-004 (Opportunites & Candidatures) |
| **2. Sequences** | Flux detailles des interactions pour chaque fonctionnalite du Sprint 2 (11 diagrammes : 3 Networking, 4 Opportunites, 4 Social Feed) |
| **3. Classes** | Nouveaux modeles de donnees (Connection, Opportunity, Application, Post, Like, Comment), enums et services. Les modeles Sprint 1 sont affiches en contexte (fond vert) |
| **4. Activite** | Workflow complet du cycle de vie d'une candidature : publication -> recherche -> candidature -> evaluation -> decision |

---

*Document genere pour le Sprint 2 de la plateforme ForMinds.*
*Couvre les fonctionnalites BF-003 (Networking, Annuaire & Minimal Social Feed) et BF-004 (Opportunites & Candidatures).*
