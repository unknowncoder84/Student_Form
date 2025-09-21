# Supabase Deployment Guide

## Supabase Configuration for Production

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/)
2. Sign up or log in to your account
3. Create a new project
4. Wait for the project to initialize (this may take a few minutes)

### Step 2: Configure Google Authentication
1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Click on **Google**
3. Toggle **Enabled** to ON
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google client ID
   - **Client Secret**: Your Google client secret
5. Save the configuration

### Step 3: Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL queries:

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

-- Disable RLS for development (remove this in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses DISABLE ROW LEVEL SECURITY;
```

### Step 4: Set Up Environment Variables
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** and **anon public API key**
3. In your application's `.env` file, set the following variables:
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_KEY=your_anon_key
   JWT_SECRET=a_secure_random_string
   ```

### Step 5: Configure Google OAuth (Development)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application** as the application type
6. Add the following authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
7. Click **Create**
8. Save the Client ID and Client Secret

### Step 6: Configure Google OAuth (Production)
1. In your Supabase dashboard, go to **Authentication** → **Providers** → **Google**
2. Enter the Google Client ID and Client Secret from the Google Cloud Console
3. Save the configuration

### Step 7: Set Up Netlify Deployment
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Initialize Netlify project: `netlify init`
4. When prompted, select:
   - Create & configure a new site
   - Choose your team
   - Set the publish directory to `/`
   - Leave the build command empty
5. Set environment variables in Netlify:
   ```bash
   netlify env:set SUPABASE_URL your_supabase_project_url
   netlify env:set SUPABASE_KEY your_supabase_anon_key
   netlify env:set JWT_SECRET your_jwt_secret_key
   ```
6. Deploy to Netlify: `netlify deploy --prod`

### Step 8: Enable Row Level Security (RLS) for Production
1. In your Supabase dashboard, go to **Table editor**
2. For each table (users, questions, student_responses):
   - Click on the table
   - Go to the **Security** tab
   - Enable Row Level Security
   - Create appropriate policies for secure access

### Step 9: Monitor and Maintain
1. Check the Supabase logs regularly for any authentication issues
2. Monitor database usage and performance
3. Set up proper backups
4. Rotate credentials periodically

### Troubleshooting

#### Common Issues

1. **Google Authentication Not Working**
   - Check that the redirect URI is correctly set in Google Cloud Console
   - Verify the Google Client ID and Secret are correctly configured in Supabase
   - Check browser console for JavaScript errors

2. **User Not Created in Database**
   - Check Supabase logs for database errors
   - Verify the database schema matches the expected structure
   - Ensure RLS is disabled for development

3. **Profile Completion Not Working**
   - Verify localStorage contains `pending_user_id` and `pending_user_role`
   - Check that the users table has the required fields
   - Ensure RLS is properly configured

4. **Database Connection Errors**
   - Check that Supabase URL and Key are correctly set
   - Verify database tables exist
   - Check RLS configuration
   - Ensure database user has proper permissions

### Security Considerations

1. **Environment Variables**: Never commit sensitive credentials to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately in your Supabase project
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **RLS Policies**: Set up proper Row Level Security policies for production
6. **Secret Management**: Use secure methods to manage secrets in production