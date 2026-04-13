# TRABAJAHOY API Context for Frontend Development

> Complete API context and integration guide for the TrabajaHoy frontend application.

---

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication Flow](#authentication-flow)
- [Response Format](#response-format)
- [Error Format](#error-format)
- [Pagination](#pagination)
- [API Endpoints Reference](#api-endpoints-reference)
  - [Authentication](#1-authentication)
  - [Candidate Profile](#2-candidate-profile)
  - [Companies](#3-companies)
  - [Vacancies/Jobs](#4-vacanciesjobs)
  - [Applications](#5-applications)
  - [Admin](#6-admin)
  - [Resources](#7-resources)
  - [Forum](#8-forum)
- [Data Models](#data-models)
- [Role-Based Access](#role-based-access)
- [File Upload](#file-upload)
- [Development Tools](#development-tools)
- [Integration Guidelines](#integration-guidelines)

---

## API Overview

**Base URL (Development):** `http://localhost:3000/api`

**Authentication:** JWT Bearer tokens in `Authorization` header

**Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)

**CORS:** Enabled for all origins (development mode)

**API Documentation:** Available at `http://localhost:3000/api/docs` (Swagger UI, development only)

---

## Authentication Flow

### 1. Registration
```
POST /api/auth/register
Body: { email, password, firstName, lastName }
Response: { accessToken, refreshToken, user }
```

### 2. Login
```
POST /api/auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user }
```

### 3. Token Refresh
```
POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }
```

### 4. Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <accessToken>
Response: { user, roles }
```

### 5. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <accessToken>
```

### Token Management
- **Access Token:** Short-lived (1h), used for API requests
- **Refresh Token:** Long-lived (7d), used to get new access tokens
- Store both tokens securely (httpOnly cookies recommended)
- Automatically refresh tokens before expiration or on 401 responses

---

## Response Format

All successful responses follow this envelope pattern:

```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-04-12T10:30:00.000Z"
}
```

**Paginated responses:**
```json
{
  "status": "success",
  "data": [...],
  "message": "...",
  "timestamp": "...",
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

## Error Format

```json
{
  "status": "error",
  "data": {
    "success": false,
    "message": "Validation failed",
    "errors": ["email is required", "password must be at least 8 characters"]
  },
  "timestamp": "2026-04-12T10:30:00.000Z",
  "message": "Validation failed"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Pagination

All list endpoints support pagination via query parameters:

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10, max: 100) - Items per page

**Example:**
```
GET /api/vacancies?page=2&limit=20
```

---

## API Endpoints Reference

### 1. Authentication

**Public endpoints (no auth required):**

```
POST   /api/auth/register          # Register new candidate
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh access token
```

**Authenticated endpoints:**

```
POST   /api/auth/logout            # Logout (requires auth)
GET    /api/auth/me                # Get current user profile
```

**Key Notes:**
- Registration automatically assigns `candidate` role
- Login returns user with their roles array
- Token refresh invalidates old refresh token (one-time use)

---

### 2. Candidate Profile

**All endpoints require `candidate` role**

#### Main Profile
```
POST   /api/candidate/profile                      # Create profile
GET    /api/candidate/profile/:id                  # Get profile by ID
PATCH  /api/candidate/profile/:id                  # Update profile
DELETE /api/candidate/profile/:id                  # Delete profile
```

**Profile Fields:**
- `headline` - Short title (e.g., "Full Stack Developer")
- `bio` - Long description
- `location` - City, country
- `availability` - immediately, open, notLooking
- `websiteUrl` - Personal website
- `linkedinUrl` - LinkedIn profile
- `githubUrl` - GitHub profile

#### Experiences
```
GET    /api/candidate/profile/:id/experiences             # List experiences
POST   /api/candidate/profile/:candidateId/experiences    # Add experience
GET    /api/candidate/profile/experiences/:id             # Get single experience
PATCH  /api/candidate/profile/experiences/:id             # Update experience
DELETE /api/candidate/profile/experiences/:id             # Delete experience
```

**Experience Fields:**
- `companyName` (required)
- `position` (required)
- `startDate` (required, YYYY-MM-DD)
- `endDate` (optional, YYYY-MM-DD)
- `isCurrent` (boolean)
- `description`
- `location`

#### Education
```
GET    /api/candidate/profile/:id/education               # List education
POST   /api/candidate/profile/:candidateId/education      # Add education
GET    /api/candidate/profile/education/:id               # Get single education
PATCH  /api/candidate/profile/education/:id               # Update education
DELETE /api/candidate/profile/education/:id               # Delete education
```

**Education Fields:**
- `institutionName` (required)
- `degree` (required)
- `fieldOfStudy`
- `startDate` (required, YYYY-MM-DD)
- `endDate` (optional, YYYY-MM-DD)
- `isCurrent` (boolean)
- `description`

#### Skills
```
GET    /api/candidate/profile/:id/skills                  # List skills
POST   /api/candidate/profile/:candidateId/skills         # Add skill
GET    /api/candidate/profile/skills/:id                  # Get single skill
PATCH  /api/candidate/profile/skills/:id                  # Update skill
DELETE /api/candidate/profile/skills/:id                  # Delete skill
```

**Skill Fields:**
- `name` (required)
- `level` (required): beginner, intermediate, advanced, expert
- `yearsOfExperience`

#### Languages
```
GET    /api/candidate/profile/:id/languages               # List languages
POST   /api/candidate/profile/:candidateId/languages      # Add language
GET    /api/candidate/profile/languages/:id               # Get single language
PATCH  /api/candidate/profile/languages/:id               # Update language
DELETE /api/candidate/profile/languages/:id               # Delete language
```

**Language Fields:**
- `name` (required) - Language name
- `proficiency` (required): basic, intermediate, advanced, native

#### CV Files
```
GET    /api/candidate/profile/:id/cv                      # List CVs
POST   /api/candidate/profile/:candidateId/cv             # Upload CV (multipart/form-data)
GET    /api/candidate/profile/cv/:id                      # Get CV with signed URL
DELETE /api/candidate/profile/cv/:id                      # Delete CV
```

**File Upload:**
- Field name: `file`
- Max size: 5MB
- Allowed formats: PDF, DOC, DOCX
- Response includes signed download URL (valid 1 hour)

#### Interests
```
GET    /api/candidate/profile/:id/interests               # List interests
POST   /api/candidate/profile/:candidateId/interests      # Add interest
GET    /api/candidate/profile/interests/:id               # Get single interest
DELETE /api/candidate/profile/interests/:id               # Delete interest
```

**Interest Fields:**
- `name` (required) - Interest tag name

---

### 3. Companies

**Public endpoints:**

```
GET    /api/companies                            # List companies (paginated)
GET    /api/companies/:id                        # Get company by ID
```

**Authenticated endpoints:**

```
POST   /api/companies                            # Create company
PATCH  /api/companies/:id                        # Update company
DELETE /api/companies/:id                        # Delete company
```

**Company Fields:**
- `name` (required)
- `description`
- `industry`
- `size`: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+
- `websiteUrl`
- `logoUrl`
- `coverImageUrl`
- `foundedYear`

#### Locations
```
POST   /api/companies/:id/locations              # Add location
GET    /api/companies/:id/locations              # Get locations
PATCH  /api/companies/:id/locations/:locId       # Update location
DELETE /api/companies/:id/locations/:locId       # Delete location
```

**Location Fields:**
- `country` (required)
- `city` (required)
- `address`
- `postalCode`
- `isPrimary` (boolean)

#### Benefits
```
POST   /api/companies/:id/benefits               # Add benefit
GET    /api/companies/:id/benefits               # Get benefits
PATCH  /api/companies/:id/benefits/:benId        # Update benefit
DELETE /api/companies/:id/benefits/:benId        # Delete benefit
```

**Benefit Fields:**
- `name` (required)
- `description`

#### Members
```
POST   /api/companies/:id/members                # Add member
GET    /api/companies/:id/members                # Get members
PATCH  /api/companies/:id/members/:memId         # Update member role
DELETE /api/companies/:id/members/:memId         # Remove member
```

**Member Fields:**
- `userId` (required)
- `role` (required): owner, admin, recruiter

#### Verification
```
POST   /api/companies/:id/verification           # Submit for verification (multipart)
GET    /api/companies/:id/verification           # Get verification status
GET    /api/companies/:id/verification/documents # Get documents with signed URLs
```

**Admin only:**
```
POST   /api/companies/:id/verification/submissions/:submissionId/review  # Review
```

**Review Body:**
- `status` (required): approved, rejected
- `feedback`

---

### 4. Vacancies/Jobs

**Public endpoints:**

```
GET    /api/vacancies                            # List published vacancies
GET    /api/vacancies/:id                        # Get vacancy by ID
GET    /api/vacancies/categories                 # List job categories
GET    /api/vacancies/categories/:id             # Get category by ID
GET    /api/vacancies/:id/skills                 # Get vacancy skills
GET    /api/vacancies/:id/benefits               # Get vacancy benefits
GET    /api/vacancies/skills/:id                 # Get single skill
GET    /api/vacancies/benefits/:id               # Get single benefit
```

**Vacancy Query Filters (query params):**
- `categoryId` - Filter by category
- `type` - full-time, part-time, contract, freelance, internship
- `modality` - remote, hybrid, onsite
- `level` - junior, mid, senior, lead, manager, director
- `country` - Filter by country
- `city` - Filter by city
- `search` - Text search in title/description
- `page`, `limit` - Pagination

**Vacancy Fields:**
- `title`
- `description`
- `requirements`
- `benefitsText`
- `salaryMin`, `salaryMax`
- `currency` (e.g., USD, EUR)
- `type` - employment type
- `modality` - work modality
- `level` - seniority level
- `status` - draft, published, closed, archived
- `country`, `city`, `locationText`
- `applicationDeadline`
- `openings` - number of positions
- `companyId` - associated company
- `categoryId` - job category

**Authenticated endpoints (recruiter, admin):**

```
GET    /api/vacancies/manage/all                 # List all vacancies (management view)
GET    /api/vacancies/manage/:id                 # Get vacancy with full details
POST   /api/vacancies                            # Create vacancy
PATCH  /api/vacancies/:id                        # Update vacancy
DELETE /api/vacancies/:id                        # Delete vacancy
PATCH  /api/vacancies/:id/close                  # Close vacancy
PATCH  /api/vacancies/:id/archive                # Archive vacancy
```

**Vacancy Skills Management:**
```
POST   /api/vacancies/:id/skills                 # Add skill to vacancy
PATCH  /api/vacancies/skills/:id                 # Update vacancy skill
DELETE /api/vacancies/skills/:id                 # Delete vacancy skill
```

**Vacancy Skill Fields:**
- `skillId` (required)
- `isRequired` (boolean, default: true)
- `priority` (integer)

**Vacancy Benefits Management:**
```
POST   /api/vacancies/:id/benefits               # Add benefit to vacancy
PATCH  /api/vacancies/benefits/:id               # Update vacancy benefit
DELETE /api/vacancies/benefits/:id               # Delete vacancy benefit
```

**Vacancy Benefit Fields:**
- `benefitId` (required)

**Job Category Management (admin only):**
```
POST   /api/vacancies/categories                 # Create category
PATCH  /api/vacancies/categories/:id             # Update category
DELETE /api/vacancies/categories/:id             # Delete category
```

**Category Fields:**
- `name` (required)
- `description`
- `parentId` (for hierarchical categories)

---

### 5. Applications

**All endpoints require authentication**

#### Job Applications
```
POST   /api/applications                         # Apply to vacancy
GET    /api/applications                         # List applications (role-based)
GET    /api/applications/:id                     # Get application by ID
PATCH  /api/applications/:id                     # Update application
```

**Apply Fields:**
- `vacancyId` (required)
- `coverLetter`
- `cvFileUrl`
- `resumeUrl`

**Application Status Flow:**
- `pending` → `reviewed` → `interview` → `accepted` or `rejected`
- Status changes tracked in history

**Status Change (recruiter, admin):**
```
POST   /api/applications/:id/status              # Change status
```

**Status Change Fields:**
- `toStatus` (required): pending, reviewed, interview, accepted, rejected
- `notes`

#### Application History
```
GET    /api/applications/:id/history             # Get status history
```

#### Application Comments
```
POST   /api/applications/:id/comments            # Add comment
GET    /api/applications/:id/comments            # Get comments
GET    /api/applications/comments/:id             # Get comment by ID
PATCH  /api/applications/comments/:id             # Update comment
DELETE /api/applications/comments/:id             # Delete comment
```

**Comment Fields:**
- `content` (required, max 3000 chars)

#### Saved Jobs
```
POST   /api/applications/saved-jobs              # Save job
GET    /api/applications/saved-jobs              # Get saved jobs
DELETE /api/applications/saved-jobs/:id          # Unsave job
```

**Save Job Fields:**
- `vacancyId` (required)

#### Company Follows
```
POST   /api/applications/follows                 # Follow company
GET    /api/applications/follows                 # Get followed companies
DELETE /api/applications/follows/:id             # Unfollow company
```

**Follow Fields:**
- `companyId` (required)

**Role-Based Access:**
- **candidate:** See own applications, saved jobs, follows
- **recruiter/admin:** See all applications, manage status, add comments

---

### 6. Admin

**All endpoints require `admin` role**

#### User Management
```
GET    /api/admin/users                          # List users (paginated, searchable)
GET    /api/admin/users/:id/roles                # Get user roles
POST   /api/admin/users/:id/roles                # Assign role to user
DELETE /api/admin/users/:id/roles                # Remove role from user
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search by email, name

**Role Assignment:**
- Body: `{ roleName }` (admin, recruiter, candidate, moderator)

#### Role Management
```
GET    /api/admin/roles                          # Get all roles with user counts
GET    /api/admin/roles/:name/users              # Get users with specific role
```

---

### 7. Resources

**Public endpoints (optional auth for ratings):**

```
GET    /api/resources                            # List resources
GET    /api/resources/:id                        # Get resource by ID
GET    /api/resources/categories                 # List categories
GET    /api/resources/categories/:id             # Get category by ID
GET    /api/resources/:id/ratings                # Get resource ratings
GET    /api/resources/:id/related                # Get related resources
```

**Resource Fields:**
- `title`
- `slug` (URL-friendly identifier)
- `content` (markdown/HTML)
- `excerpt` (short description)
- `coverImageUrl`
- `categoryId`
- `authorId`
- `isPublished`
- `publishedAt`
- `readTimeMinutes`
- `averageRating` (calculated)

**Resource Query Filters:**
- `categoryId`
- `isPublished` (default: true)
- `search` - Text search
- `page`, `limit`

**Authenticated endpoints (admin, moderator):**

```
POST   /api/resources                            # Create resource
PATCH  /api/resources/:id                        # Update resource
DELETE /api/resources/:id                        # Delete resource
```

**Resource Category Management:**
```
POST   /api/resources/categories                 # Create category
PATCH  /api/resources/categories/:id             # Update category
DELETE /api/resources/categories/:id             # Delete category
```

**Resource Ratings:**
```
POST   /api/resources/:id/ratings                # Rate resource (1-5 stars)
```

**Rating Fields:**
- `rating` (required, integer 1-5)
- `review` (optional text)

**Related Resources:**
```
POST   /api/resources/:id/related                # Add related resource
DELETE /api/resources/related/:id                # Remove related resource
```

**Related Resource Fields:**
- `resourceId` (required)

---

### 8. Forum

**Public endpoints:**

```
GET    /api/forum/categories                     # List categories
GET    /api/forum/categories/:id                 # Get category by ID
GET    /api/forum/threads                        # List threads
GET    /api/forum/threads/:id                    # Get thread by ID
GET    /api/forum/threads/:id/posts              # Get thread posts
GET    /api/forum/posts/:id                      # Get post by ID
```

**Thread Query Filters:**
- `categoryId`
- `search` - Search in title/content
- `page`, `limit`

**Authenticated endpoints:**

```
POST   /api/forum/threads                        # Create thread
PATCH  /api/forum/threads/:id                    # Update thread (author only)
DELETE /api/forum/threads/:id                    # Delete thread (author or admin)
POST   /api/forum/threads/:id/posts              # Add post to thread
PATCH  /api/forum/posts/:id                      # Update post (author only)
DELETE /api/forum/posts/:id                      # Delete post (author or admin)
```

**Thread Fields:**
- `title` (required)
- `content` (required)
- `categoryId` (required)
- `authorId` (auto-set from auth)
- `isPinned` (boolean, admin/moderator only)
- `isLocked` (boolean, admin/moderator only)

**Post Fields:**
- `content` (required)
- `threadId` (required, from URL)
- `authorId` (auto-set from auth)

**Reporting System:**
```
POST   /api/forum/threads/:id/reports            # Report thread
POST   /api/forum/posts/:id/reports              # Report post
```

**Report Fields:**
- `reason` (required)
- `details` (optional)

**Moderation (admin, moderator):**
```
GET    /api/forum/reports                        # List all reports
GET    /api/forum/reports/:id                    # Get report by ID
PATCH  /api/forum/reports/:id                    # Update report status
```

**Report Update Fields:**
- `status` (required): pending, resolved, dismissed
- `moderatorNotes`

---

## Data Models

### User & Roles
```typescript
interface User {
  id: string;              // UUID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

interface Role {
  id: string;              // UUID
  name: string;            // admin, recruiter, candidate, moderator
}
```

### Candidate Profile
```typescript
interface CandidateProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  location?: string;
  availability?: 'immediately' | 'open' | 'notLooking';
  websiteUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Company
```typescript
interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5000+';
  websiteUrl?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  foundedYear?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Vacancy
```typescript
interface Vacancy {
  id: string;
  companyId: string;
  categoryId?: string;
  title: string;
  description: string;
  requirements: string;
  benefitsText?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  modality: 'remote' | 'hybrid' | 'onsite';
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
  status: 'draft' | 'published' | 'closed' | 'archived';
  country: string;
  city: string;
  locationText?: string;
  applicationDeadline?: string;  // YYYY-MM-DD
  openings: number;
  createdAt: string;
  updatedAt: string;
}
```

### Application
```typescript
interface JobApplication {
  id: string;
  vacancyId: string;
  candidateId: string;
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected';
  coverLetter?: string;
  cvFileUrl?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Role-Based Access

### System Roles
- **admin** - Full system access, user management, content moderation
- **recruiter** - Manage company vacancies and applications
- **candidate** - Apply to jobs, manage profile, save jobs
- **moderator** - Moderate forum content and resources

### Endpoint Access Summary

| Endpoint | Public | Candidate | Recruiter | Admin |
|----------|--------|-----------|-----------|-------|
| Auth (login, register) | ✅ | - | - | - |
| Candidate Profile | - | ✅ | - | - |
| Companies (view) | ✅ | ✅ | ✅ | ✅ |
| Companies (manage) | - | - | ✅ | ✅ |
| Vacancies (view) | ✅ | ✅ | ✅ | ✅ |
| Vacancies (manage) | - | - | ✅ | ✅ |
| Applications | - | ✅ | ✅ | ✅ |
| Admin | - | - | - | ✅ |
| Resources (view) | ✅ | ✅ | ✅ | ✅ |
| Resources (manage) | - | - | - | ✅/🔶 |
| Forum (view) | ✅ | ✅ | ✅ | ✅ |
| Forum (post) | - | ✅ | ✅ | ✅ |
| Forum (moderate) | - | - | - | ✅/🔶 |

🔶 = moderator also has access

---

## File Upload

### CV Upload (Candidate)
```
POST /api/candidate/profile/:candidateId/cv
Content-Type: multipart/form-data

Form Data:
- file: <File> (PDF, DOC, DOCX, max 5MB)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "fileName": "my-cv.pdf",
    "fileSize": 123456,
    "mimeType": "application/pdf",
    "downloadUrl": "https://... (signed URL, valid 1 hour)",
    "createdAt": "..."
  }
}
```

### Company Verification Documents
```
POST /api/companies/:id/verification
Content-Type: multipart/form-data

Form Data:
- documents: <File[]> (multiple files allowed)
- businessRegistration?: string
- taxId?: string
```

---

## Development Tools

### Swagger UI
- **URL:** `http://localhost:3000/api/docs`
- **Available:** Development mode only
- **Features:** Interactive API testing, schema visualization

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "...",
  "environment": "development"
}
```

### Test Credentials
```
Admin User:
Email: admin@trabajahoy.com
Password: admin123
```

---

## Integration Guidelines

### 1. Authentication Setup

```typescript
// HTTP client setup (example with axios)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // Your token retrieval logic
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const newToken = await refreshTokens();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }
      // Refresh failed, redirect to login
      logout();
    }
    return Promise.reject(error);
  }
);
```

### 2. Error Handling

```typescript
// Centralized error handler
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Validation errors
        return data.data?.errors || [data.message];
      case 401:
        // Unauthorized
        return ['Session expired, please login again'];
      case 403:
        // Forbidden
        return ['You do not have permission to perform this action'];
      case 404:
        // Not found
        return ['Resource not found'];
      default:
        return ['An unexpected error occurred'];
    }
  }
  return ['Network error, please check your connection'];
};
```

### 3. Pagination Handling

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Fetch paginated data
const fetchVacancies = async (page = 1, limit = 10): Promise<PaginatedResponse<Vacancy>> => {
  const response = await api.get('/vacancies', { params: { page, limit } });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};
```

### 4. File Upload

```typescript
// Upload CV
const uploadCV = async (candidateId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(
    `/candidate/profile/${candidateId}/cv`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data.data;
};
```

### 5. Real-time Updates (Future)

When notification module is implemented, consider:
- WebSocket connection for real-time notifications
- Server-Sent Events (SSE) as alternative
- Polling as fallback (every 30-60 seconds)

---

## Module Implementation Status

| Module | Status | Features |
|--------|--------|----------|
| Authentication | ✅ Complete | Login, register, refresh, logout, me |
| Candidate Profile | ✅ Complete | Profile, experiences, education, skills, languages, CV, interests |
| Companies | ✅ Complete | CRUD, locations, benefits, members, verification |
| Vacancies | ✅ Complete | CRUD, categories, skills, benefits, management |
| Applications | ✅ Complete | Apply, saved jobs, follows, comments, status tracking |
| Admin | ✅ Complete | User management, role assignment, role filtering |
| Resources | ✅ Complete | CRUD, categories, ratings, related content |
| Forum | ✅ Complete | Categories, threads, posts, reports, moderation |
| Reviews | ⏳ Pending | Company reviews and ratings |
| Notifications | ⏳ Pending | User notifications and alerts |

---

## Quick Start Checklist

### For Frontend Development

1. **Setup API Client**
   - [ ] Configure base URL
   - [ ] Add auth interceptor
   - [ ] Implement token refresh logic
   - [ ] Add error handling

2. **Authentication Flow**
   - [ ] Login page
   - [ ] Registration page
   - [ ] Token storage (httpOnly cookies recommended)
   - [ ] Auto-refresh tokens
   - [ ] Logout functionality

3. **Core Features**
   - [ ] Candidate profile forms
   - [ ] Company pages
   - [ ] Job listing with filters
   - [ ] Job detail page
   - [ ] Application forms
   - [ ] User dashboard (role-based)

4. **Role-Based Routing**
   - [ ] Protect routes by role
   - [ ] Redirect unauthorized access
   - [ ] Show role-specific navigation

5. **File Upload**
   - [ ] CV upload component
   - [ ] File validation (size, type)
   - [ ] Display signed URLs
   - [ ] Handle upload errors

6. **Pagination**
   - [ ] Implement pagination component
   - [ ] Handle page changes
   - [ ] Display total results

7. **Error Handling**
   - [ ] Global error boundary
   - [ ] Form validation errors
   - [ ] Network error messages
   - [ ] Loading states

---

## Common Integration Patterns

### Optimistic Updates
For actions like saving jobs or following companies, consider optimistic UI updates:
1. Update UI immediately
2. Send API request
3. Revert on error

### Debounced Search
For search inputs (jobs, companies, users):
- Debounce API calls by 300-500ms
- Cancel previous requests
- Show loading indicator

### Form Validation
- Use Zod schemas (same as backend) for client-side validation
- Show inline validation errors
- Disable submit until form is valid

### Caching Strategy
- Cache public data (jobs, companies, categories)
- Invalidate cache on mutations
- Use SWR/React Query patterns if applicable

---

## Support & Documentation

- **API Docs:** `http://localhost:3000/api/docs` (Swagger UI)
- **Backend Repo:** Check AGENTS.md and README.md for architecture details
- **Issues:** Report API issues to backend team
- **Testing:** Use Swagger UI or Postman for manual testing

---

<div align="center">

**Last Updated:** April 12, 2026

**API Version:** 1.0.0

Made with ❤️ by the TrabajaHoy Team

</div>
