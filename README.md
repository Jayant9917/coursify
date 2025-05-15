# Coursify - Online Course Platform

Coursify is a full-stack web application that allows users to browse, purchase, and access online courses. The platform includes both user and admin interfaces for course management.

## Features

### User Features
- User authentication (signup/signin)
- Browse available courses
- View detailed course information
- Purchase courses
- Access purchased courses
- Responsive design for all devices

### Admin Features
- Admin authentication
- Create new courses
- Edit existing courses
- Delete courses
- View all courses
- Manage course content

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome Icons
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Zod for validation

## Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Jayant9917/coursify.git
cd coursify
```

2. Install backend dependencies:
```bash
cd Backend
npm install
```

3. Create a `.env` file in the Backend directory with the following variables:
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the backend server:
```bash
npm run start
```

5. Open the Frontend folder and serve the files using a local server (e.g., Live Server in VS Code)

## Project Structure

```
Coursify/
├── Frontend/
│   ├── index.html          # Main user interface
│   ├── admin.html          # Admin dashboard
│   ├── style.css           # Global styles
│   ├── script.js           # User interface logic
│   └── admin.js            # Admin dashboard logic
│
├── Backend/
│   ├── index.js            # Server entry point
│   ├── db.js               # Database connection
│   ├── config.js           # Configuration
│   ├── middleware/         # Custom middleware
│   └── routers/            # API routes
│
└── README.md
```

## API Endpoints

### User Routes
- `POST /api/v1/user/signup` - Register new user
- `POST /api/v1/user/signin` - User login
- `GET /api/v1/user/purchases` - Get user's purchased courses
- `POST /api/v1/course/purchase` - Purchase a course

### Admin Routes
- `POST /api/v1/admin/signup` - Register new admin
- `POST /api/v1/admin/signin` - Admin login
- `POST /api/v1/admin/course` - Create new course
- `PUT /api/v1/admin/course/:id` - Update course
- `DELETE /api/v1/admin/course/:id` - Delete course
- `GET /api/v1/admin/courses` - Get all courses

### Course Routes
- `GET /api/v1/course/preview` - Get all courses (preview)

## Usage

1. Start the backend server:
```bash
cd Backend
npm start
```

2. Open `Frontend/index.html` in your browser to access the user interface
3. Open `Frontend/admin.html` to access the admin dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## Acknowledgments

- Font Awesome for icons
- MongoDB for database
- Express.js for backend framework
- Node.js for runtime environment

## Contact

Your Name - ranajayant527@gmail.com
Project Link: [https://github.com/Jayant9917/coursify.git](https://github.com/yourusername/coursify)


