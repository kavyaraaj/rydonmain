# 🚀 Roadside Assistance Backend - Complete Setup Guide

## 📋 Prerequisites

Before you start, make sure you have these installed:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Check version: `node --version`

2. **MongoDB**
   - **Option A:** Install locally: https://www.mongodb.com/try/download/community
   - **Option B:** Use MongoDB Atlas (Cloud) - Recommended
     - Sign up: https://www.mongodb.com/cloud/atlas/register
     - Create free cluster
     - Get connection string

3. **Postman** (for testing APIs)
   - Download: https://www.postman.com/downloads/

4. **Git** (to clone the project)
   - Download: https://git-scm.com/downloads

---

## 📥 Step 1: Get the Project

### Option A: If you have the zip file
```bash
# Extract the zip file
# Open terminal/command prompt in the extracted folder
```

### Option B: If using Git
```bash
git clone <repository-url>
cd roadside-assistance-backend
```

---

## 📦 Step 2: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This will install all required packages. Wait for it to complete (may take 2-3 minutes).

---

## ⚙️ Step 3: Configure Environment Variables

1. **Find the `.env.example` file** in the project root
2. **Create a copy** and rename it to `.env`
3. **Update the following values:**

### **Required Configuration:**

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/roadside_assistance

# If using MongoDB Atlas (Cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roadside_assistance

# JWT Secret (Change this!)
JWT_SECRET=your_super_secret_key_change_this_in_production

# Razorpay (Get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Encryption Key (32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012
```

### **Using MongoDB Atlas (Recommended):**

1. Go to https://mongodb.com/cloud/atlas
2. Sign up / Login
3. Create a **FREE** cluster
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string
6. Replace `<password>` with your database password
7. Paste in `.env` file as `MONGODB_URI`

Example:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.mongodb.net/roadside_assistance?retryWrites=true&w=majority
```

---

## 🗄️ Step 4: Seed the Database

This will create sample data (users, workshops, vehicles, plans):

```bash
npm run seed
```

**You should see:**
```
✅ MongoDB connected successfully
✅ Cleared existing data
✅ Membership plans seeded
✅ Users seeded
✅ Workshops seeded
✅ Vehicles seeded

📊 Seed Summary:
   Users: 3
   Workshops: 3
   Vehicles: 3
   Membership Plans: 3

🔐 Test Credentials:
   User: john@example.com / password123
   Workshop: express@example.com / password123
   Admin: admin@example.com / password123

✅ Database seeding completed successfully!
```

---

## 🚀 Step 5: Start the Server

```bash
npm run dev
```

**You should see:**
```
info: ✅ MongoDB connected successfully
info: 🚀 Server running on port 5000
info: 📡 Socket.IO ready for connections
info: 🌍 Environment: development
```

✅ **Server is now running at:** `http://localhost:5000`

---

## 🧪 Step 6: Test the APIs

### **Option A: Using Postman (Recommended)**

1. **Import the Postman Collection:**
   - Open Postman
   - Click **Import**
   - Select the `Roadside_Assistance_Full.postman_collection.json` file
   - Click **Import**

2. **Test Health Check:**
   - Open **System** folder
   - Click **"Health Check"**
   - Click **Send**
   - You should see: `{ "status": "OK" }`

3. **Login as User:**
   - Open **Authentication** folder
   - Click **"Login User"**
   - Body should have:
     ```json
     {
       "email": "jane@example.com",
       "password": "password123"
     }
     ```
   - Click **Send**
   - ✅ Token automatically saved!

4. **Test Other APIs:**
   - Now you can test any API
   - Token is automatically used in requests

### **Option B: Using Browser**

Open: http://localhost:5000/health

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-10-29T...",
  "uptime": 123.456
}
```

---

## 👥 Test User Credentials

After seeding, use these credentials to login:

### **Regular Users:**
| Name | Email | Password | Plan | Requests |
|------|-------|----------|------|----------|
| John Doe | john@example.com | password123 | Premium | 25/month |
| Jane Smith | jane@example.com | password123 | Free | 5 lifetime |

### **Admin:**
| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@example.com | password123 | Admin |

### **Workshops:**
| Name | Email | Password |
|------|-------|----------|
| Express Auto Care | express@example.com | password123 |
| Quick Fix Motors | quickfix@example.com | password123 |
| EV Service Center | evservice@example.com | password123 |

---

## 📖 Common API Flows

### **Flow 1: User Creates Service Request**

1. **Login User**
   ```
   POST /api/v1/auth/user/login
   Body: { "email": "jane@example.com", "password": "password123" }
   ```

2. **Add Vehicle** (if needed)
   ```
   POST /api/v1/users/vehicles
   Header: Authorization: Bearer <token>
   Body: { vehicle details }
   ```

3. **Create Request**
   ```
   POST /api/v1/requests
   Header: Authorization: Bearer <token>
   Body: { vehicleId, issueType, description, location }
   ```

4. **Check Status**
   ```
   GET /api/v1/requests/my
   Header: Authorization: Bearer <token>
   ```

### **Flow 2: Workshop Accepts Request**

1. **Login Workshop**
   ```
   POST /api/v1/auth/workshop/login
   Body: { "email": "express@example.com", "password": "password123" }
   ```

2. **Get Pending Requests**
   ```
   GET /api/v1/workshops/requests?status=Pending
   Header: Authorization: Bearer <token>
   ```

3. **Accept Request**
   ```
   PATCH /api/v1/requests/:requestId/assign
   Header: Authorization: Bearer <token>
   Body: { mechanicDetails, eta }
   ```

4. **Complete Service**
   ```
   PATCH /api/v1/requests/:requestId/status
   Header: Authorization: Bearer <token>
   Body: { status: "Completed", paymentMode: "cash", pricingEstimate }
   ```

### **Flow 3: Subscribe to Premium**

1. **Login User**
2. **View Plans**
   ```
   GET /api/v1/payments/plans
   (No auth needed)
   ```

3. **Create Subscription**
   ```
   POST /api/v1/payments/subscription/create
   Header: Authorization: Bearer <token>
   Body: { "plan": "premium", "billingCycle": "monthly" }
   ```

4. **Get Razorpay Order** (in response)
5. Complete payment on Razorpay (test mode)

---

## 🔧 Troubleshooting

### **Problem: MongoDB connection failed**

**Solution:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```
2. Or use MongoDB Atlas (cloud) instead

### **Problem: Port 5000 already in use**

**Solution:**
Change port in `.env`:
```env
PORT=3000
```

### **Problem: "Cannot find module"**

**Solution:**
```bash
rm -rf node_modules
npm install
```

### **Problem: Razorpay "Payment service not configured"**

**Solution:**
1. Get Razorpay test keys from https://dashboard.razorpay.com
2. Update `.env` file:
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_actual_key
   RAZORPAY_KEY_SECRET=your_actual_secret
   ```
3. Restart server

### **Problem: "Membership plan not found"**

**Solution:**
Re-run seed:
```bash
npm run seed
```

---

## 📁 Project Structure

```
roadside-assistance-backend/
├── src/
│   ├── config/          # Database, Razorpay config
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation
│   ├── utils/           # Helper functions
│   ├── socket/          # Socket.IO handlers
│   └── server.js        # Entry point
├── scripts/
│   ├── seed.js          # Database seeding
│   └── exportAIData.js  # AI data export
├── logs/                # Server logs
├── .env                 # Configuration (YOU CREATE THIS)
├── .env.example         # Example config
├── package.json         # Dependencies
└── README.md            # Documentation
```

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env file with your values

# Seed database
npm run seed

# Start server (development)
npm run dev

# Start server (production)
npm start

# Run tests
npm test

# Export AI training data
npm run export-ai-data
```

---

## 📚 API Documentation

### **Base URL:** `http://localhost:5000/api/v1`

### **Available Endpoints:**

- **Authentication:** `/auth/user/*`, `/auth/workshop/*`
- **Users:** `/users/*`
- **Vehicles:** `/users/vehicles/*`
- **Requests:** `/requests/*`
- **Chat:** `/chat/*`
- **Workshops:** `/workshops/*`
- **Payments:** `/payments/*`
- **AI:** `/ai/*`
- **Admin:** `/admin/*`

**Full API documentation** is in the Postman collection!

---

## 🔐 Security Notes

1. **Never commit `.env` file** to Git
2. Change JWT_SECRET in production
3. Use strong passwords
4. Enable CORS only for allowed origins
5. Use HTTPS in production
6. Keep dependencies updated

---

## 🆘 Getting Help

1. **Check logs:** Look in `logs/` folder
2. **Console output:** Check terminal for errors
3. **Postman Console:** View request/response details
4. **Test with curl:**
   ```bash
   curl http://localhost:5000/health
   ```

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] MongoDB running (local or Atlas)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Database seeded (`npm run seed`)
- [ ] Server running (`npm run dev`)
- [ ] Postman collection imported
- [ ] Health check passes
- [ ] Login API works
- [ ] Test credentials work

---

## 🎉 You're Ready!

Your backend is now running locally. Share this guide with your colleagues!

**Next Steps:**
1. Test all APIs using Postman
2. Understand the flow (User → Request → Workshop → Complete)
3. Integrate with your mobile app
4. Deploy to production when ready

---

## 📞 Contact

If you face any issues, check:
- Server console logs
- MongoDB connection
- `.env` configuration
- Postman collection setup

**Happy coding! 🚀**