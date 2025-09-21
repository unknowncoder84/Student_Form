const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

let supabase = null;

// Check if Supabase credentials are properly configured
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_KEY') {
    console.error('❌ Supabase credentials not configured!');
    console.error('Please set the SUPABASE_URL and SUPABASE_KEY environment variables.');
    console.error('Refer to SETUP_AND_RUN.md for detailed instructions.');
    console.error('The application will start but Supabase functionality will not work.');
} else {
    // Create Supabase client only if credentials are provided
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error.message);
    }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize database with demo data
async function initializeDatabase() {
  // Skip database initialization if Supabase is not configured
  if (!supabase) {
    console.log('⚠️ Skipping database initialization - Supabase not configured');
    return;
  }
  
  try {
    // Check if tables exist by attempting to query them
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const { error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    const { error: responsesError } = await supabase
      .from('student_responses')
      .select('id')
      .limit(1);

    // If any table doesn't exist, we need to create all tables
    if (usersError || questionsError || responsesError) {
      console.log('⚠️ Some tables may not exist. Please ensure you have created the required tables in Supabase:');
      console.log('- users');
      console.log('- questions');
      console.log('- student_responses');
      console.log('\nRun the following SQL in your Supabase SQL editor:');
      console.log(`
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
ALTER TABLE student_responses DISABLE ROW LEVEL SECURITY;`);
    }

    // Insert demo users if they don't exist
    const demoUsers = [
      { 
        username: 'student1', 
        password: 'student123', 
        role: 'student',
        email: 'student1@example.com',
        name: 'Student One',
        student_id: 'STU001'
      },
      { 
        username: 'faculty1', 
        password: 'faculty123', 
        role: 'faculty',
        email: 'faculty1@example.com',
        name: 'Faculty One',
        department: 'Computer Science',
        teacher_id: 'TEA001'
      }
    ];

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('username', user.username)
          .eq('role', user.role)
          .limit(1);

        if (fetchError) {
          console.error('Error checking existing user:', fetchError);
          // Check if it's an RLS error
          if (fetchError.code === '42501') {
            console.error('💡 This might be due to Row Level Security (RLS). See DEPLOYMENT_GUIDE.md for solutions.');
          }
          continue;
        }

        if (existingUsers.length === 0) {
          // Hash password only for email/password users
          let hashedPassword = null;
          if (user.password) {
            hashedPassword = await bcrypt.hash(user.password, 10);
          }
          
          const userData = {
            username: user.username,
            password: hashedPassword,
            role: user.role,
            email: user.email,
            name: user.name,
            student_id: user.student_id,
            department: user.department,
            teacher_id: user.teacher_id,
            provider: null, // null for email/password users
            provider_id: null,
            created_at: new Date()
          };
          
          const { data, error } = await supabase
            .from('users')
            .insert([userData]);

          if (error) {
            console.error('Error creating user:', error);
            // Check if it's an RLS error
            if (error.code === '42501') {
              console.error('💡 This might be due to Row Level Security (RLS). See DEPLOYMENT_GUIDE.md for solutions.');
            }
          } else {
            console.log(`Created demo user: ${user.username}`);
          }
        }
      } catch (error) {
        console.error(`Unexpected error creating user ${user.username}:`, error);
      }
    }

    // Check if questions already exist
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting questions:', countError);
      // Check if it's an RLS error
      if (countError.code === '42501') {
        console.error('💡 This might be due to Row Level Security (RLS). See DEPLOYMENT_GUIDE.md for solutions.');
      }
      return;
    }

    if (count === 0) {
      console.log('Questions table is empty, inserting new questions...');
      
      // New updated questions list in exact sequence
      const questions = [
        { text: 'Name', type: 'text', parent: null, order: 1 },
        { text: 'Class', type: 'select', parent: null, order: 2 },
        { text: 'Gender', type: 'select', parent: null, order: 3 },
        { text: 'Enrolled for DLLE?', type: 'yesno', parent: null, order: 4 },
        { text: 'Enrolled for NSS?', type: 'yesno', parent: null, order: 5 },
        { text: 'Enrolled for any NPTEL course?', type: 'yesno', parent: null, order: 6 },
        { text: 'If yes, name of the course', type: 'text', parent: 6, order: 7 },
        { text: 'Enrolled in any certificate course at present?', type: 'yesno', parent: null, order: 8 },
        { text: 'If yes, name of the certificate course', type: 'text', parent: 8, order: 9 },
        { text: 'Grade in latest seriester, in case of Fy students, HSC percentage', type: 'text', parent: null, order: 10 },
        { text: 'Occupation of parents - Business/Government Job/Private Job', type: 'select', parent: null, order: 11 },
        { text: 'In case of Job, name of the company or entity or department', type: 'text', parent: 11, order: 12 },
        { text: 'Sports enthusiast?', type: 'yesno', parent: null, order: 13 },
        { text: 'If yes, name of the sport/s', type: 'text', parent: 13, order: 14 },
        { text: 'Whether training or coaching for any sport?', type: 'yesno', parent: null, order: 15 },
        { text: 'Whether played for any sport at district, zonal, state, national level?', type: 'yesno', parent: null, order: 16 },
        { text: 'Ever been involved in cultural events like dancing, singing, drawing, painting, yoga, drama, etc', type: 'yesno', parent: null, order: 17 },
        { text: 'If yes, name of the activity', type: 'text', parent: 17, order: 18 },
        { text: 'Whether training or coaching for any cultural event?', type: 'yesno', parent: null, order: 19 },
        { text: 'Whether performed at district, zonal, state, national level?', type: 'yesno', parent: null, order: 20 },
        { text: 'Ever been involved in literary events like PPT competition, Debate, Essay writing, Quiz, etc', type: 'yesno', parent: null, order: 21 },
        { text: 'If yes, name of the event', type: 'text', parent: 21, order: 22 },
        { text: 'Do you know the following', type: 'header', parent: null, order: 23 },
        { text: 'Advance Excel', type: 'yesno', parent: null, order: 24 },
        { text: 'MS Word', type: 'yesno', parent: null, order: 25 },
        { text: 'Tally Prime', type: 'yesno', parent: null, order: 26 },
        { text: 'PPT', type: 'yesno', parent: null, order: 27 },
        { text: 'AI', type: 'yesno', parent: null, order: 28 },
        { text: 'Programming', type: 'yesno', parent: null, order: 29 },
        { text: 'Coding', type: 'yesno', parent: null, order: 30 },
        { text: 'Participated in any Intra collegiate competition?', type: 'yesno', parent: null, order: 31 },
        { text: 'If yes, name of the competition', type: 'text', parent: 31, order: 32 },
        { text: 'Participated in Inter collegiate event?', type: 'yesno', parent: null, order: 33 },
        { text: 'If yes, name of the college event and the competition', type: 'text', parent: 33, order: 34 },
        { text: 'Address of Residence?', type: 'textarea', parent: null, order: 35 },
        { text: 'Are you working part time or full time or doing internship?', type: 'yesno', parent: null, order: 36 },
        { text: 'If yes, name of the company or entity or firm', type: 'text', parent: 36, order: 37 },
        { text: 'Any suggestions/recommendations for overall college development', type: 'textarea', parent: null, order: 38 }
      ];

      // Insert questions sequentially
      const insertedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        try {
          const question = questions[i];
          // Find the parent question in the insertedQuestions array
          let parentQuestion = null;
          if (question.parent) {
            // Find the parent by matching the order number
            parentQuestion = insertedQuestions.find(q => q.order === question.parent);
          }
          
          const questionData = {
            question_text: question.text,
            question_type: question.type,
            parent_question_id: parentQuestion ? parentQuestion.id : null,
            is_locked: false,
            order_index: question.order,
            auto_unlock_date: null,
            created_at: new Date()
          };
          
          const { data, error } = await supabase
            .from('questions')
            .insert([questionData])
            .select();

          if (error) {
            console.error(`Error inserting question ${question.order}:`, error);
            // Check if it's an RLS error
            if (error.code === '42501') {
              console.error('💡 This might be due to Row Level Security (RLS). See DEPLOYMENT_GUIDE.md for solutions.');
            }
          } else {
            insertedQuestions.push({
              id: data[0].id,
              order: question.order
            });
            console.log(`Question ${question.order} inserted: ${question.text}`);
          }
        } catch (error) {
          console.error(`Unexpected error inserting question ${questions[i].order}:`, error);
        }
      }
      
      console.log('All questions insertion attempt completed!');
    } else {
      console.log(`Found ${count} existing questions in database`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('💡 Check DEPLOYMENT_GUIDE.md for solutions to common issues.');
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
    const { username, password, role, provider, provider_id, student_id, department, teacher_id } = req.body;

    // Handle Google authentication
    if (provider === 'google' && provider_id) {
        try {
            // Check if user exists with Google provider
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('provider_id', provider_id)
                .eq('provider', 'google')
                .eq('role', role)
                .limit(1);

            if (error) {
                console.error('Google login error:', error);
                return res.status(500).json({ error: 'Authentication error' });
            }

            if (users.length === 0) {
                return res.status(401).json({ error: 'Google user not found. Please sign up first.' });
            }

            const user = users[0];
            
            // Check if this is a newly registered Google user who needs to complete their profile
            if ((!user.student_id && role === 'student') || 
                (!user.department && role === 'faculty') || 
                (!user.teacher_id && role === 'faculty')) {
                return res.status(400).json({ 
                    error: 'Please complete your profile', 
                    needs_profile_completion: true,
                    user_id: user.id
                });
            }

            const token = jwt.sign({ 
                id: user.id.toString(), 
                username: user.username, 
                role: user.role,
                provider: user.provider
            }, JWT_SECRET, { expiresIn: '24h' });
            
            res.json({ 
                token, 
                user: { 
                    id: user.id.toString(), 
                    username: user.username, 
                    role: user.role,
                    email: user.email,
                    name: user.name,
                    student_id: user.student_id,
                    department: user.department,
                    teacher_id: user.teacher_id
                },
                message: `Welcome ${user.name || user.username}!`
            });
        } catch (error) {
            console.error('Google login error:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    } else {
        // Handle traditional username/password authentication
        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        // Validate role
        if (!['student', 'faculty'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be student or faculty' });
        }

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('role', role)
                .limit(1);

            if (error) {
                console.error('Login error:', error);
                return res.status(500).json({ error: 'Authentication error' });
            }

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials or role mismatch' });
            }

            const user = users[0];
            // Check if this is a Google user (should not have a password)
            if (!user.password) {
                return res.status(401).json({ error: 'This account uses Google authentication. Please sign in with Google.' });
            }
            
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ 
                id: user.id.toString(), 
                username: user.username, 
                role: user.role 
            }, JWT_SECRET, { expiresIn: '24h' });
            
            res.json({ 
                token, 
                user: { 
                    id: user.id.toString(), 
                    username: user.username, 
                    role: user.role,
                    email: user.email,
                    name: user.name,
                    student_id: user.student_id,
                    department: user.department,
                    teacher_id: user.teacher_id
                },
                message: `Welcome ${user.name || user.username}!`
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    }
});

// Get questions for student dashboard
app.get('/api/questions/student', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_locked', false)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching student questions:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      ...q,
      id: q.id.toString(),
      parent_question_id: q.parent_question_id ? q.parent_question_id.toString() : null
    }));

    res.json(formattedQuestions);
  } catch (error) {
    console.error('Error fetching student questions:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get all questions for faculty dashboard
app.get('/api/questions/faculty', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching faculty questions:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      ...q,
      id: q.id.toString(),
      parent_question_id: q.parent_question_id ? q.parent_question_id.toString() : null
    }));

    res.json(formattedQuestions);
  } catch (error) {
    console.error('Error fetching faculty questions:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Toggle question lock status
app.post('/api/questions/toggle-lock', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { question_id } = req.body;
  
  try {
    // Get current question
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching question:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const question = questions[0];
    
    // Update question lock status
    const { error: updateError } = await supabase
      .from('questions')
      .update({ is_locked: !question.is_locked })
      .eq('id', question_id);

    if (updateError) {
      console.error('Error toggling question lock:', updateError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ message: 'Question lock status updated' });
  } catch (error) {
    console.error('Error toggling question lock:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Schedule auto-unlock for a question
app.post('/api/questions/schedule-unlock', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { question_id, unlock_date } = req.body;
  
  try {
    const { error } = await supabase
      .from('questions')
      .update({ auto_unlock_date: new Date(unlock_date) })
      .eq('id', question_id);
    
    if (error) {
      console.error('Error scheduling auto-unlock:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ message: 'Auto-unlock scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling auto-unlock:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Clear auto-unlock schedule for a question
app.post('/api/questions/clear-schedule', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { question_id } = req.body;
  
  try {
    const { error } = await supabase
      .from('questions')
      .update({ auto_unlock_date: null })
      .eq('id', question_id);
    
    if (error) {
      console.error('Error clearing auto-unlock schedule:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ message: 'Auto-unlock schedule cleared' });
  } catch (error) {
    console.error('Error clearing auto-unlock schedule:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Check and process auto-unlock questions
app.post('/api/questions/check-auto-unlock', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const now = new Date();
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .lte('auto_unlock_date', now)
      .eq('is_locked', true);

    if (error) {
      console.error('Error checking auto-unlock:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    let unlockedCount = 0;
    for (const question of questions) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ 
          is_locked: false,
          auto_unlock_date: null
        })
        .eq('id', question.id);
      
      if (!updateError) {
        unlockedCount++;
      }
    }
    
    res.json({ message: 'Auto-unlock check completed', unlocked_count: unlockedCount });
  } catch (error) {
    console.error('Error checking auto-unlock:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Submit student responses
app.post('/api/responses', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { student_id, responses } = req.body;
  
  try {
    // Process multiple responses
    const responseEntries = Object.entries(responses);
    
    for (const [questionId, response] of responseEntries) {
      // Check if response already exists
      const { data: existingResponses, error: fetchError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('student_id', student_id)
        .eq('question_id', questionId)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing response:', fetchError);
        continue;
      }

      if (existingResponses.length > 0) {
        // Update existing response
        const { error: updateError } = await supabase
          .from('student_responses')
          .update({
            response: response,
            updated_at: new Date()
          })
          .eq('student_id', student_id)
          .eq('question_id', questionId);

        if (updateError) {
          console.error('Error updating response:', updateError);
        }
      } else {
        // Insert new response
        const { error: insertError } = await supabase
          .from('student_responses')
          .insert([
            {
              student_id: student_id,
              question_id: questionId,
              response: response,
              updated_at: new Date()
            }
          ]);

        if (insertError) {
          console.error('Error inserting response:', insertError);
        }
      }
    }
    
    res.json({ message: 'Responses saved successfully' });
  } catch (error) {
    console.error('Error saving responses:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Search students (faculty only)
app.get('/api/search', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { q } = req.query;
  
  try {
    // First, find students by username
    const { data: studentsByUsername, error: usernameError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .ilike('username', `%${q}%`);

    if (usernameError) {
      console.error('Error searching students by username:', usernameError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Find the question IDs for name and class
    const { data: nameQuestions, error: nameQuestionError } = await supabase
      .from('questions')
      .select('*')
      .eq('question_text', 'Name')
      .limit(1);

    if (nameQuestionError) {
      console.error('Error fetching name question:', nameQuestionError);
      return res.status(500).json({ error: 'Database error' });
    }

    const { data: classQuestions, error: classQuestionError } = await supabase
      .from('questions')
      .select('*')
      .eq('question_text', 'Class')
      .limit(1);

    if (classQuestionError) {
      console.error('Error fetching class question:', classQuestionError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (nameQuestions.length === 0 || classQuestions.length === 0) {
      return res.status(500).json({ error: 'Required questions not found in database' });
    }
    
    const nameQuestionId = nameQuestions[0].id;
    const classQuestionId = classQuestions[0].id;
    
    // Then, find students by name in responses
    const { data: nameResponses, error: nameResponseError } = await supabase
      .from('student_responses')
      .select('*')
      .eq('question_id', nameQuestionId)
      .ilike('response', `%${q}%`);

    if (nameResponseError) {
      console.error('Error searching students by name:', nameResponseError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get unique student IDs
    const studentIds = [
      ...studentsByUsername.map(s => s.id.toString()),
      ...nameResponses.map(r => r.student_id.toString())
    ];
    
    // Get unique students
    const uniqueStudentIds = [...new Set(studentIds)];
    
    // Get student details
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .in('id', uniqueStudentIds)
      .eq('role', 'student');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Add name and class information
    const studentsWithDetails = [];
    for (const student of students) {
      // Get name from responses
      const { data: nameResponses, error: nameError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('student_id', student.id)
        .eq('question_id', nameQuestionId)
        .limit(1);

      // Get class from responses
      const { data: classResponses, error: classError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('student_id', student.id)
        .eq('question_id', classQuestionId)
        .limit(1);
      
      studentsWithDetails.push({
        id: student.id.toString(),
        username: student.username,
        name: nameResponses.length > 0 ? nameResponses[0].response : null,
        class: classResponses.length > 0 ? classResponses[0].response : null
      });
    }
    
    res.json(studentsWithDetails);
  } catch (error) {
    console.error('Error searching students:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get students by class (faculty only)
app.get('/api/students/by-class', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { class: className } = req.query;
  if (!className) {
    return res.status(400).json({ error: 'Missing class parameter' });
  }

  try {
    // Find the question ID for class
    const { data: classQuestions, error: classQuestionError } = await supabase
      .from('questions')
      .select('*')
      .eq('question_text', 'Class')
      .limit(1);

    if (classQuestionError) {
      console.error('Error fetching class question:', classQuestionError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (classQuestions.length === 0) {
      return res.status(500).json({ error: 'Class question not found in database' });
    }
    
    const classQuestionId = classQuestions[0].id;
    
    // Find students by class in responses
    const { data: classResponses, error: classResponseError } = await supabase
      .from('student_responses')
      .select('*')
      .eq('question_id', classQuestionId)
      .eq('response', className);

    if (classResponseError) {
      console.error('Error fetching class responses:', classResponseError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get unique student IDs
    const studentIds = classResponses.map(r => r.student_id.toString());
    
    // Get student details
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .in('id', studentIds)
      .eq('role', 'student');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Add name and class information
    const studentsWithDetails = [];
    for (const student of students) {
      // Get name from responses
      const { data: nameQuestions, error: nameQuestionError } = await supabase
        .from('questions')
        .select('*')
        .eq('question_text', 'Name')
        .limit(1);

      if (nameQuestionError) {
        studentsWithDetails.push({
          id: student.id.toString(),
          username: student.username,
          name: null,
          class: className
        });
        continue;
      }

      if (nameQuestions.length === 0) {
        studentsWithDetails.push({
          id: student.id.toString(),
          username: student.username,
          name: null,
          class: className
        });
        continue;
      }
      
      const nameQuestionId = nameQuestions[0].id;
      
      const { data: nameResponses, error: nameResponseError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('student_id', student.id)
        .eq('question_id', nameQuestionId)
        .limit(1);

      if (nameResponseError) {
        studentsWithDetails.push({
          id: student.id.toString(),
          username: student.username,
          name: null,
          class: className
        });
        continue;
      }
      
      studentsWithDetails.push({
        id: student.id.toString(),
        username: student.username,
        name: nameResponses.length > 0 ? nameResponses[0].response : null,
        class: className
      });
    }
    
    res.json(studentsWithDetails);
  } catch (error) {
    console.error('Error getting students by class:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get student responses for faculty view
app.get('/api/responses/:studentId', authenticateToken, async (req, res) => {
    // Check if Supabase is configured
    if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable - Database not configured' });
    }
    
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { studentId } = req.params;
  
  try {
    // Get all questions
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get student responses
    const { data: studentResponses, error: responsesError } = await supabase
      .from('student_responses')
      .select('*')
      .eq('student_id', studentId);

    if (responsesError) {
      console.error('Error fetching student responses:', responsesError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Create a map of question ID to response
    const responseMap = {};
    studentResponses.forEach(response => {
      responseMap[response.question_id.toString()] = response.response;
    });
    
    // Format responses for frontend
    const formattedResponses = {};
    allQuestions.forEach(question => {
      const questionId = question.id.toString();
      if (responseMap[questionId]) {
        formattedResponses[questionId] = responseMap[questionId];
      }
    });
    
    res.json(formattedResponses);
  } catch (error) {
    console.error('Error getting student responses:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Demo Credentials:');
    console.log('Student: username: student1, password: student123');
    console.log('Faculty: username: faculty1, password: faculty123');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is busy. Trying port ${PORT + 1}...`);
      server.listen(PORT + 1);
    } else {
      console.error('Server error:', err);
    }
  });
});