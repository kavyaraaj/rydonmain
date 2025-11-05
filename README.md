[updated_flow_doc (1).md](https://github.com/user-attachments/files/23359566/updated_flow_doc.1.md)
# 🚗 Roadside Assistance - Updated Flow Documentation

## 📋 Overview

The app now follows a **subscription-only payment model**. Users pay for monthly/yearly subscriptions to access service requests. Individual service payments are collected **offline** at the location.

---

## 🎯 New Flow Summary

### **1. User Registration & Free Trial**
- New user registers → Automatically gets **FREE plan**
- **5 free service requests** (lifetime, not monthly)
- No credit card required
- Can start using immediately

### **2. Creating Service Requests**
- User creates request with:
  - Vehicle details
  - Issue type (Battery, Tire, Towing, etc.)
  - Location
  - Description & photos
- **No payment required at creation**
- System matches workshops within 5-10km radius
- Workshops notified in real-time via Socket.IO

### **3. Workshop Acceptance**
- Workshop views pending requests
- Workshop accepts request
- Can provide estimated cost breakdown:
  ```json
  {
    "labor": 500,
    "parts": 1500,
    "travel": 200,
    "total": 2200,
    "notes": "Battery replacement + travel charges"
  }
  ```
- User sees estimate but **doesn't pay via app**

### **4. Service Execution**
- Real-time chat between user & workshop
- Workshop updates status: `Accepted` → `InProgress` → `Completed`
- Live location tracking of mechanic (via Socket.IO)
- Workshop can update pricing estimate anytime

### **5. Payment at Location**
- Mechanic completes service
- **Payment collected offline** (Cash/UPI/Card)
- Workshop marks payment mode in app
- Request marked as complete

### **6. Subscription Management**
- After 5 free requests → Must subscribe
- **Basic Plan**: ₹99/month (15 requests/month)
- **Premium Plan**: ₹199/month (25 requests/month)
- Yearly plans available (2 months free)
- Payment via Razorpay
- Quota resets automatically every month

---

## 🔄 Complete API Flow Example

### **Step 1: Register New User**
```http
POST /api/v1/auth/user/register
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "Rajesh Kumar",
    "membership": {
      "plan": "free",
      "requestsUsed": 0,
      "maxRequests": 5
    }
  },
  "token": "eyJhbGc..."
}
```

---

### **Step 2: Add Vehicle**
```http
POST /api/v1/users/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "4W",
  "brand": "Maruti",
  "model": "Swift",
  "registrationNumber": "MH31AB1234",
  "fuelType": "Petrol",
  "color": "Red",
  "year": 2020
}
```

---

### **Step 3: Create Service Request (No Payment)**
```http
POST /api/v1/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleId": "vehicle_id_here",
  "issueType": "Battery",
  "description": "Car won't start, battery seems dead",
  "location": {
    "lat": 21.1458,
    "lng": 79.0882,
    "address": "Sitabuldi, Nagpur, Maharashtra"
  },
  "attachments": ["https://example.com/photo1.jpg"]
}
```

**Response:**
```json
{
  "message": "Service request created successfully",
  "request": {
    "_id": "req_123",
    "status": "Pending",
    "issueType": "Battery",
    "location": {...},
    "user": {...},
    "vehicle": {...}
  },
  "notifiedWorkshops": 3
}
```

**What happens:**
- ✅ Request created
- ✅ 3 nearby workshops notified via Socket.IO
- ✅ User's request count: 1/5 used
- ❌ NO payment collected

---

### **Step 4: Workshop Accepts Request**
```http
PATCH /api/v1/requests/req_123/assign
Authorization: Bearer <workshop_token>
Content-Type: application/json

{
  "mechanicDetails": {
    "name": "Suresh Mechanic",
    "phone": "9123456789"
  },
  "eta": "2025-10-26T15:30:00Z"
}
```

**Socket.IO Event sent to user:**
```javascript
{
  event: "request_accepted",
  data: {
    requestId: "req_123",
    workshop: {
      name: "Express Auto Care",
      phone: "9123456780",
      rating: 4.5
    },
    mechanic: {
      name: "Suresh Mechanic",
      phone: "9123456789"
    },
    eta: "2025-10-26T15:30:00Z"
  }
}
```

---

### **Step 5: Workshop Updates with Pricing Estimate**
```http
PATCH /api/v1/requests/req_123/status
Authorization: Bearer <workshop_token>
Content-Type: application/json

{
  "status": "InProgress",
  "pricingEstimate": {
    "labor": 500,
    "parts": 1500,
    "travel": 200,
    "total": 2200,
    "notes": "New battery required. Exide brand."
  }
}
```

**User sees estimate in app but NO payment prompt**

---

### **Step 6: Chat Communication**
```http
POST /api/v1/chat/requests/req_123/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How long will it take?"
}
```

**Socket.IO broadcasts to request room**

---

### **Step 7: Service Completed - Payment Offline**
```http
PATCH /api/v1/requests/req_123/status
Authorization: Bearer <workshop_token>
Content-Type: application/json

{
  "status": "Completed",
  "paymentMode": "upi"
}
```

**What happens:**
- ✅ Request marked complete
- ✅ Payment mode recorded (cash/upi/card)
- ✅ User's free requests: 2/5 used
- ✅ Workshop earns money (paid offline)
- ❌ NO Razorpay payment

---

### **Step 8: After 5 Requests - Subscription Required**

When user tries 6th request:
```json
{
  "error": "Free trial limit reached. Please upgrade to continue.",
  "membership": {
    "plan": "free",
    "requestsUsed": 5,
    "maxRequests": 5
  },
  "message": "You have used all 5 free requests. Subscribe to a plan to continue using our services."
}
```

---

### **Step 9: View Available Plans**
```http
GET /api/v1/payments/plans
```

**Response:**
```json
{
  "plans": [
    {
      "name": "free",
      "priceMonthly": 0,
      "priceYearly": 0,
      "maxRequestsMonthly": 5,
      "features": ["5 service requests (one-time)", "Basic support"]
    },
    {
      "name": "basic",
      "priceMonthly": 99,
      "priceYearly": 990,
      "maxRequestsMonthly": 15,
      "features": ["15 requests/month", "Basic support", "Standard response"]
    },
    {
      "name": "premium",
      "priceMonthly": 199,
      "priceYearly": 1990,
      "maxRequestsMonthly": 25,
      "features": ["25 requests/month", "Priority support", "Faster response", "Exclusive offers"]
    }
  ]
}
```

---

### **Step 10: Subscribe to Premium Plan**
```http
POST /api/v1/payments/subscription/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "message": "Subscription order created",
  "order": {
    "id": "order_xyz123",
    "amount": 19900,
    "currency": "INR"
  },
  "payment": {
    "_id": "pay_abc123",
    "orderId": "sub_1698765432",
    "status": "created"
  }
}
```

**User completes payment via Razorpay UI**

---

### **Step 11: Razorpay Webhook (Auto-handled)**

After successful payment, Razorpay sends webhook:
```http
POST /api/v1/payments/webhook
x-razorpay-signature: <signature>
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xyz",
        "order_id": "order_xyz123",
        "amount": 19900,
        "status": "captured"
      }
    }
  }
}
```

**System automatically:**
- ✅ Verifies signature
- ✅ Updates user membership to "premium"
- ✅ Sets quota to 25 requests/month
- ✅ Sets expiry to 30 days from now
- ✅ Resets requestsUsed to 0

---

### **Step 12: User Can Now Make More Requests**
```json
{
  "membership": {
    "plan": "premium",
    "requestsUsed": 0,
    "maxRequests": 25,
    "expiry": "2025-11-26T..."
  }
}
```

User can now create 25 requests per month!

---

## 💰 Revenue Model

### **User Side:**
- **Free**: 5 lifetime requests (₹0)
- **Basic**: ₹99/month or ₹990/year (15 requests/month)
- **Premium**: ₹199/month or ₹1990/year (25 requests/month)

### **Workshop Side:**
- **SaaS Subscription**: ₹300/month
- Workshops earn from service fees (collected offline)
- No commission taken by platform on service charges

### **Platform Revenue:**
- User subscriptions (Basic + Premium)
- Workshop SaaS subscriptions
- **Not taking commission on individual services**

---

## 🔐 Key Changes from Original

| Aspect | Old Flow | New Flow |
|--------|----------|----------|
| **Service Payment** | Via Razorpay in-app | Offline (cash/UPI/card) |
| **Pricing** | User pays via app | Shown as estimate only |
| **Free Trial** | None | 5 free requests |
| **Revenue Model** | Per-service commission | Subscription only |
| **Workshop Earnings** | Platform takes cut | 100% to workshop |
| **Payment APIs** | Complex (per-request) | Simple (subscription only) |

---

## 📱 Mobile App Integration Points

### **1. Request Creation Screen**
- Show remaining quota: "2 of 5 free requests remaining"
- No payment UI required
- Just location, issue type, photos

### **2. Workshop Estimate Screen**
- Display pricing breakdown
- Show: "Payment will be collected at location"
- No "Pay Now" button

### **3. Subscription Prompt**
- After 5 requests: "Upgrade to continue"
- Show plan comparison
- Razorpay payment integration

### **4. Request Tracking**
- Live chat
- Mechanic location tracking
- Status updates
- Estimated cost display

---

## ✅ Testing Checklist

1. ✅ Register new user → Check free plan assigned
2. ✅ Create 5 requests → All should work
3. ✅ Try 6th request → Should get upgrade prompt
4. ✅ View plans → Should show all 3 plans
5. ✅ Subscribe to premium → Razorpay order created
6. ✅ Complete payment → Webhook activates subscription
7. ✅ Create more requests → Should work (25/month)
8. ✅ Workshop accepts → No payment prompt for user
9. ✅ Complete service → Mark payment mode offline
10. ✅ Check quota reset → Should reset after 30 days

---

## 🎉 Benefits of New Flow

### **For Users:**
- ✅ Try before you buy (5 free requests)
- ✅ Simple subscription model
- ✅ Pay mechanics directly (trust building)
- ✅ No hidden fees
- ✅ Cancel anytime

### **For Workshops:**
- ✅ Get 100% of service charges
- ✅ Simple monthly SaaS fee
- ✅ No commission per job
- ✅ Direct customer relationship
- ✅ Offline payment freedom

### **For Platform:**
- ✅ Predictable revenue (subscriptions)
- ✅ Lower payment processing fees
- ✅ Simpler accounting
- ✅ Better user retention
- ✅ Scalable model

---

## 📞 Support & Next Steps

The backend is now updated with:
- ✅ Subscription-only payment model
- ✅ Free trial for new users
- ✅ Offline payment tracking
- ✅ Simplified payment APIs
- ✅ Updated Postman collection

**Ready to test!** 🚀
