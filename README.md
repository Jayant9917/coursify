# Coursify

A modern course management platform built with Node.js, Express, and MongoDB.

# Creating a course selling app
- Initialize a new Node.js project
- Add Express, jsonwebtoken, mongoose to it as a dependency
- Create index.js
- Add route skeleton for user login, signup, purchase a course, sees all courses, sees the purchased courses course
- Add routes for admin login, admin signup, create a course, delete a course, add course content.
- Define the schema for User, Admin, Course, Purchase
- Add a database (mongodb), use dotenv to store the database connection string
- Add middlewares for user and admin auth
- Complete the routes for user login, signup, purchase a course, see course (Extra points - Use express routing to better structure your routes)
- Create the frontend

## Features

- User authentication and management
- Admin dashboard and controls
- Course creation and management
- Course purchase system
- RESTful API architecture

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **ORM**: Mongoose
- **API**: RESTful API

## Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB Atlas account or local MongoDB installation
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coursify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your MongoDB connection string:
```
MONGODB_URI=your_mongodb_connection_string
```

4. Start the server:
```bash
npm start
```

The server will start running on port 3001.

## API Endpoints

### User Routes (`/api/v1/user`)
- User registration and authentication
- User profile management

### Course Routes (`/api/v1/course`)
- Course listing
- Course details
- Course purchase

### Admin Routes (`/api/v1/admin`)
- Admin authentication
- Course management
- User management

## Database Schema

### User Schema
- email (unique)
- password
- firstName
- lastName

### Admin Schema
- email (unique)
- password
- firstName
- lastName

### Course Schema
- title
- description
- price
- imageUrl
- creatorId

### Purchase Schema
- userId (reference to User)
- courseId (reference to Course)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


