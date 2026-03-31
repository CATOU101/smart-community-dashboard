# CivicSync

CivicSync is a full-stack community operations dashboard for tracking public initiatives and handling citizen issue requests. It uses a single Express server to expose REST APIs and serve the frontend application.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT + bcrypt password hashing
- Charts: Chart.js
- Maps: Leaflet.js + OpenStreetMap

## Current Feature Set

### Authentication and Access Control

- User registration
- User login
- JWT-based protected routes
- Role-based access for `admin` and `user`

### Initiatives

- Admin can add, edit, and delete initiatives
- Initiatives include:
  - title
  - description
  - location
  - category
  - budget
  - budget used
  - start date
  - end date
  - status
  - progress percentage
  - latitude / longitude
- Users and admins can view initiatives in a searchable dashboard
- Status filter is available on the frontend
- Progress bars and budget usage are displayed in the initiative table

### Dashboard and Analytics

- Summary cards for:
  - total initiatives
  - completed
  - ongoing
  - pending
  - total budget
- Chart.js visualizations for:
  - progress tracking
  - budget usage
  - status distribution

### Maps

- Initiative map with Leaflet markers
- Marker popup includes:
  - title
  - progress
  - status
  - link to jump to the initiative row
- Issue submission map for selecting coordinates
- Approved issues map for public issue viewing

### Feedback

- Users can submit initiative feedback
- Feedback supports an optional image upload
- Admin can review and delete feedback entries

### Issue Requests

- Logged-in users can submit issue requests
- Issue requests include:
  - title
  - description
  - category
  - severity
  - latitude / longitude
  - optional images
- Approved issues can be supported by logged-in users through an upvote-style toggle
- Admin can:
  - view all issue requests
  - approve requests
  - reject requests with a reason
  - convert approved requests into initiatives
  - view request details and uploaded images
- Admin can see read-only support counts in the issue table
- Users can view their own requests and track status updates
- Approved public issues are visible in a dedicated frontend section

### Notifications

- Logged-in users have an in-app notification bell in the top navbar
- Unread notification count is shown as a badge
- Notifications can be marked as read individually or all at once
- Notifications are created automatically when:
  - an issue is approved
  - an issue is rejected
  - an issue is converted into an initiative
  - a converted initiative is later marked completed
- The frontend fetches notifications after login and polls for updates every 30 seconds

### Private / Personal Request Filtering

- Issue requests are checked with a scoring-based filter
- The filter combines title and description
- Requests mentioning personal/private places are flagged automatically
- Flagged requests are set to `Under Review`
- Requests are not auto-rejected; admin review is still required

### Severity Levels

Issue severity is supported with the following values:

- `Low`
- `Medium`
- `High`
- `Critical`

## Removed Feature

The previously started `area`-based filtering feature has been removed from the project.

- No `area` field in `Initiative`
- No `area` field in `IssueRequest`
- No area filter dropdowns in the frontend
- No backend filtering with `req.query.area`

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
      notificationController.js
      issueController.js
    middleware/
      authMiddleware.js
      roleMiddleware.js
      validate.js
    models/
      Feedback.js
      Initiative.js
      IssueRequest.js
      Notification.js
      User.js
    routes/
      authRoutes.js
      feedbackRoutes.js
      initiativeRoutes.js
      notificationRoutes.js
      issueRoutes.js
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
  .env
  .env.example
  README.md
  commit.sh
```

## Setup

### 1. Environment

Create a `.env` file in the project root.

Example:

```env
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/smart_community_dashboard
JWT_SECRET=replace_with_a_strong_secret
```

Note: the checked-in `.env.example` may still show `5000`, but the current app is commonly run on `5050`.

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or replace `MONGO_URI` with your Atlas connection string.

### 4. Seed Sample Data

```bash
cd backend
npm run seed
```

Seeded demo accounts:

- Admin: `admin@smartcommunity.com` / `Admin@123`
- User: `user@smartcommunity.com` / `User@123`

### 5. Run the App

```bash
cd backend
npm start
```

Then open:

```text
http://127.0.0.1:5050
```

`127.0.0.1` is the recommended address for this project setup.

## Available Scripts

From the `backend` folder:

- `npm start` - start the production server
- `npm run dev` - start with `nodemon`
- `npm run seed` - reset and seed sample users, initiatives, and feedback

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Initiatives

- `GET /api/initiatives`
- `GET /api/initiatives/coordinates`
- `GET /api/initiatives/:id`
- `POST /api/initiatives` - admin only
- `PUT /api/initiatives/:id` - admin only
- `DELETE /api/initiatives/:id` - admin only

### Feedback

- `POST /api/feedback`
- `GET /api/feedback/initiative/:initiativeId`
- `GET /api/feedback` - admin only
- `DELETE /api/feedback/:id` - admin only

### Issue Requests

- `POST /api/issues`
- `GET /api/issues/user`
- `GET /api/issues/public`
- `GET /api/issues` - admin only
- `POST /api/issues/:id/upvote`
- `PUT /api/issues/:id` - admin only
- `POST /api/issues/:id/convert` - admin only

### Notifications

- `GET /api/notifications`
- `POST /api/notifications/mark-read/:id`
- `POST /api/notifications/mark-all-read`

## Notes

- The frontend is served directly by Express from the `frontend` folder.
- Uploaded images for feedback and issues are currently stored as base64 strings in MongoDB.
- Notifications are stored in MongoDB and linked per user.
- The app uses a single-server architecture rather than separate frontend/backend deployments.
- The branding in the UI is `CivicSync`, even though some package metadata and seed email domains still use the earlier project naming.
