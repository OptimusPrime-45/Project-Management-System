<!-- Frontend Development Roadmap (Order of Implementation)
Based on your existing API layer, here's the detailed step-by-step roadmap:

PHASE 1: Foundation & Setup ✅ (Mostly Done)

1.1 Environment & Configuration (COMPLETED)
✅ Vite setup
✅ Tailwind CSS configuration
✅ API layer with axios
⚠️ TODO: Create .env file with VITE_API_BASE_URL=http://localhost:3000/api/v1

1.2 Theme System (IN PROGRESS)
✅ ThemeContext exists
TODO: Complete ThemeContext implementation
Light/dark mode toggle logic
localStorage persistence
CSS variables setup
TODO: Add theme CSS variables to index.css
Define color palette for light mode
Define color palette for dark mode
Background, text, primary, secondary colors
TODO: Complete ThemeToggle component
Sun/moon icon
Smooth transition
Button styling


PHASE 2: Authentication Flow (START HERE - Most Critical)

2.1 Auth Context Enhancement
REVIEW: Your existing AuthContext.jsx
Currently has basic login/logout
ADD: Token refresh logic
ADD: Auto-refresh before expiration
ADD: Handle 401 responses globally
ADD: Loading states during auth checks

2.2 Auth Pages (Build in this order)
Priority 1: Login Page
Form with email/password inputs
Validation (empty fields, email format)
Error message display
"Remember me" checkbox (optional)
"Forgot password?" link
Call login API → save token → redirect to dashboard
Show loading spinner during API call

Priority 2: Register Page
Form with username, email, password, confirm password
Password strength indicator
Terms & conditions checkbox
Validation (all fields required, passwords match, email format)
Call register API → show "Check email for verification"
Link to login page

Priority 3: Verify Email Page
Extract token from URL params (/verify-email/:token)
Auto-call verifyEmail API on page load
Show success message → redirect to login
Show error if token invalid/expired

Priority 4: Forgot Password Page
Single email input
Call forgotPassword API
Show success: "Reset link sent to email"
Link back to login

Priority 5: Reset Password Page
Extract token from URL params
Form with new password + confirm password
Password strength indicator
Call resetPassword API with token
Show success → redirect to login

2.3 Protected Route Component
Create ProtectedRoute.jsx wrapper
Check if user is authenticated
If not authenticated → redirect to /login
If authenticated → render children
Show loading spinner while checking auth status
Wrap all dashboard/project routes with this

2.4 Public Route Component (Optional but recommended)
Create PublicRoute.jsx wrapper
If already authenticated → redirect to /dashboard
If not authenticated → render auth pages (login/register)
Prevents logged-in users from seeing login page


PHASE 3: Core Layout & Navigation

3.1 Header Component
Logo/brand name (left side)
User profile dropdown (right side)
Avatar/username
Dropdown menu:
Profile
Settings
Logout
Theme toggle button
Notification icon (placeholder for now)
Responsive: hamburger menu on mobile

3.2 Sidebar Component
Navigation links:
Dashboard (home icon)
My Projects (folder icon)
Profile (user icon)
Admin (if super admin - crown icon)
Active route highlighting
Collapsible on desktop
Slide-out drawer on mobile
Show user role badge

3.3 Footer Component (Optional)
Copyright text
Links (Privacy, Terms)
Version number

3.4 Main Layout Wrapper
Combine Header + Sidebar + content area
Handle sidebar toggle state
Responsive grid layout
Apply to all authenticated pages


PHASE 4: Dashboard (Landing After Login)

4.1 Dashboard Overview Page
Purpose: First page after login, shows summary

Sections to build:

Welcome Section
Greeting with user's name
Current date/time
Quick action buttons (Create Project)

Stats Cards (4 cards in a row)
Total Projects (with count)
Active Tasks (count)
Completed Tasks (count)
Team Members (count)
Fetch data from multiple APIs and aggregate

Recent Projects Section
Grid/list of last 5 projects
Reuse ProjectCard component
"View All" button → link to projects page

Recent Activity Feed (Optional for v1)
Timeline of recent actions
"User X added task Y to project Z"


PHASE 5: Projects Module (Core Feature)

5.1 Common Components First
Build these reusable components:

ProjectCard Component:
Card design with project name
Description (truncated)
Member count badge
User role badge (Admin/Project Admin/Member)
Task progress bar
"View" button
3-dot menu (Edit/Delete for admins)

ProjectForm Component:
Reusable for Create AND Edit
Two input fields: name, description
Validation
Submit/cancel buttons
Different mode prop: mode="create" or mode="edit"

5.2 Projects List Page
Features:
Page header with "Create Project" button (if not member-only)
Search bar (filter by project name)
View toggle: Grid view / List view
Load projects from getAllProjects API
Display using ProjectCard components
Empty state if no projects: "No projects yet. Create one!"
Loading skeleton while fetching
Pagination if many projects (optional for v1)

5.3 Create Project Flow
Click "Create Project" button
Open modal/dialog with ProjectForm
Fill name + description
Call createProject API
On success:
Close modal
Refresh projects list
Show success toast: "Project created!"
Optionally navigate to new project detail page

5.4 Project Detail Page
URL: /projects/:projectId

Layout - Tab Navigation:
Build as tabs, each tab is a section:

Tab 1: Overview (default tab)
Project name + description at top
Edit/Delete buttons (only for admin/project admin)
Stats cards:
Total tasks
Tasks by status (todo/in-progress/done)
Total members
Total notes
Recent tasks (last 5)
Recent notes (last 3)

Tab 2: Tasks
Will build in Phase 6
Shows all tasks for this project

Tab 3: Notes
Will build in Phase 7
Shows all notes for this project

Tab 4: Members
Will build in Phase 5.5
Shows team members

Tab 5: Settings (only visible to admin/project admin)

Edit project details
Delete project (danger zone)
5.5 Project Members Section
Build inside Project Detail → Members Tab

MemberList Component:

Table or card layout showing all members
Columns: Avatar, Name, Email, Role, Actions
Fetch from getProjectMembers API
"Add Member" button (admin/project admin only)

Add Member Flow:
Click "Add Member"
Modal with email input + role dropdown
Roles: Project Admin / Member
Call addProjectMember API
Refresh member list on success

Edit Member Role:
Dropdown to change role (admin/project admin only)
Cannot edit other project admins (only super admin can)
Call updateMemberRole API
Update list on success

Remove Member:
Trash icon button (admin/project admin only)
Confirmation dialog: "Remove [name] from project?"
Cannot remove other project admins
Call removeProjectMember API
Update list on success

5.6 Edit/Delete Project
Edit:

Click edit button in project header
Modal with ProjectForm in edit mode
Pre-fill with current data
Call updateProject API
Update UI on success

Delete:
Click delete button
Confirmation dialog: "Delete project? This cannot be undone!"
Call deleteProject API
Redirect to projects list on success


PHASE 6: Tasks Module

6.1 Common Components
TaskCard Component:

Task title
Status badge (todo/in-progress/done)
Assignee avatar + name
Due date (if you add this field)
Subtask counter: "3/5 completed"
Click to open task detail

TaskForm Component:
Title input (required)
Description textarea
Assignee dropdown (select from project members)
Status dropdown (todo/in-progress/done)
Submit/cancel buttons

SubtaskList Component:
List of subtasks with checkboxes
Checkbox to toggle completion (all roles can do this)
Add subtask input (admin/project admin only)
Delete subtask button (admin/project admin only)

6.2 Tasks Page (Inside Project Detail)
Two view options:

Option A: List View

Simple list of all tasks
Filterable by status, assignee
Sortable by date, status
Each row uses TaskCard

Option B: Kanban Board (Recommended)
3 columns: Todo, In Progress, Done
Drag-and-drop tasks between columns
On drop → call updateTask API to change status
Each card uses TaskCard

Common features:
"Create Task" button (admin/project admin only)
Search/filter tasks
Load from getAllTasks(projectId) API

6.3 Create Task Flow
Click "Create Task"
Modal with TaskForm
Fill: title, description, assignee, status
Call createTask(projectId, data) API
Add to task list on success

6.4 Task Detail View
Can be modal or separate page
Show full task info:
Title (editable inline for admin/project admin)
Description (editable)
Status dropdown (admin/project admin)
Assignee (admin/project admin)
Created by + date

Subtasks Section:
Show SubtaskList component
Members can check/uncheck subtasks
Admin/project admin can add/edit/delete subtasks

Attachments Section: (if implementing file upload)
Upload button
List of attached files
Download/delete options

6.5 Edit/Delete Task
Edit:
Click edit in task detail
Modal with TaskForm in edit mode
Call updateTask(projectId, taskId, data) API

Delete:
Delete button in task detail
Confirmation dialog
Call deleteTask(projectId, taskId) API
Remove from list

6.6 Subtask Management
Create subtask:
Input field below subtask list
Type title + press Enter or click Add
Call createSubTask(projectId, taskId, data) API

Toggle completion:
Click checkbox
Call updateSubTask(projectId, taskId, subTaskId, {isCompleted}) API
Update UI immediately (optimistic update)

Delete subtask:
X button next to subtask (admin/project admin only)
Call deleteSubTask(projectId, taskId, subTaskId) API

PHASE 7: Notes Module (Simpler than Tasks)

7.1 Common Components

NoteCard Component:
Title/first line as heading
Preview of content (truncated)
Created by + date
Click to expand/open

NoteForm Component:
Title input (optional - can be first line)
Rich text editor OR simple textarea
Save/cancel buttons

7.2 Notes Page (Inside Project Detail)
Grid or list of note cards
"Create Note" button (admin/project admin only)
Load from getAllNotes(projectId) API
Click card to view full note

7.3 Create Note
Click "Create Note"
Modal with NoteForm
Rich text editor for content
Call createNote(projectId, data) API

7.4 Note Detail View
Show full note content
Edit/Delete buttons (admin/project admin only)
Created by + date
Last updated timestamp

7.5 Edit/Delete Note
Edit:
Modal with NoteForm in edit mode
Call updateNote(projectId, noteId, data) API

Delete:
Confirmation dialog
Call deleteNote(projectId, noteId) API


PHASE 8: User Profile & Settings

8.1 Profile Page
Sections:

Profile Information
Avatar upload (if implementing)
Username (read-only or editable)
Email (read-only)
Full name
Bio (optional)
Save button

My Projects List
Show all projects user is part of
Quick links to each project

Activity Summary
Stats about user's contributions
Tasks assigned to them

8.2 Settings Page
Sections:

Account Settings
Email notifications toggle
Language preference (if multi-language)

Appearance
Theme toggle (light/dark/system)
Preview of current theme

Change Password
Current password
New password
Confirm new password
Call changePassword API


PHASE 9: Super Admin Panel (If you're the super admin)

9.1 Super Admin Dashboard
Only accessible if user.isSuperAdmin === true

Stats Overview:
Call getSystemStats API
Display cards:
Total users
Total projects
Active users today/week
System health status

Quick Actions:
View all users
View all projects
System settings

9.2 User Management Page
Table of all users
Call getAllUsers API
Columns: Username, Email, Join Date, Projects Count, Email Verified, Actions
Search/filter users
Actions per user:
View details (modal with getUserById)
Edit user (change email verification, make super admin)
Delete user (with confirmation)

9.3 Project Management Page
Table of ALL projects (not just yours)
Call getAllProjectsAdmin API
Columns: Name, Created By, Members, Tasks, Created Date
Click project → view stats (getProjectStats)
Delete any project

PHASE 10: Polish & UX Enhancements

10.1 Loading States
Add skeleton loaders for:
Project cards
Task lists
Member lists
Loading spinners for buttons during API calls
Page-level loading (spinner in center)

10.2 Empty States
"No projects yet" with create button
"No tasks in this project" with illustration
"No members added" with add member prompt
"No notes created" message

10.3 Error Handling
API error messages display
Form validation errors (inline)
Network error fallback page
404 page for invalid routes
Global error boundary

10.4 Toast Notifications
Success: "Project created successfully!"
Error: "Failed to update task"
Info: "Email verification sent"
Use library like react-hot-toast or sonner

10.5 Responsive Design
Test on mobile (< 640px)
Sidebar becomes drawer
Cards stack vertically
Tables become cards on mobile
Touch-friendly button sizes

10.6 Accessibility
Keyboard navigation
Focus states on all interactive elements
ARIA labels for icons
Alt text for images
Color contrast check


PHASE 11: Optional Enhancements (Future)

11.1 Real-time Features
WebSocket for live updates
See when others are editing
Live task updates

11.2 Advanced Features
Drag-and-drop file uploads
Rich text editor for notes
Task comments/discussion
@mentions in comments
Email notifications
Export data (PDF/CSV)

11.3 Performance
Implement React Query for caching
Lazy load images
Code splitting
Optimize re-renders with memo/useMemo
Virtual scrolling for long lists


Development Tips & Order of Execution:

Week 1: Authentication & Layout
Day 1-2: Complete auth pages (login, register)
Day 3: Protected routes + theme system
Day 4-5: Layout (header, sidebar, dashboard)

Week 2: Projects Core
Day 1-2: Projects list + create/edit/delete
Day 3-4: Project detail page structure
Day 5: Members management

Week 3: Tasks
Day 1-2: Task list/board view
Day 3: Task detail + create/edit
Day 4-5: Subtasks functionality

Week 4: Notes + Profile
Day 1-2: Notes CRUD
Day 3: User profile
Day 4-5: Super admin (if needed)

Week 5: Polish
Loading states, errors, responsive design


Testing Strategy (Parallel to Development):
Test each feature as you build:

Manual Testing:
Create a test user
Create a test project
Test with different roles (member vs admin)
Test on mobile

Edge Cases:
Empty states
Network errors
Invalid tokens
Permission denied scenarios

Browser Testing:
Chrome, Firefox, Safari
Mobile browsers -->

# Frontend Development Roadmap

**Tech Stack:** Vite, React, Tailwind CSS, Axios.
**API Base URL:** `http://localhost:3000/api/v1`

---

## 📅 Implementation Roadmap

### Phase 1: Foundation & Setup ✅
*Most items completed, finishing touches required.*

- [x] **1.1 Environment & Configuration**
  - [x] Vite setup
  - [x] Tailwind CSS configuration
  - [x] API layer with `axios`
  - [ ] Create `.env` file with `VITE_API_BASE_URL`

- [ ] **1.2 Theme System**
  - [x] `ThemeContext` structure
  - [ ] Complete `ThemeContext` implementation (Light/dark toggle logic)
  - [ ] Implement `localStorage` persistence for theme
  - [ ] **CSS Variables Setup (`index.css`):**
    - [ ] Define color palette for Light Mode (Background, text, primary, secondary)
    - [ ] Define color palette for Dark Mode
  - [ ] **ThemeToggle Component:**
    - [ ] Sun/Moon icon
    - [ ] Smooth transition effects
    - [ ] Button styling

---

### Phase 2: Authentication Flow (START HERE)
*Critical priority.*

- [ ] **2.1 Auth Context Enhancement**
  - [ ] Add Token Refresh logic
  - [ ] Add Auto-refresh before expiration
  - [ ] Global 401 response handling (logout/redirect)
  - [ ] Add loading states during auth checks

- [ ] **2.2 Auth Pages**
  - [ ] **Priority 1: Login Page**
    - [ ] Form: Email, Password
    - [ ] Validation: Empty fields, email format
    - [ ] Error message display
    - [ ] "Remember me" checkbox
    - [ ] "Forgot password?" link
    - [ ] API Call -> Save Token -> Redirect to Dashboard
    - [ ] Loading spinner during API call
  - [ ] **Priority 2: Register Page**
    - [ ] Form: Username, Email, Password, Confirm Password
    - [ ] Password strength indicator
    - [ ] Terms & Conditions checkbox
    - [ ] Validation: Required fields, passwords match, email format
    - [ ] API Call -> Show "Check email" message -> Link to Login
  - [ ] **Priority 3: Verify Email Page**
    - [ ] Extract token from URL (`/verify-email/:token`)
    - [ ] Auto-call `verifyEmail` API on load
    - [ ] Success: Redirect to Login
    - [ ] Error: Show Invalid/Expired token message
  - [ ] **Priority 4: Forgot Password Page**
    - [ ] Single email input
    - [ ] API Call -> Success message "Reset link sent" -> Link to Login
  - [ ] **Priority 5: Reset Password Page**
    - [ ] Extract token from URL
    - [ ] Form: New Password, Confirm Password
    - [ ] Password strength indicator
    - [ ] API Call -> Success -> Redirect to Login

- [ ] **2.3 Protected Route Component**
  - [ ] Check if user is authenticated
  - [ ] If No: Redirect to `/login`
  - [ ] If Yes: Render children
  - [ ] Show loading spinner while checking status

- [ ] **2.4 Public Route Component**
  - [ ] Check if user is authenticated
  - [ ] If Yes: Redirect to `/dashboard` (prevent login page access)
  - [ ] If No: Render auth pages

---

### Phase 3: Core Layout & Navigation

- [ ] **3.1 Header Component**
  - [ ] Logo/Brand Name (Left)
  - [ ] User Profile Dropdown (Right): Avatar/Username 
    - [ ] Menu items: Profile, Settings, Logout
  - [ ] Theme Toggle Button
  - [ ] Notification Icon (Placeholder)
  - [ ] Responsive: Hamburger menu for mobile

- [ ] **3.2 Sidebar Component**
  - [ ] **Navigation Links:**
    - [ ] Dashboard (Home icon)
    - [ ] My Projects (Folder icon)
    - [ ] Profile (User icon)
    - [ ] Admin (Crown icon - Super Admin only)
  - [ ] Active route highlighting
  - [ ] Collapsible behavior (Desktop)
  - [ ] Slide-out drawer (Mobile)
  - [ ] User role badge display

- [ ] **3.3 Footer Component** (Optional)
  - [ ] Copyright, Links (Privacy, Terms), Version

- [ ] **3.4 Main Layout Wrapper**
  - [ ] Combine Header + Sidebar + Content Area
  - [ ] Handle sidebar toggle state
  - [ ] Responsive grid layout setup

---

### Phase 4: Dashboard (Landing)

- [ ] **4.1 Dashboard Overview Page**
  - [ ] **Welcome Section:** Greeting (User Name), Date/Time, "Create Project" button
  - [ ] **Stats Cards:**
    - [ ] Total Projects (Count)
    - [ ] Active Tasks (Count)
    - [ ] Completed Tasks (Count)
    - [ ] Team Members (Count)
  - [ ] **Recent Projects Section:**
    - [ ] Grid/List of last 5 projects
    - [ ] "View All" link
  - [ ] **Recent Activity Feed:** Timeline of recent actions (Optional v1)

---

### Phase 5: Projects Module (Core Feature)

- [ ] **5.1 Common Components**
  - [ ] **ProjectCard:**
    - [ ] Name, Description (truncated), Member count badge
    - [ ] User Role badge (Admin/Member)
    - [ ] Task progress bar
    - [ ] "View" button, 3-dot menu (Edit/Delete)
  - [ ] **ProjectForm:**
    - [ ] Reusable for Create & Edit
    - [ ] Inputs: Name, Description
    - [ ] Validation & Submit/Cancel buttons

- [ ] **5.2 Projects List Page**
  - [ ] Header with "Create Project" button
  - [ ] Search Bar (Filter by name)
  - [ ] View Toggle (Grid vs List)
  - [ ] Load from `getAllProjects` API
  - [ ] Empty State ("No projects yet")
  - [ ] Loading Skeleton

- [ ] **5.3 Create Project Flow**
  - [ ] Modal with `ProjectForm`
  - [ ] API Call -> Success Toast -> Refresh List

- [ ] **5.4 Project Detail Page** (`/projects/:projectId`)
  - [ ] **Tab System:**
    - [ ] **Tab 1: Overview:** Name, Description, Edit/Delete buttons (Admin), Stats (Tasks by status, members, notes), Recent items.
    - [ ] **Tab 2: Tasks:** (See Phase 6)
    - [ ] **Tab 3: Notes:** (See Phase 7)
    - [ ] **Tab 4: Members:** (See 5.5)
    - [ ] **Tab 5: Settings:** (Admin only - Edit/Delete project)

- [ ] **5.5 Project Members Section** (Inside Detail Page)
  - [ ] **MemberList Component:** Table/Card (Avatar, Name, Email, Role, Actions)
  - [ ] **Add Member Flow:**
    - [ ] Modal: Email input + Role Dropdown (Project Admin / Member)
    - [ ] API Call -> Refresh list
  - [ ] **Edit Role:** Dropdown to change role (Admin only)
  - [ ] **Remove Member:** Trash icon + Confirmation Dialog (Admin only)

- [ ] **5.6 Edit/Delete Project**
  - [ ] **Edit:** Modal with pre-filled form -> Update API -> Update UI
  - [ ] **Delete:** Confirmation Dialog -> Delete API -> Redirect to Projects List

---

### Phase 6: Tasks Module

- [ ] **6.1 Common Components**
  - [ ] **TaskCard:** Title, Status badge, Assignee avatar, Due date, Subtask counter, Click handler.
  - [ ] **TaskForm:** Title (req), Description, Assignee (Dropdown), Status (Dropdown).
  - [ ] **SubtaskList:** List of checkboxes, Add input, Delete button.

- [ ] **6.2 Tasks Page** (Inside Project Detail)
  - [ ] **View Option A: List View:** Filterable table.
  - [ ] **View Option B: Kanban Board:** 3 Columns (Todo, In Progress, Done), Drag-and-drop logic.
  - [ ] "Create Task" button (Admin/Project Admin)

- [ ] **6.3 Create Task Flow**
  - [ ] Modal with `TaskForm`
  - [ ] API Call -> Add to list

- [ ] **6.4 Task Detail View**
  - [ ] Modal or separate page
  - [ ] Title/Description (Editable)
  - [ ] Status/Assignee Dropdowns
  - [ ] **Subtasks Section:** `SubtaskList` component (Check/Uncheck logic)
  - [ ] **Attachments:** Upload button, file list (Optional)

- [ ] **6.5 Edit/Delete Task**
  - [ ] Edit: `TaskForm` in edit mode
  - [ ] Delete: Confirmation -> API Call

- [ ] **6.6 Subtask Management**
  - [ ] Create: Input + Enter key -> API
  - [ ] Toggle: Checkbox -> Optimistic UI update -> API
  - [ ] Delete: X button -> API

---

### Phase 7: Notes Module

- [ ] **7.1 Common Components**
  - [ ] **NoteCard:** Title, Preview, Date, Click to expand.
  - [ ] **NoteForm:** Title, Rich text/Textarea.

- [ ] **7.2 Notes Page** (Inside Project Detail)
  - [ ] Grid/List of cards
  - [ ] "Create Note" button

- [ ] **7.3 Create Note**
  - [ ] Modal with `NoteForm` -> API Call

- [ ] **7.4 Note Detail View**
  - [ ] Full content view
  - [ ] Edit/Delete buttons (Admin only)

- [ ] **7.5 Edit/Delete Note**
  - [ ] Edit: Modal with pre-filled data
  - [ ] Delete: Confirmation -> API

---

### Phase 8: User Profile & Settings

- [ ] **8.1 Profile Page**
  - [ ] **Info:** Avatar upload, Username, Email, Name, Bio, Save button.
  - [ ] **My Projects:** Quick links.
  - [ ] **Activity:** Stats summary.

- [ ] **8.2 Settings Page**
  - [ ] **Account:** Email notifications, Language.
  - [ ] **Appearance:** Theme toggle, Preview.
  - [ ] **Change Password:** Current, New, Confirm -> API Call.

---

### Phase 9: Super Admin Panel
*Access: `user.isSuperAdmin === true`*

- [ ] **9.1 Super Admin Dashboard**
  - [ ] Stats: Total Users, Total Projects, System Health.
  - [ ] Quick Actions: View Users/Projects.

- [ ] **9.2 User Management Page**
  - [ ] Table: Username, Email, Join Date, Verified Status, Actions.
  - [ ] Actions: View Details, Edit (Verify/Promote), Delete User.

- [ ] **9.3 Project Management Page**
  - [ ] Table: All projects in system.
  - [ ] Actions: View Stats, Delete Project.

---

### Phase 10: Polish & UX Enhancements

- [ ] **10.1 Loading States**
  - [ ] Skeleton loaders (Cards, Tables, Lists)
  - [ ] Spinner on buttons (API calls)
  - [ ] Page-level loading

- [ ] **10.2 Empty States**
  - [ ] Projects: "No projects yet"
  - [ ] Tasks: "No tasks found"
  - [ ] Members: "No members added"

- [ ] **10.3 Error Handling**
  - [ ] API Error toasts
  - [ ] Inline form validation
  - [ ] 404 Page / Global Error Boundary

- [ ] **10.4 Toast Notifications**
  - [ ] Success, Error, Info messages (e.g., react-hot-toast)

- [ ] **10.5 Responsive Design**
  - [ ] Mobile sidebar drawer
  - [ ] Card stacking
  - [ ] Touch-friendly targets

- [ ] **10.6 Accessibility**
  - [ ] Keyboard navigation, Focus states, ARIA labels, Alt text.

---

### Phase 11: Optional Enhancements (Future)

- [ ] **11.1 Real-time:** WebSocket updates (Tasks/Collab).
- [ ] **11.2 Advanced:** Drag-drop files, Rich text, Comments, Exports.
- [ ] **11.3 Performance:** React Query, Lazy loading, Code splitting.

---

## 🛠 Development Schedule

| Week | Focus Area | Details |
| :--- | :--- | :--- |
| **Week 1** | **Auth & Layout** | Auth pages (Login/Reg), Protected Routes, Theme, Header, Sidebar. |
| **Week 2** | **Projects Core** | List, Create, Edit, Delete, Details Page structure, Members. |
| **Week 3** | **Tasks** | List/Kanban view, Details, Subtasks, Create/Edit. |
| **Week 4** | **Notes & Profile** | Notes CRUD, User Profile, Settings, Super Admin. |
| **Week 5** | **Polish** | Loading states, Error handling, Responsive fixes. |

## 🧪 Testing Strategy

1.  **Manual Testing:**
    * Create Test User & Test Project.
    * Test Role permissions (Admin vs Member).
    * Test on Mobile.
2.  **Edge Cases:**
    * Empty states.
    * Network errors/Invalid tokens.
    * Permission denied actions.
3.  **Browser Compatibility:** Chrome, Firefox, Safari.