# 🏋️ Unique Fitness - Gym Management System (Backend)

Unique Fitness is a **full-stack gym management platform** designed to simplify fitness club operations and enhance the member experience.  
This repository contains the **backend (Node.js + Express + MongoDB)** APIs that power both the **Member App** and the **Admin Panel**.

🌐 **Live API Base URL**: [https://uniquefitness.onrender.com](https://uniquefitness.onrender.com)  
📖 **Postman API Documentation**: [View Documentation](https://documenter.getpostman.com/view/32197794/2sB3BGGUwh)

---

## 🚀 Features

### 👤 Member (User) Features
- Multi-step **User Registration** with OTP email verification
- Secure **Login / Logout** with JWT (Access & Refresh Tokens)
- Profile management: update details, Aadhaar photo, live photo
- **Custom workout schedule** (weekly plans, multiple muscle groups per day)
- **Diet plans** browsing and tracking
- **Weight history tracking**
- Membership management:
  - Choose plans
  - Renew memberships
  - Auto-activation after payment
- **Payment integration** with Razorpay
- View gym **announcements and notifications**

### 🛠️ Admin Features
- **Single admin account** (secure login)
- **Dashboard overview**:
  - Total members
  - Active / Expiring / Expired members
- **Manage members**:
  - View, edit, update membership, delete users
- **Membership plan management** (CRUD)
- **Workout management** (CRUD with categories + videos)
- **Diet plan management** (CRUD)
- **Announcements management** (publish updates to users)
- **Payments & Reports**:
  - View revenue
  - Track payment history
  - Membership statistics

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (Access + Refresh Tokens), bcrypt
- **Payments**: Razorpay
- **File Uploads**: Multer + Cloudinary
- **Email Service**: Nodemailer (for OTP)
- **Deployment**: Render (Free Tier)
- **API Documentation**: Postman

---


## 📂 Project Structure

```plaintext
backend/
├── src/
│   ├── controllers/        # Route controllers (User, Admin, Membership, Payment, etc.)
│   ├── middlewares/        # Authentication & error handling
│   ├── models/             # Mongoose models (User, Admin, Membership, Workout, DietPlan, Announcement, Payment)
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions (OTP, Cloudinary, JWT, ApiResponse, etc.)
│   ├── app.js              # Express app setup
│   └── index.js            # Server entry point
│
├── .env.sample             # Example environment variables
├── .gitignore              # Git ignore file
├── package.json            # Project metadata & dependencies
├── package-lock.json       # Exact dependency tree
└── README.md               # Project documentation
```

makefile

---

## 🔑 Environment Variables

Create a `.env` file in the root with the following variables:

```env
# Server
PORT=5000
MONGODB_URI=your-mongo-atlas-uri

# JWT
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

⚡ Getting Started

1. Clone the Repository
bash
git clone https://github.com/ganesh-rodge/uniquefitness.git
cd uniquefitness
2. Install Dependencies
bash
```
npm install
```
3. Setup Environment
Copy .env.sample to .env

Add your credentials (MongoDB, JWT secrets, Razorpay keys, Email, Cloudinary)

4. Run the Server
```
npm run dev   # Development with nodemon
npm start     # Production
```
5. Test APIs
Open Postman Documentation

Import collection and test APIs

#📌 API Overview
User Routes (/api/v1/user)
POST /send-otp – Send OTP for email verification

POST /verify-otp – Verify OTP

POST /register – Register new user

POST /login – Login user

POST /logout – Logout user

PATCH /update-photo – Update live photo

GET /current – Get current user details

PATCH /change-password – Change password

PATCH /update-weight – Update weight history

POST /forgot-password – Forgot password request

POST /reset-password – Reset password

Admin Routes (/api/v1/admin)
POST /login – Admin login

GET /members – Get all members (active, expiring, expired)

PATCH /member/:id – Update member by admin

DELETE /member/:id – Delete member

PATCH /change-password – Change admin password

POST /forgot-password – Forgot password request

POST /reset-password – Reset admin password

GET /reports – View reports

Announcements (/api/v1/announcement)
POST /create – Create announcement (Admin only)

GET / – Get all announcements

PATCH /:id – Update announcement

DELETE /:id – Delete announcement

Membership Plans (/api/v1/membership)
POST /create – Create plan

GET / – Get all plans

PATCH /:id – Update plan

DELETE /:id – Delete plan

Workouts (/api/v1/workout)
POST /create – Create workout

GET / – Get all workouts

PATCH /:id – Update workout

DELETE /:id – Delete workout

Diet Plans (/api/v1/dietplan)
POST /create – Create diet plan

GET / – Get all diet plans

PATCH /:id – Update diet plan

DELETE /:id – Delete diet plan

Payments (/api/v1/payment)
POST /create-order – Create Razorpay order

POST /verify – Verify payment and activate membership

GET /history/:userId – Get user payment history

📊 Reports & Analytics
Active Members Count

Expiring Soon Members

Expired Members

Total Revenue

Membership Distribution

🛡️ Security
Passwords hashed with bcrypt

JWT Authentication with Refresh Tokens

Secure file uploads via Cloudinary

CORS enabled for frontend integration

.env secrets not pushed (sample provided)

👨‍💻 Author
Ganesh Rodge
💼 Developer | 🚀 Backend Engineer | 🧑‍💻 Tech Enthusiast
📧 ganeshrodge25@gmail.com
🔗 LinkedIn
🔗 GitHub