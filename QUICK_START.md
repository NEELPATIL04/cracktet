# Quick Start Guide

## Your CrackTET Application is Ready! 🎉

The development server is running at: **http://localhost:3000**

## What's Been Built

✅ **Home Page** - Complete with slideshow, About TET, What is CrackTET, and Why Choose CrackTET sections
✅ **Registration Page** - Form with validation and "Why Choose CrackTET" sidebar
✅ **Admin Dashboard** - View all registered users with responsive table/cards
✅ **Multi-language Support** - English, Hindi, and Marathi with navbar toggle
✅ **Database Setup** - PostgreSQL with Drizzle ORM, users table created
✅ **Orange & White Theme** - Professional color scheme with animations
✅ **Form Validation** - Unique mobile number check and field validation
✅ **Success Popup** - Shows after registration with auto-redirect

## Pages to Visit

1. **Home Page**: http://localhost:3000
   - Hero slideshow with TET information
   - About TET exam with key points
   - What is CrackTET features
   - Why Choose CrackTET benefits

2. **Registration**: http://localhost:3000/register
   - Fill out the form (left side)
   - See benefits (right side)
   - Get success popup
   - Auto-redirect to home

3. **Admin Dashboard**: http://localhost:3000/admin
   - View all registered users
   - See user details in table format
   - Responsive design for mobile

## Test the Application

### Step 1: Register a User
1. Click "Register" in the navbar
2. Fill in:
   - Name: Your name
   - District: Select any Maharashtra district
   - Mobile: Any 10-digit number (e.g., 9876543210)
   - Password: At least 6 characters
3. Click "Register Now"
4. See the success popup
5. Auto-redirect to home page

### Step 2: View in Admin
1. Click "Admin" in the navbar
2. See your registered user in the table
3. Check the details are correct

### Step 3: Test Language Toggle
1. Click the language dropdown (shows current language)
2. Select हिंदी or मराठी
3. See all content translate
4. Switch back to English

### Step 4: Try Duplicate Registration
1. Go to Registration page
2. Use the same mobile number
3. See error message: "This mobile number is already registered"

## Add Slideshow Images (Optional)

Currently, the slideshow uses a gradient background. To add images:

1. Create the images folder:
   ```bash
   mkdir public\images
   ```

2. Add three images (see `public/IMAGES_GUIDE.md` for details):
   - slide1.jpg (1920x1080px)
   - slide2.jpg (1920x1080px)
   - slide3.jpg (1920x1080px)

3. Refresh the page to see images

## Key Features Working

### Multi-language
- Navbar labels change
- All content translates
- Form labels and errors translate
- Districts names translate
- Stored in localStorage

### Form Validation
- Name required
- District must be selected
- Mobile must be exactly 10 digits
- Mobile must be unique
- Password minimum 6 characters
- Real-time error messages

### Animations
- Smooth page transitions
- Hover effects on buttons
- Rotating icons
- Fade-in content sections
- Success popup animation

### Database
- PostgreSQL connected
- Users table created
- Unique mobile constraint
- Timestamps for registration
- API routes working

## Database Schema

```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## API Endpoints

- `POST /api/register` - Register new user
- `GET /api/users` - Get all registered users

## Tech Stack Summary

- **Next.js 15.5.6** with App Router
- **TypeScript** for type safety
- **PostgreSQL** for database
- **Drizzle ORM** for database queries
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Icons** for icons
- **Zod** for validation

## Important Notes

1. **Password Security**: Passwords are currently stored as plain text. In production, use bcrypt to hash them.

2. **Admin Access**: The admin page is publicly accessible. Add authentication for production.

3. **Database URL**: Configured in `.env` file:
   ```
   postgres://postgres:welcome@123@localhost:5432/cracktet
   ```

4. **Mobile Validation**: Checks for uniqueness during registration to prevent duplicates.

## Development Commands

```bash
# Start development server (already running)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Push database schema
npm run db:push

# Open database studio
npm run db:studio
```

## Next Steps

1. Test all features thoroughly
2. Add slideshow images if desired
3. Customize colors in `tailwind.config.ts`
4. Add more districts if needed in locales files
5. Implement password hashing for production
6. Add authentication system
7. Deploy to Vercel or other hosting

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database `cracktet` exists

### Port Already in Use
- Stop the current server (Ctrl+C)
- Run `npm run dev` again

### Images Not Showing
- Check images are in `public/images/`
- Names must be exact: slide1.jpg, slide2.jpg, slide3.jpg
- Refresh the browser

## Support

For detailed documentation, see `README.md`

---

**Enjoy building with CrackTET!** 🚀
