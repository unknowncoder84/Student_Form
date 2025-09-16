# Setup and Run Guide: College Form System with Supabase and Google Authentication

This guide provides clear, step-by-step instructions for setting up and running the College Form System with Supabase as the main database and Google authentication.

## Prerequisites

1. Node.js (version 14 or higher)
2. A Supabase account (free tier available at [supabase.com](https://supabase.com/))
3. A Google Cloud Platform account (for Google authentication)

## Step 1: Project Setup

1. Navigate to the project directory:
   ```bash
   cd STUDENT_FORM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Step 2: Supabase Configuration

1. Create a Supabase account at [supabase.com](https://supabase.com/)
2. Create a new project
3. In your Supabase project dashboard, go to "Project Settings" → "API"
4. Copy your "Project URL" and "Service Role Key"

## Step 3: Environment Configuration

1. Create a `.env` file in the project root directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   ```

2. Replace the placeholder values with your actual Supabase credentials

## Step 4: Database Setup

1. In your Supabase project, go to the SQL editor
2. Run the following SQL to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    student_id VARCHAR(50),
    department VARCHAR(255),
    teacher_id VARCHAR(50),
    provider VARCHAR(50), -- 'google' for Google Auth, NULL for email/password
    provider_id VARCHAR(255), -- Google user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    parent_question_id INTEGER,
    is_locked BOOLEAN DEFAULT false,
    order_index INTEGER,
    auto_unlock_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_question_id) REFERENCES questions(id)
);

-- Create student_responses table
CREATE TABLE student_responses (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    response TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, question_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

## Step 5: Google Authentication Setup (Optional)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application" as the application type
6. Add the following authorized redirect URI:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
7. Click "Create" and save the Client ID and Client Secret
8. In your Supabase project dashboard, go to "Authentication" → "Providers"
9. Find "Google" and enable it
10. Enter the Google Client ID and Client Secret from Step 7

## Step 6: Update Frontend Configuration

1. Open `login.js` in a text editor
2. Find the Supabase initialization function:
   ```javascript
   function initSupabase() {
       // These values should be set as environment variables in production
       const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
       const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY'; // Replace with your Supabase anon key
       
       if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_KEY') {
           console.warn('Supabase credentials not configured. Google authentication will not work.');
           return false;
       }
       
       supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
       return true;
   }
   ```
3. Replace `'YOUR_SUPABASE_URL'` and `'YOUR_SUPABASE_KEY'` with your actual Supabase credentials

## Step 7: Run the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. Open `index.html` in your web browser
   - The application will be available at `http://localhost:5000` by default

## Step 8: Test the Application

### Demo Credentials
The application will automatically create demo users on first run:

- **Student**: username: `student1`, password: `student123`
- **Faculty**: username: `faculty1`, password: `faculty123`

### Google Authentication
1. Click on "Sign in with Google" for either student or faculty login
2. Complete the Google authentication flow
3. Fill in the required additional information:
   - **Students**: Student ID
   - **Faculty**: Department and Teacher ID

## Troubleshooting

### Common Issues

1. **"Invalid supabaseUrl" Error**
   - Make sure you've set the SUPABASE_URL environment variable correctly
   - Check that the URL starts with `https://`

2. **Authentication Errors**
   - Ensure you're using the Service Role Key, not the Anon key
   - Verify your Google OAuth credentials are correctly configured

3. **Database Connection Issues**
   - Verify your Supabase project is active and accessible
   - Check that the database tables were created correctly

4. **Port Conflicts**
   - The application runs on port 5000 by default
   - Change in server.js if needed

5. **Google Button Not Working**
   - Check browser console for JavaScript errors
   - Ensure Supabase credentials are correctly configured
   - Verify the Supabase JavaScript SDK is loaded

## File Structure

```
STUDENT_FORM/
├── .env.example              # Example environment configuration
├── README.md                 # Project documentation
├── faculty.html              # Faculty dashboard
├── faculty.js                # Faculty dashboard JavaScript
├── index.html                # Main HTML file
├── login.html                # Login page
├── login.js                  # Login page JavaScript
├── package.json              # Backend dependencies
├── server.js                 # Backend server (Node.js/Express)
├── start.bat                 # Windows startup script
├── student.html              # Student dashboard
├── student.js                # Student dashboard JavaScript
├── styles.css                # All CSS styles
├── auth/callback.html        # Google authentication callback
├── complete-profile.html     # Profile completion page
├── COMPLETE_SETUP_GUIDE.md   # Comprehensive setup guide
├── IMPLEMENTATION_SUMMARY.md # Implementation details
├── SETUP_AND_RUN.md          # This file
├── SETUP_INSTRUCTIONS.md     # Additional setup instructions
├── SUPABASE_SETUP_CLEAN.md   # Supabase setup guide
└── GOOGLE_AUTH_SETUP.md      # Google authentication setup guide
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive credentials to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately in your Supabase project
4. **Rate Limiting**: The application includes rate limiting for API requests

## Next Steps

1. Customize the user registration flow if needed
2. Add additional profile information collection
3. Implement role-based access controls
4. Add email verification for Google users
5. Set up password reset functionality for email/password users