# ForMinds Web Platform - Architecture & Component Relationships

This document provides a comprehensive, deep-dive explanation of the ForMinds Web Platform architecture. It maps out the exact relationships between the database layer, the backend API server, the AI microservice, and the frontend components.

---

## 1. High-Level Architecture Overview

The platform uses a distributed, service-oriented architecture designed to separate core transactional operations from heavy AI processing tasks.

```mermaid
graph TD
    Client[Next.js Frontend Client] -->|REST HTTP/HTTPS| Nginx[Nginx Reverse Proxy]
    Nginx -->|Routes /api/*| Backend[Node.js / Express Backend]
    Nginx -->|Routes /*| Client
    Backend -->|CRUD Operations| DB[(MongoDB)]
    Backend -->|Internal HTTP| AI[Python / FastAPI AI Service]
    AI -->|Read/Sync Data (Optional)| DB
```

### Components Summary:
1. **Frontend**: Next.js 16 (React 19), Tailwind CSS, React Hook Form, `react-i18next`.
2. **Backend**: Node.js, Express.js 4, Mongoose ORM.
3. **AI Service**: Python 3.11, FastAPI, Scikit-Learn/NLP models.
4. **Database**: MongoDB 7.

---

## 2. Database Design & Entity Relationships

The data layer is built on MongoDB using Mongoose as the ODM. The design heavily utilizes referencing (`Schema.Types.ObjectId`) to maintain relationships between entities.

### Core Entities & Relationships

*   **`User`**: The foundational entity. Every actor on the platform is a User.
    *   **Fields**: `email`, `password`, `role` (`STUDENT`, `RECRUITER`, `ADMIN`), `authProvider`.
    *   **Relations**: Almost every other entity references the `User` model as an author, creator, or target.

*   **`StudentProfile` & `RecruiterProfile` (One-to-One with User)**
    *   **StudentProfile**: Contains `skills` (Array), `education` (Array of subdocuments), `experiences`, `projects`, and `cvUrl`. Refers to `userId`.
    *   **RecruiterProfile**: Contains `companyName`, `industry`, `verified` status. Refers to `userId`.

*   **`Opportunity` (One-to-Many from Recruiter)**
    *   **Description**: Job or internship postings.
    *   **Fields**: `title`, `description`, `requirements` (skills), `location`.
    *   **Relations**: `recruiterId` -> `User` (Role: Recruiter).

*   **`Application` (Many-to-Many bridge between Student and Opportunity)**
    *   **Description**: A student applying for an opportunity.
    *   **Relations**: `studentId` -> `User`, `opportunityId` -> `Opportunity`.
    *   **AI Integration**: Contains an `aiMatchScore` field populated by the AI Service.

*   **`Event` & `Registration`**
    *   **Event**: Created by a Recruiter (`organizerId` -> `User`).
    *   **Registration**: A student registering for an event. (`eventId` -> `Event`, `studentId` -> `User`). Includes a `ticketId` for QR check-ins.

*   **Networking & Social Feed**
    *   **`Connection`**: Represents a network link. `requester` -> `User`, `recipient` -> `User`, `status` (pending, accepted).
    *   **`Post`**: `author` -> `User`.
    *   **`Comment`**: `post` -> `Post`, `author` -> `User`.
    *   **`Like`**: `post` -> `Post`, `user` -> `User`.

---

## 3. Backend API Layer (Express.js)

The backend acts as the central router and business logic executor. It is structured into Routes, Controllers, and Services.

### Key API Modules and Their DB Interactions:

1.  **Auth Module (`/api/auth`)**
    *   Manages JWT generation, Password hashing (Bcrypt), and 2FA (Email OTP).
    *   Interacts directly with the `User` model.

2.  **Profile Module (`/api/profiles`)**
    *   Handles fetching and updating the specialized profiles.
    *   Dynamically synchronizes skills from nested documents (e.g., extracting skills from a Student's `experiences` array and updating the root `skills` array).

3.  **Opportunities & Matching Module (`/api/opportunities`, `/api/matching`)**
    *   Recruiters create Opportunities here.
    *   **The AI Bridge**: When a student requests matched jobs, the backend controller fetches the `StudentProfile` and available `Opportunities` from MongoDB. It then makes an HTTP POST request to the **AI Service** with this data. The AI service computes the compatibility scores and returns them. The backend merges this score into the response payload for the frontend.

4.  **Events Module (`/api/events`)**
    *   Handles event creation.
    *   Generates QR codes for `Registrations`.
    *   Provides check-in endpoints used by the Recruiter's frontend QR scanner.

---

## 4. AI Service (Python / FastAPI)

The AI Service is completely decoupled from the transactional flow. It runs on a separate port/container.

### How it operates:
1.  **Endpoints**: Exposes endpoints like `/api/match/score`.
2.  **Input**: Receives JSON payloads containing structured data (Student skills, descriptions vs. Opportunity requirements).
3.  **Processing**: Uses NLP techniques (like TF-IDF or embedding vector cosine similarity) to calculate how well a candidate fits a job description.
4.  **Output**: Returns a JSON array of `opportunityId` and `score` (e.g., `85%`).
5.  **Relationship**: It is a stateless calculation engine. It relies entirely on the Node.js backend to provide the data to evaluate, meaning the Python service doesn't strictly need direct DB access (unless caching embeddings).

---

## 5. Frontend Architecture (Next.js App Router)

The frontend maps directly to the API structures but focuses on user experience and state management.

### Directory Structure & Component Relationships:
*   **`src/app/(dashboard)`**: Contains the main authenticated layouts.
    *   `/jobs`: Maps to the Opportunities API. Displays lists of jobs sorted by AI Match Score.
    *   `/network`: Maps to Connections API. Shows user directory and pending requests.
    *   `/events`: Maps to Events API. Shows calendar, registration buttons, and the QR check-in scanner page.
*   **`src/components`**: Reusable UI blocks.
    *   `/events/EventCard.tsx`, `/events/EventForm.tsx`: Connects to `react-hook-form` and validates via `Zod` schemas before sending data to `/api/events`.
*   **`src/lib/i18n.ts` & `src/locales/`**: The entire UI text is dynamic. The `react-i18next` configuration wraps components so the language can switch dynamically between French and English.
*   **API Client (`src/lib/axios` or fetch wrappers)**: Interceptors attach the JWT bearer token to every request heading to the Backend.

---

## 6. End-to-End Flow Example: Applying for a Job

1.  **Frontend**: Student views `/jobs`. UI requests `/api/opportunities/recommended`.
2.  **Backend**: Receives request, identifies the Student via JWT.
3.  **Backend**: Fetches `StudentProfile` from MongoDB. Fetches active `Opportunity` list.
4.  **Backend -> AI Service**: Sends the profile and opportunities list to the Python AI Service.
5.  **AI Service**: Calculates scores based on skill overlap and NLP semantic matching. Returns scores.
6.  **Backend**: Sorts the opportunities by highest score. Sends JSON to Frontend.
7.  **Frontend**: Renders `JobCard` components.
8.  **Frontend Action**: Student clicks "Apply". Frontend POSTs to `/api/applications`.
9.  **Backend**: Creates a new `Application` document in MongoDB linking `studentId` and `opportunityId`, attaching the computed `aiMatchScore`.
10. **Backend**: Triggers a notification (or email via Nodemailer) to the Recruiter.

---

## 7. Security Boundaries & Middleware

*   **Auth Middleware**: Every protected Express route uses an `authenticate` middleware that parses the JWT token from the `Authorization` header.
*   **Role Middleware**: Certain routes (`/api/admin/*`, creating events) have an `authorize(UserRole.RECRUITER)` middleware. If a `STUDENT` token attempts access, it yields a 403 Forbidden.
*   **AI Service Boundary**: The Python AI service is NOT exposed to the public web. Nginx only routes external traffic to the Node.js backend. The Node.js backend talks to the AI service over the internal Docker network (`forminds_network`), ensuring malicious users cannot spoof match scores.

### 1. Routes (/routes) - The Traffic Cop
Role: Routes define your API's endpoints (URLs) and HTTP methods (GET, POST, PUT, DELETE). They are the very first point of contact for an incoming request.

What it does: It looks at the incoming URL (e.g., POST /api/events), applies any necessary Middleware, and then forwards the request to the correct Controller.
Example: router.post('/', authenticate, authorize(UserRole.RECRUITER), eventController.createEvent);

### 2. Middleware (/middleware) - The Bouncer / Inspector
Role: Middleware functions run before the request reaches the Controller. They intercept the request to perform checks or modifications.

What it does:
Authentication: Checks if the user has a valid JWT token (authenticate).
Authorization: Checks if the user has the right permissions (e.g., authorize(UserRole.RECRUITER) prevents students from creating events).
Data Parsing: Handles file uploads (like Multer for images/CVs).
If a middleware check fails, it blocks the request and sends an error back immediately.

### 3. Controllers (/controllers) - The Translator
Role: Controllers are responsible for handling the HTTP Request (req) and sending the HTTP Response (res).

What it does:
Extracts data from the request (req.body, req.params, req.user).
Validates the incoming data format (e.g., using Zod schemas, as seen in your event.controller.ts).
Passes the clean data to the Service layer.
Takes the result from the Service and formats it into a JSON HTTP response (e.g., res.status(201).json(data)).


### 4. Services (/services) - The Brains (Business Logic)
Role: Services contain the actual core business logic of your application. They are completely independent of Express HTTP objects (req / res).

What it does:
Executes complex operations, algorithms, or multi-step processes.
Interacts with the Models to read/write to the database.
Calls external APIs (like sending an email via Nodemailer or communicating with your Python AI service).
Why it's useful: Because it doesn't rely on req/res, you can reuse a service function anywhere (e.g., calling an event creation service from an API route, or from a background cron job script).
5. Models (/models) - The Blueprint / Data Layer
Role: Models represent your database schema and provide an interface to interact with MongoDB.

What it does:
Defines the exact structure of your data (e.g., an Event must have a title, date, and organizerId).
Handles database-level validation before saving.
Provides the methods (via Mongoose) to actually perform database operations like Event.findById(), Event.create(), or User.updateOne().

### 6. Scripts (/scripts) - The Maintenance Crew
Role: Scripts are standalone files that are not part of the running Express server.

What it does: They are executed manually via the terminal (e.g., npm run seed) to perform utility tasks such as:
Seeding the database: Populating the DB with fake test data (dummy users, events, jobs).
Migrations: Updating database records if your schema changes.
Cleanup: Deleting expired tokens or old logs.
Summary of the Flow:
A Recruiter sends a POST request to /api/events.
The Route catches it and sends it through the authenticate Middleware.
The Middleware verifies the user and passes it to the createEvent Controller.
The Controller validates the JSON body using Zod and calls eventService.createEvent(...).
The Service takes the data, perhaps generates a QR code, and uses the Event Model to save it to MongoDB.
The Service returns the newly created event to the Controller.
The Controller sends a 201 Created HTTP response back to the Recruiter's browser.
