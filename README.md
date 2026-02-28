# Smart Community Initiatives Dashboard

A full-stack web application to manage and monitor community initiatives such as waste management, road repairs, water supply projects, and social activities.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Charts: Chart.js
- Authentication: JWT with role-based access (Admin/User)

## Features
- JWT-based authentication with secure password hashing (`bcryptjs`)
- Role-based authorization (`admin`, `user`)
- Admin initiative management (Add, Edit, Delete)
- Initiative dashboard for both users and admins
- Chart.js visualizations:
  - Project completion percentage
  - Budget usage graph
  - Status distribution pie chart
- Feedback system:
  - Users submit feedback per initiative
  - Admin can view all feedback
- Responsive dashboard with sidebar navigation
- Status indicators:
  - Green = Completed
  - Yellow = Ongoing
  - Red = Pending
- Backend MVC architecture with REST APIs
- Included dummy seed data

## Project Structure
```text
Smart_Community/
  backend/
    config/
      db.js
    controllers/
      authController.js
      feedbackController.js
      initiativeController.js
    middleware/
      authMiddleware.js
      roleMiddleware.js
      validate.js
    models/
      Feedback.js
      Initiative.js
      User.js
    routes/
      authRoutes.js
      feedbackRoutes.js
      initiativeRoutes.js
    seed/
      seed.js
    package.json
    server.js
  frontend/
    css/
      styles.css
    js/
      api.js
      app.js
      charts.js
    index.html
  .env.example
  .gitignore
  README.md
```

## Setup Instructions
1. Clone or open this project folder.
2. Create a `.env` file in the project root using `.env.example`.
3. Start MongoDB locally (or use MongoDB Atlas URI in `MONGO_URI`).
4. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
5. Seed dummy data:
   ```bash
   npm run seed
   ```
6. Run the app:
   ```bash
   npm run dev
   ```
7. Open in browser:
   ```
   http://localhost:5000
   ```

## Demo Credentials (after seeding)
- Admin:
  - Email: `admin@smartcommunity.com`
  - Password: `Admin@123`
- User:
  - Email: `user@smartcommunity.com`
  - Password: `User@123`

## REST API Summary
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Initiatives
- `GET /api/initiatives` (authenticated user/admin)
- `GET /api/initiatives/:id` (authenticated user/admin)
- `POST /api/initiatives` (admin)
- `PUT /api/initiatives/:id` (admin)
- `DELETE /api/initiatives/:id` (admin)

### Feedback
- `POST /api/feedback` (authenticated user/admin)
- `GET /api/feedback/initiative/:initiativeId` (authenticated user/admin)
- `GET /api/feedback` (admin)

## Notes
- Frontend form validation and backend request validation are both included.
- Frontend is served as static files from Express (`frontend/`).
- If you want live real-time updates, swap MongoDB backend with Firebase Firestore listeners.
