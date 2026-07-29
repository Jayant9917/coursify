# Coursify Mission

## What Coursify Is

Coursify is a role-based online learning platform built to help people teach, learn, and manage courses in one place.

It brings together:

- a public course marketplace for discovery
- student learning tools for enrollment, progress, wishlist, reviews, and orders
- instructor tools for creating and managing courses
- admin tools for moderation and platform oversight
- a backend-driven upload and account system for secure media and profile management

## Core Mission

The mission of Coursify is to make online learning feel organized, trustworthy, and easy to scale.

It is designed to solve three problems at the same time:

1. Help learners find relevant courses quickly.
2. Help instructors publish and manage course content without friction.
3. Help admins maintain control over users, courses, coupons, and orders.

## Who Coursify Serves

### Students

Students use Coursify to:

- browse and search courses
- view course details
- purchase or enroll in courses
- track learning progress
- save favorite courses in a wishlist
- leave reviews and ratings
- manage their account profile and avatar

### Instructors

Instructors use Coursify to:

- create and edit courses
- organize lessons into sections
- upload course thumbnails and media
- publish or unpublish courses
- review instructor stats
- manage their teaching workspace

### Admins

Admins use Coursify to:

- manage users
- block or unblock accounts
- manage courses and categories
- manage coupons and discounts
- review orders
- monitor platform-wide performance

## Product Goal

The long-term goal of Coursify is to become a complete learning management and course commerce platform where:

- discovery is simple
- checkout is reliable
- course access is automatic after payment
- content management is easy for instructors
- platform control is clear for admins
- media uploads and account data remain secure

## Current Direction

The current codebase is moving toward a production-ready LMS with:

- authenticated and role-based access
- persistent refresh-token sessions
- Cloudinary-backed image uploads
- coupon support during checkout
- order creation and enrollment workflows
- password reset and account recovery
- dashboards for each user role

## What Makes Coursify Different

Coursify is not just a course listing site.

It is built to combine:

- public course discovery
- authenticated learning flows
- instructor publishing tools
- admin governance
- structured backend business logic

That means the backend is the source of truth for important rules, while the frontend focuses on a clean user experience.

## What Success Looks Like

Coursify is successful when:

- learners can sign up, find a course, pay, and start learning without confusion
- instructors can publish content and manage their catalog without needing technical help
- admins can control the platform without touching the database directly
- profile, authentication, upload, and payment flows work consistently
- the system stays understandable enough to extend in phases

## Guiding Principles

- Keep the app role-aware.
- Keep business rules in the backend.
- Store file URLs, not raw files, in the database.
- Keep the UI simple and focused.
- Make errors understandable for users.
- Build in phases so the platform remains maintainable.

## Short Version

Coursify exists to make online education easier to run and easier to use.

It is a structured learning platform for students, instructors, and admins, with the long-term goal of becoming a complete course marketplace and learning management system.
