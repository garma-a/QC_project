Project Description

Backend system built with NestJS implementing JWT authentication, role-based access control, and soft delete for users.

Features

JWT authentication

Role-based authorization (ADMIN / INTERN)

Soft delete (isActive flag)

Secure login validation

Password hashing with Argon2


JWT_SECRET=your_secret_here
DATABASE_URL=your_database_url
ADMIN_EMAIL=
ADMIN_PASSWORD=

How to Run
npm install
npm run start:dev