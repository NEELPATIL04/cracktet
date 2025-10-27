# CrackTET - Maharashtra Teacher Eligibility Test Preparation Platform

A comprehensive Next.js application for Maharashtra TET exam preparation with multi-language support (English, Hindi, Marathi).

## Features

- **Multi-language Support**: Toggle between English, Hindi, and Marathi
- **User Registration**: Register with name, district, mobile number, and password
- **Unique Mobile Validation**: Prevents duplicate registrations
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Animated UI**: Smooth animations using Framer Motion
- **Admin Dashboard**: View all registered users and their details
- **Orange & White Theme**: Professional and clean color scheme

## Tech Stack

- **Framework**: Next.js 15.1.3 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Validation**: Zod

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running locally or remotely
- npm or yarn package manager

## Database Setup

1. Make sure PostgreSQL is running on your system
2. The application is configured to connect to:
   - Host: localhost
   - Port: 5432
   - Database: cracktet
   - Username: postgres
   - Password: welcome@123

3. Create the database:
   ```bash
   psql -U postgres
   CREATE DATABASE cracktet;
   \q
   ```

## Installation & Setup

1. Navigate to the project directory:
   ```bash
   cd cracktet
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Push the database schema:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
cracktet/
├── app/
│   ├── api/
│   │   ├── register/route.ts    # Registration API endpoint
│   │   └── users/route.ts        # Get all users API endpoint
│   ├── admin/page.tsx            # Admin dashboard
│   ├── register/page.tsx         # Registration page
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout with navbar
│   └── globals.css               # Global styles
├── components/
│   └── Navbar.tsx                # Navigation with language toggle
├── contexts/
│   └── LanguageContext.tsx       # Language state management
├── db/
│   ├── schema.ts                 # Database schema
│   └── index.ts                  # Database connection
├── locales/
│   ├── en.json                   # English translations
│   ├── hi.json                   # Hindi translations
│   └── mr.json                   # Marathi translations
└── public/
    └── images/                   # Slideshow images (to be added)
```

## Pages

### Home Page (/)
- Hero slideshow with TET exam images
- About TET Exam section with key points
- What is CrackTET section with features
- Why Choose CrackTET section with animated cards

### Registration Page (/register)
- Left: Registration form with validation
- Right: Why Choose CrackTET benefits
- Success popup with auto-redirect
- Unique mobile number validation

### Admin Page (/admin)
- View all registered users
- Responsive table/card layout
- User details: ID, Name, District, Mobile, Registration Date

## Database Schema

### Users Table
- `id`: Serial primary key
- `name`: User's full name
- `district`: Selected district from Maharashtra
- `mobile`: Unique 10-digit mobile number
- `password`: User password (Note: In production, should be hashed)
- `createdAt`: Registration timestamp

## Multi-language Support

The application supports three languages:
- **English (en)**: Default language
- **Hindi (hi)**: हिंदी
- **Marathi (mr)**: मराठी

Language selection is stored in localStorage and persists across sessions.

## Color Theme

- **Primary Orange**: #ff6b35
- **Light Orange**: #ff8c61
- **Dark Orange**: #e55525
- **White**: #ffffff
- **Light Gray**: #f5f5f5

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema to PostgreSQL
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Adding Slideshow Images

To add images for the home page slideshow:

1. Create the images directory:
   ```bash
   mkdir public/images
   ```

2. Add three images:
   - `public/images/slide1.jpg` - TET exam preparation image
   - `public/images/slide2.jpg` - Study materials image
   - `public/images/slide3.jpg` - Mock tests image

## Important Notes

1. **Password Security**: In a production environment, passwords should be hashed using bcrypt or similar before storing in the database.

2. **Authentication**: Currently, there's no authentication system. The admin page is publicly accessible. Consider adding authentication for production.

3. **Environment Variables**: Make sure the `.env` file is not committed to version control. Add it to `.gitignore` (already configured).

4. **Database Connection**: Ensure PostgreSQL is running before starting the application.

## Future Enhancements

- Add user authentication and login system
- Implement password hashing for security
- Add mock test functionality
- Include study materials section
- Add progress tracking for users
- Implement email verification
- Add forgot password functionality
- Create teacher dashboard with analytics

## Support

For issues or questions, please refer to the documentation or contact the development team.

---

Built with ❤️ for Maharashtra TET aspirants
