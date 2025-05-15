# Coursify - Online Learning Platform

A full-stack web application for online course management and learning.

## Features

### Admin Features
- Admin authentication (signup/signin)
- Course management:
  - Create new courses
  - View all courses
  - View specific course details
  - Update course information
  - Delete courses

### User Features
- User authentication (signup/signin)
- Course browsing
- Course purchasing
- Course reviews and ratings

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Frontend
- HTML
- CSS
- JavaScript (Vanilla)

## Project Structure

```
coursify/
├── Backend/
│   ├── routers/
│   │   ├── admin.js
│   │   ├── course.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db.js
│   ├── config.js
│   └── index.js
└── Frontend/
    ├── index.html
    ├── admin.html
    ├── style.css
    ├── script.js
    └── admin.js
```

## API Endpoints

### Admin Routes
- `POST /api/v1/admin/signup` - Admin registration
- `POST /api/v1/admin/signin` - Admin login
- `POST /api/v1/admin/course` - Create new course
- `GET /api/v1/admin/courses/all` - Get all courses
- `GET /api/v1/admin/course/:courseId` - Get specific course
- `PUT /api/v1/admin/course/:courseId` - Update course
- `DELETE /api/v1/admin/course/:courseId` - Delete course

### User Routes
- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/signin` - User login
- `POST /api/v1/course/purchase` - Purchase a course
- `POST /api/v1/course/review/:courseId` - Add course review
- `GET /api/v1/course/reviews/:courseId` - Get course reviews

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   cd Backend
   npm install
   ```
3. Set up environment variables in `config.js`
4. Start the backend server:
   ```bash
   npm start
   ```
5. Open the Frontend files in your browser

## Environment Variables

Create a `config.js` file in the Backend directory with the following variables:
```javascript
module.exports = {
    PORT: 3001,
    MONGODB_URI: "your_mongodb_uri",
    JWT_SECRET: "your_jwt_secret"
};
```

## Security Features
- JWT-based authentication
- Password hashing
- Protected routes for admin and user actions

## Current Limitations
- Basic course structure without modules/lessons
- Simple review system
- Basic user progress tracking

## Future Enhancements
- Course content management (modules, lessons)
- Advanced user progress tracking
- Payment gateway integration
- Course search and filtering
- User profile management

## Acknowledgments

- Font Awesome for icons
- MongoDB for database
- Express.js for backend framework
- Node.js for runtime environment

## Contact

Your Name - ranajayant527@gmail.com
Project Link: [https://github.com/Jayant9917/coursify.git](https://github.com/yourusername/coursify)

