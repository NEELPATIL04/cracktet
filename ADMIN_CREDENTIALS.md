# Admin Access Credentials

## 🔐 Admin Login Information

**Admin Login URL**: http://localhost:3000/admin/login

### Default Admin Credentials

```
Admin ID:  admin123
Password:  admin@cracktet
```

⚠️ **IMPORTANT**: These are default credentials for development. Please change them in production!

---

## 📍 Admin Routes

### Admin Login Page
- **URL**: `/admin/login`
- **Full URL**: http://localhost:3000/admin/login
- **Access**: Public (login required)
- **Features**:
  - Admin ID and password authentication
  - Multi-language support
  - Success popup with auto-redirect
  - Form validation

### Admin Dashboard
- **URL**: `/admin`
- **Full URL**: http://localhost:3000/admin
- **Access**: Protected (requires authentication)
- **Features**:
  - View all registered users
  - User details table (responsive)
  - Total user count
  - Logout button
  - Multi-language support

---

## 🔄 How to Access Admin Dashboard

### Step 1: Navigate to Login
Visit: http://localhost:3000/admin/login

### Step 2: Enter Credentials
- **Admin ID**: `admin123`
- **Password**: `admin@cracktet`

### Step 3: Login
Click "Login" button

### Step 4: Access Dashboard
You'll be automatically redirected to http://localhost:3000/admin

---

## ✨ Admin Features

### Authentication System
- ✅ Cookie-based authentication (httpOnly)
- ✅ Protected routes with automatic redirect
- ✅ Session verification on page load
- ✅ Logout functionality
- ✅ 24-hour session duration

### Security Features
- ✅ Admin link removed from navbar (access only via URL)
- ✅ Password-protected access
- ✅ Automatic redirect if not authenticated
- ✅ HttpOnly cookies to prevent XSS
- ✅ Session expiry after 24 hours

### Dashboard Features
- ✅ View all registered users
- ✅ User details: ID, Name, District, Mobile, Registration Date
- ✅ Responsive table for desktop
- ✅ Card layout for mobile
- ✅ Total user count
- ✅ Real-time data from database
- ✅ Logout button
- ✅ Multi-language support

---

## 🗄️ Database

### Admins Table
```sql
admins (
  id SERIAL PRIMARY KEY,
  admin_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Current Admin Record
- **ID**: 1
- **Admin ID**: admin123
- **Password**: admin@cracktet (plain text - should be hashed in production)
- **Name**: Super Admin

---

## 🔧 API Endpoints

### Admin Authentication APIs

#### 1. Login
- **Endpoint**: `POST /api/admin/login`
- **Body**:
  ```json
  {
    "adminId": "admin123",
    "password": "admin@cracktet"
  }
  ```
- **Response**: Sets httpOnly cookie and returns success

#### 2. Verify Authentication
- **Endpoint**: `GET /api/admin/verify`
- **Headers**: Automatically sends cookie
- **Response**: Returns authentication status

#### 3. Logout
- **Endpoint**: `POST /api/admin/logout`
- **Headers**: Automatically sends cookie
- **Response**: Clears authentication cookie

#### 4. Seed Admin (Development Only)
- **Endpoint**: `GET /api/seed-admin`
- **Purpose**: Creates default admin if not exists
- **Usage**: Visit http://localhost:3000/api/seed-admin

---

## 🌐 Multi-Language Support

The admin login and dashboard support all three languages:

### English
- Admin Login
- Access the admin dashboard

### Hindi (हिंदी)
- एडमिन लॉगिन
- एडमिन डैशबोर्ड तक पहुंचें

### Marathi (मराठी)
- प्रशासक लॉगिन
- प्रशासक डॅशबोर्डमध्ये प्रवेश करा

---

## 📱 Testing the Admin System

### Test Login Flow:
1. Visit http://localhost:3000/admin/login
2. Enter admin ID: `admin123`
3. Enter password: `admin@cracktet`
4. Click "Login"
5. See success message
6. Auto-redirect to dashboard

### Test Protected Route:
1. Try visiting http://localhost:3000/admin without logging in
2. You'll be automatically redirected to login page
3. After login, you can access the dashboard

### Test Logout:
1. Login to admin dashboard
2. Click "Logout" button in top right
3. You'll be redirected to login page
4. Cookie will be cleared

### Test Language Toggle:
1. On login page, change language
2. All text translates
3. Login with credentials
4. Dashboard also shows in selected language

---

## 🔒 Production Security Recommendations

### Must Do Before Production:

1. **Hash Passwords**
   - Use bcrypt to hash admin passwords
   - Update login API to use bcrypt.compare()

2. **Change Default Credentials**
   - Create new admin with strong password
   - Delete or disable default admin

3. **Secure Cookies**
   - Ensure `secure: true` in production
   - Use HTTPS only

4. **Rate Limiting**
   - Add rate limiting to login endpoint
   - Prevent brute force attacks

5. **Environment Variables**
   - Move sensitive config to .env
   - Never commit credentials to git

6. **Admin Management**
   - Create UI to add/remove admins
   - Implement role-based access control
   - Add password reset functionality

---

## 🚀 Quick Commands

```bash
# Start development server
npm run dev

# Access admin login
# Visit: http://localhost:3000/admin/login

# Seed admin (if not exists)
# Visit: http://localhost:3000/api/seed-admin

# View database
npm run db:studio
```

---

## 📊 Current System Status

✅ Admin link removed from navbar
✅ Admin authentication system implemented
✅ Admin login page created
✅ Admin dashboard protected
✅ Default admin user created
✅ Multi-language support added
✅ Logout functionality working
✅ Cookie-based session management
✅ Automatic redirect on auth fail

---

## 🎯 Summary

- **Admin Access**: Via URL only (not in navbar)
- **Login Required**: Yes, with Admin ID and password
- **Default Credentials**: admin123 / admin@cracktet
- **Session Duration**: 24 hours
- **Multi-language**: Yes (EN/HI/MR)
- **Mobile Responsive**: Yes
- **Logout**: Available in dashboard

---

**All admin features are fully functional! 🎉**
