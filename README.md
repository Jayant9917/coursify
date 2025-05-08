# Coursify

Coursify is a RESTful API service built with Node.js and Express.js for managing courses, users, and administrative functions. The application uses MongoDB as its database and implements JWT authentication for secure access.

## Features

- User authentication and authorization
- Course management
- Admin dashboard
- RESTful API endpoints
- MongoDB database integration
- JWT-based security

## Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

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

3. Create a `.env` file in the root directory and add the following environment variables:
```
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
coursify/
├── config.js         # Configuration settings
├── db.js            # Database connection setup
├── index.js         # Main application entry point
├── middleware/      # Custom middleware functions
├── routers/         # API route handlers
│   ├── admin.js     # Admin routes
│   ├── course.js    # Course routes
│   └── user.js      # User routes
└── package.json     # Project dependencies and scripts
```

## API Endpoints

### User Routes (`/api/v1/user`)
- User registration and authentication
- User profile management

### Course Routes (`/api/v1/course`)
- Course creation and management
- Course listing and details

### Admin Routes (`/api/v1/admin`)
- Administrative functions
- User management
- System settings

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start running on port 3001.

## Dependencies

- express: Web framework
- mongoose: MongoDB object modeling
- bcrypt: Password hashing
- jsonwebtoken: JWT authentication
- dotenv: Environment variable management
- zod: Schema validation
- nodemon: Development server with auto-reload

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Environment variable protection
- Input validation with Zod

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request


