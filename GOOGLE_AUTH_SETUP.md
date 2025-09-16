# Google Authentication Setup Guide

This document provides instructions for setting up Google authentication for the College Form System.

## Prerequisites

1. A Supabase project (free tier available at [supabase.com](https://supabase.com/))
2. A Google Cloud Platform account
3. Basic knowledge of environment variables

## Step 1: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application" as the application type
6. Add the following authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
7. Click "Create"
8. Save the Client ID and Client Secret (you'll need them in Step 2)

## Step 2: Configure Google Authentication in Supabase

1. In your Supabase project dashboard, go to "Authentication" → "Providers"
2. Find "Google" and click on it
3. Toggle "Enabled" to ON
4. Enter the Google Client ID and Client Secret from Step 1
5. Save the configuration

## Step 3: Update Environment Variables

You need to update the following environment variables in your application:

### For Development (Local Machine)

#### Windows (Command Prompt)
```cmd
set SUPABASE_URL=your_supabase_project_url
set SUPABASE_KEY=your_supabase_anon_key
set JWT_SECRET=your_jwt_secret_key
```

#### Windows (PowerShell)
```powershell
$env:SUPABASE_URL="your_supabase_project_url"
$env:SUPABASE_KEY="your_supabase_anon_key"
$env:JWT_SECRET="your_jwt_secret_key"
```

#### macOS/Linux
```bash
export SUPABASE_URL=your_supabase_project_url
export SUPABASE_KEY=your_supabase_anon_key
export JWT_SECRET=your_jwt_secret_key
```

### For Production (Hosting Platform)

The method for setting environment variables depends on your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site settings → Build & deploy → Environment
- **Heroku**: Settings → Config Vars
- **Render**: Settings → Environment

## Step 4: Update Database Schema

If you haven't already created the database tables, run the following SQL in your Supabase SQL editor:

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

## Step 5: Configure Application Code

1. Open `login.html` in a text editor
2. Find the Supabase configuration section:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js"></script>
   ```
3. Open `login.js` in a text editor
4. Find the Supabase initialization function:
   ```javascript
   function initSupabase() {
       const SUPABASE_URL = 'YOUR_SUPABASE_URL';
       const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
       
       if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_KEY') {
           console.warn('Supabase credentials not configured. Google authentication will not work.');
           return false;
       }
       
       supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
       return true;
   }
   ```
5. Replace `'YOUR_SUPABASE_URL'` and `'YOUR_SUPABASE_KEY'` with your actual Supabase credentials

## Step 6: Test Google Authentication

1. Start your application:
   ```bash
   npm start
   ```
2. Open your browser and navigate to the login page
3. Click on "Sign in with Google" for either student or faculty login
4. You should be redirected to Google's authentication page
5. After successful authentication, you'll be redirected back to your application

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" Error**
   - Make sure you've added the correct redirect URI in your Google Cloud Console
   - The URI should be: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **"Client authentication failed" Error**
   - Double-check your Google Client ID and Client Secret
   - Ensure they're correctly entered in your Supabase project settings

3. **Google Button Not Working**
   - Check browser console for JavaScript errors
   - Ensure Supabase credentials are correctly configured
   - Verify the Supabase JavaScript SDK is loaded

4. **User Not Created in Database**
   - Check Supabase logs for database errors
   - Ensure the database schema matches the expected structure

### Debugging Tips

1. Open browser developer tools (F12) and check the console for errors
2. Check the Network tab to see if API requests are successful
3. Verify environment variables are set correctly
4. Check Supabase project logs for authentication errors

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