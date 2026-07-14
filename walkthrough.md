# LegalAssist Development Walkthrough

This walkthrough documents the full-stack development details of the **LegalAssist – AI-Powered Citizen Legal Guidance System** web application.

## Accomplished Tasks

We successfully scaffolded, coded, and integrated both the frontend and backend architectures:

### 1. Backend Service Layer (`/backend`)
- **Server Entry (`server.js`)**: Coordinates routers, initializes Mongoose database, logs static asset paths, enforces rate limit rules, and serves the compiled frontend assets directly in production.
- **Config & DB Connection (`config/db.js`, `config/gemini.js`)**: Establishes connections to MongoDB and initiates the Google Gemini API client with a fallback mock system.
- **Database Models (`models/User.js`, `models/Complaint.js`, `models/Notification.js`, `models/Feedback.js`, `models/Support.js`, `models/AdvocateReview.js`)**: Defines schemas for JWT sessions, structured AI legal guidelines, advocate advice logs, in-app notifications, citizen ratings, contact support requests, and advocate profile reviews.
- **API Controllers & Routes (`controllers/`, `routes/`)**: Implements clean architecture REST modules for JWT auth, password resets, citizen submissions, follow-up chats, advocate responses, admin charts aggregation, support ticket auditing, and advocate feedback loops.
- **Middlewares (`middleware/`)**: Formulates security limit protections including rate-limit boundaries, file uploads validation using Multer, and role-based permissions (Citizen, Advocate, Admin).
- **PDF Report Compiler (`services/pdfService.js`)**: Standardizes case summaries, statutes, procedure timelines, and disclaimer requirements into elegant, download-streamed PDF documents using `pdfkit`.

### 2. Frontend User Experience (`/frontend`)
- **Global Context (`context/AuthContext.jsx`, `context/ThemeContext.jsx`, `context/ToastContext.jsx`)**: Manages JWT credentials, toggle transitions (light/dark mode), and slide-in notifications.
- **API Linker (`services/api.js`)**: Embeds interceptors to automatically forward tokens and clear expired credential caches.
- **Common Layout (`components/Navbar.jsx`, `components/Footer.jsx`, `components/ProtectedRoute.jsx`)**: Handles burger navigation, notifications bells, warning boxes, and route blocks.
- **View Portals (`pages/`)**:
  - *Public*: Landing Page (Timelines, Heroes), About, Services list, FAQ accordions, and Contact forms.
  - *Auth*: Login, Register, Forgot Password, Reset Password, and Verify Email.
  - *Citizen*: Dashboard stats, file upload lodge forms, evidence check-offs (saved to local storage), follow-up Gemini chat logs, advocate review submission panels, and video call controllers.
  - *Advocate*: Case directories (Open/Responded) and Guidance workspaces.
  - *Admin*: Analytics dashboards drawing Recharts distribution pies/line charts, geographical distribution heatmap bar charts, user profile controllers, and feedback/support auditors.

### 🌟 3. Premium Interactive Additions (New!)
- **🎤 Speech-to-Text Dictation**: Incorporated Web Speech API inside the complaint details form (`SubmitComplaint.jsx`), allowing users to speak their grievance naturally and translate voice input to text.
- **📖 Hover-based Legal Dictionary (De-Legalese)**: Built a dynamic translation parser (`DeLegaleseText.jsx`) that underlines complex legalese terms in the AI report and shows definitions in tooltips upon hovering.
- **📄 AI Legal Notice Draft Builder**: Created a pre-filled legal warning notice generator modal (`ComplaintDetail.jsx`) that allows citizens to review, edit, copy, or download a formal letter draft for counterparties based on Gemini's analysis.
- **⭐ Advocate Reviews & Ratings**: Implemented a comprehensive rating system (`AdvocateReview.js`, `advocateReviewRoutes.js`) allowing citizens to star-rate (1-5 stars) and review advocate profiles after a consultation.
- **📊 Admin Geographical Grievance Map (Heatmap)**: Created an interactive regional distribution bar chart (`AdminDashboard.jsx`) using Recharts, grouping complaints by state (density-coded) to show areas of high dispute activity.
- **🎥 WebRTC Jitsi Video Consultation & Slot Booking**: Built a complete request-approve video call scheduling system. Citizens select a preferred date and time to request a slot from a specific advocate. Advocates receive this request and can confirm, decline, or change the meeting time. Confirming a slot generates a unique Jitsi Meet WebRTC room and dispatches an alert notification back to the citizen, who can join the call directly from their dashboard with one click.
- **💳 Consultation Fee Payment Gateway Simulation**: Implemented a simulated secure checkout gateway (Razorpay/Stripe-like modal overlay) inside the citizen portal. Advocates specify consultation fees on their response panels. Citizens pay this fee using card credentials. The checkout features card number format spacing, processing spinners, simulated OTP verification code challenges (enter '1234'), transaction success triggers, database update logs, and green payment-verified receipt badges.

---

## Action Plan to Start the Application

There are two ways to run the completed application:

### Option A: Integrated Production Mode (Recommended for Presentations)
In this mode, the backend server handles both the API endpoints and serves the frontend React pages directly from a single port (`5000`).

1. **Build the Frontend Assets**:
   ```bash
   cd frontend
   npm run build
   ```
   *(This compiles code and creates the `/frontend/dist` static assets folder)*
2. **Configure Environment**:
   Open `/backend/.env` and update the environment setting:
   ```env
   NODE_ENV=production
   ```
3. **Start the Database & Seed**:
   Ensure MongoDB is running, then seed the admin:
   ```bash
   cd ../backend
   node bin/create-admin.js
   ```
4. **Boot Server**:
   ```bash
   npm start
   ```
5. Open your browser and navigate to: **[http://localhost:5000/](http://localhost:5000/)**

---

### Option B: Standalone Development Mode (Dual Ports)
Use this mode if you want to make live changes to the code while the server is active.

1. **Start the Backend server (Port 5000)**:
   Ensure MongoDB is running, update `.env` to `NODE_ENV=development`, then run:
   ```bash
   cd backend
   npm start
   ```
2. **Start the Frontend Vite server (Port 5173 / 5174)**:
   In a new terminal window, run:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open the active Vite URL shown in your terminal.
