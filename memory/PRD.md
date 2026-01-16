# Shraddha Enterprises - Product Showcase Website

## Project Overview
A professional, aesthetic, fully responsive query-based product showcase website for Shraddha Enterprises - an industrial products business based in Pune, Maharashtra, India.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT-based admin auth

## Core Requirements (Static)
- No e-commerce checkout (no cart, no payments)
- Query-based interaction model
- Local image/video storage with relative paths in MongoDB
- Dark/Light mode toggle
- Responsive design (mobile/tablet/desktop)
- Gmail SMTP for email notifications

## User Personas
1. **Website Visitors/Customers**: B2B customers browsing industrial products and submitting inquiries
2. **Website Administrator**: Shraddha Enterprises owner managing products, categories, videos, and customer queries

## What's Been Implemented (December 2024)

### Phase 1 - MVP Complete ✅
- [x] Homepage with hero section, featured products, video section, CTA
- [x] Products page with category/subcategory filters and search
- [x] Product detail page with image gallery and query modal
- [x] Videos page with video grid
- [x] Contact page with form and Google Maps embed
- [x] Dark/Light mode toggle with localStorage persistence
- [x] Admin login/registration with JWT authentication
- [x] Admin dashboard with CRUD for:
  - Products (with multiple image uploads)
  - Categories and Subcategories
  - Videos
  - Customer queries management
- [x] Query submission with email notifications (MOCKED - requires Gmail credentials)
- [x] Mobile responsive design with Call Now button (mobile only)
- [x] Sample data seeding (4 categories, 8 subcategories, 6 products)

## Prioritized Backlog

### P0 - Critical (Next)
- Configure Gmail SMTP credentials for email notifications
- Add phone number for business

### P1 - Important
- Add product bulk import/export functionality
- Add admin password reset functionality
- Implement query response/follow-up system

### P2 - Nice to Have
- Add product specifications/technical details fields
- Implement related products section
- Add newsletter subscription
- SEO optimization with meta tags

## API Endpoints
- `GET /api/products` - List products with filters
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)
- `GET/POST/DELETE /api/categories` - Category CRUD
- `GET/POST/DELETE /api/subcategories` - Subcategory CRUD
- `GET/POST/DELETE /api/videos` - Video CRUD
- `POST /api/queries` - Submit customer query
- `GET /api/queries` - List queries (admin)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration

## Environment Variables Required
### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_APP_PASSWORD` - Gmail app password
- `ADMIN_EMAIL` - Admin email for notifications

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL

## Business Address
Shraddha Enterprises
Indradhanu, Sector No. 21, Scheme No. 4, Plot No. 78
Yamunanagar, Nigdi, Pune – 411044
Maharashtra, India
