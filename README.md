# FCC The Gurukul – YouTube Team Dashboard

## Project Overview

**FCC The Gurukul – YouTube Team Dashboard** is a comprehensive web application designed to manage, track, and streamline the workflow of a collaborative YouTube content creation team. The platform is tailored for educational content production, especially for NCERT-based learning, and provides tools for task assignment, progress tracking, resource sharing, and team communication.

## Main Purpose

The main goal of this project is to empower a distributed team (students, teachers, and admins) to efficiently coordinate YouTube video production. It enables admins to assign tasks, monitor progress, and celebrate milestones, while team members can view their assignments, mark completion, and request resources or support. The dashboard also fosters transparency and motivation through real-time status updates and milestone tracking.

## Tech Stack

- **Frontend:** React (with functional components and hooks), Framer Motion (animations), React Icons, Tailwind CSS (styling), and custom CSS.
- **Backend:** Supabase (PostgreSQL database, authentication, and RESTful API), with an additional Express/Mongoose backend (for future extensibility).
- **Authentication:** Supabase Auth (email/password, user profiles).
- **Database:** Supabase PostgreSQL (tables for users/profiles, tasks, task status, milestones, resource requests, etc.).
- **Other Tools:** Dicebear (avatar generation), React Confetti (celebration effects), React Toastify (notifications), and dayjs (date handling).

## Major Features

### 1. **Authentication & User Management**
- Signup/Login with email and password (Supabase Auth).
- User roles: `admin` and `member`.
- Profile management with avatars (Dicebear).

### 2. **Task Assignment & Tracking**
- **Admins** can assign tasks to members, specifying title, class, and resource links.
- **Members** see their assigned tasks, mark them as complete, and track progress.
- Task status stages: `assigned`, `recorded`, `editing`, `uploading`, `published`.
- Visual progress tracker for each task.
- Task completion and status history logging.

### 3. **Milestone Tracking**
- Visualize YouTube growth milestones (subscribers, watch time, uploads).
- Progress bars and completion celebrations (confetti).
- Target dates and overdue indicators.

### 4. **Resource Requests (Tools & Tips)**
- Members can request tools, scripts, presentations, or other resources.
- Requests are logged and can be replied to by admins.
- WhatsApp integration for direct support.

### 5. **Team Communication**
- Group chatroom (planned/under construction).
- Alerts and notifications for important updates.

### 6. **Admin Panel**
- Assign new tasks, view all users, and monitor overall progress.
- Task status control and change log.

### 7. **Dashboard & Home**
- Personalized welcome and quick navigation.
- Overview of all tasks and their statuses, filterable by date.

### 8. **Config & Build**
- Uses Create React App for frontend bootstrapping.
- Webpack config for custom builds (if needed).
- PWA support (manifest, icons, theme color).
- Environment variables managed via `.env`.

### 9. **Backend (Optional/Planned)**
- Express/Mongoose backend for additional APIs or integrations (see `backend/` folder).

## Project Structure

- **/src/components/** – All React UI components (Dashboard, Tasks, Milestones, Auth, etc.)
- **/src/services/** – API and utility functions (e.g., taskService.js).
- **/src/** – Main entry point, global styles, and app logic.
- **/public/** – Static assets, manifest, favicon, and HTML template.
- **/backend/** – Node.js backend (Express, Mongoose) for future extensibility.
- **.env** – Environment variables (Supabase URL and key).
- **package.json** – Project dependencies and scripts.

## Database Structure (Supabase)

- **profiles**: User info (id, name, email, phone, avatar_url, role, class).
- **tasks**: Task assignments (id, title, drive_link, assigned_to, class, status).
- **task_status_tracking**: Current status per task.
- **task_status_history**: Status change log for audit trail.
- **task_completions**: Task completion records.
- **resource_requests**: Tools/resources requests from members.
- **milestones**: (Planned) Milestone definitions and progress.

---