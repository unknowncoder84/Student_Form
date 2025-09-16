# College Form System

A comprehensive college project form system built with **HTML, CSS, and JavaScript** for the frontend and **Node.js/Express** for the backend. The system provides separate dashboards for students and faculty members with role-based access control.

> **Note**: This project uses Supabase as its backend database instead of MongoDB.

## ✨ Features

### 🔐 Authentication System
- **Single Login Page**: Unified login interface for both students and faculty
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Automatic redirection based on user role
- **Session Persistence**: Remembers login state across browser sessions
- **Google Authentication**: Sign in with Google for both students and faculty
- **Profile Completion**: Collect additional information for Google users

### 🎓 Student Dashboard
- **Dynamic Form Rendering**: Automatically loads all available questions
- **Conditional Questions**: Sub-questions appear based on "Yes/No" responses
- **Real-time Updates**: Form updates as you type
- **Response Saving**: Save responses to the database
- **Locked Question Handling**: Visual indicators for locked questions

### 👨‍🏫 Faculty Dashboard
- **Question Management**: Lock/unlock questions with one click
- **Student Search**: Search for students by name or username
- **Response Viewer**: View detailed student responses
- **AI Assistant Section**: Placeholder for future AI features

### 🎨 User Interface
- **Pink Gradient Theme**: Beautiful pink gradient effects throughout
- **Glassmorphism Design**: Modern see-through glass-like interface
- **Responsive Layout**: Works perfectly on all device sizes
- **Smooth Animations**: Elegant transitions and hover effects
- **Professional Design**: Clean, modern, and attractive interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account (free tier available at [supabase.com](https://supabase.com/))
- Google Cloud Platform account (for Google authentication)

### Installation

1. **Clone or download the project**
   ```bash
   # Navigate to the project directory
   cd STUDENT_FORM
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a free account at [supabase.com](https://supabase.com/)
   - Create a new project
   - Get your project URL and API key from the project settings
   - Follow the detailed setup instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

4. **Enable Google Authentication**
   - Set up Google OAuth credentials in the Google Cloud Console
   - Configure Google authentication in your Supabase project
   - Follow the detailed setup instructions in [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)

5. **Configure Supabase Environment Variables**
   - Set the `SUPABASE_URL` environment variable to your Supabase project URL
   - Set the `SUPABASE_KEY` environment variable to your Supabase API key (use the service role key for server-side operations)
   - Set the `JWT_SECRET` environment variable for JWT token signing (can be any secure string for development)
   
   **Windows (Command Prompt)**:
   ```cmd
   set SUPABASE_URL=https://your-project.supabase.co
   set SUPABASE_KEY=your-service-role-key
   set JWT_SECRET=your-jwt-secret-key
   ```
   
   **Windows (PowerShell)**:
   ```powershell
   $env:SUPABASE_URL="https://your-project.supabase.co"
   $env:SUPABASE_KEY="your-service-role-key"
   $env:JWT_SECRET="your-jwt-secret-key"
   ```
   
   **macOS/Linux**:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-service-role-key"
   export JWT_SECRET="your-jwt-secret-key"
   ```

6. **Set Environment Variables (Windows)**
   ```cmd
   set SUPABASE_URL=your_supabase_project_url
   set SUPABASE_KEY=your_supabase_service_role_key
   set JWT_SECRET=your_jwt_secret
   ```
   
   **macOS/Linux**:
   ```bash
   export SUPABASE_URL=your_supabase_project_url
   export SUPABASE_KEY=your_supabase_service_role_key
   export JWT_SECRET=your_jwt_secret
   ```

7. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

8. **Open the application**
   - Open `index.html` in your web browser
   - Or serve it using a local server (recommended)

### Demo Credentials

#### Student Login
- **Username**: `student1`
- **Password**: `student123`

#### Faculty Login
- **Username**: `faculty1`
- **Password**: `faculty123`

#### Google Authentication
- Click "Sign in with Google" on either the student or faculty login section
- Complete your profile with additional information:
  - **Students**: Enter your Student ID
  - **Faculty**: Enter your Department and Teacher ID

## 🏗️ Project Structure

```
STUDENT_FORM/
├── README.md                      # This file
├── faculty.html                   # Faculty dashboard
├── faculty.js                     # Faculty dashboard JavaScript
├── index.html                     # Main HTML file
├── login.html                     # Login page
├── login.js                       # Login page JavaScript
├── package.json                   # Backend dependencies
├── server.js                      # Backend server (Node.js/Express)
├── start.bat                      # Windows startup script
├── student.html                   # Student dashboard
├── student.js                     # Student dashboard JavaScript
└── styles.css                     # All CSS styles
```

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart
- `npm run build` - Build the project (if needed)

## 📋 Form Questions

The system includes 38 comprehensive questions covering:

### Personal Information
1. Name
2. Class
3. Gender
4. Enrolled for DLLE?
5. Enrolled for NSS?
6. Enrolled for any NPTEL course?
7. If yes, name of the course
8. Enrolled in any certificate course at present?
9. If yes, name of the certificate course
10. Grade in latest seriester, in case of Fy students, HSC percentage
11. Occupation of parents - Business/Government Job/Private Job
12. In case of Job, name of the company or entity or department
13. Sports enthusiast?
14. If yes, name of the sport/s
15. Whether training or coaching for any sport?
16. Whether played for any sport at district, zonal, state, national level?
17. Ever been involved in cultural events like dancing, singing, drawing, painting, yoga, drama, etc
18. If yes, name of the activity
19. Whether training or coaching for any cultural event?
20. Whether performed at district, zonal, state, national level?
21. Ever been involved in literary events like PPT competition, Debate, Essay writing, Quiz, etc
22. If yes, name of the event
23. Do you know the following (Header)
24. Advance Excel
25. MS Word
26. Tally Prime
27. PPT
28. AI
29. Programming
30. Coding
31. Participated in any Intra collegiate competition?
32. If yes, name of the competition
33. Participated in Inter collegiate event?
34. If yes, name of the college event and the competition
35. Address of Residence?
36. Are you working part time or full time or doing internship?
37. If yes, name of the company or entity or firm
38. Any suggestions/recommendations for overall college development

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced styling with gradients, animations, and responsive design
- **Vanilla JavaScript**: Modern ES6+ JavaScript without frameworks
- **Font Awesome**: Icon library for beautiful UI elements

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Supabase**: Backend-as-a-Service for storing user data, questions, and responses
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing for security

### Security Features
- **CORS**: Cross-Origin Resource Sharing configuration
- **Helmet.js**: Security headers and protection
- **Rate Limiting**: API request throttling
- **Input Validation**: Server-side validation
- **Injection Protection**: Safe database queries

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for passwords
- **CORS Protection**: Controlled cross-origin access
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Sanitization**: Protects against malicious input
- **Injection Protection**: Safe database queries with Supabase

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Flexible Layout**: Adapts to all screen sizes
- **Touch Friendly**: Optimized for touch interfaces
- **Cross Browser**: Works on all modern browsers
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🚀 Deployment

### Local Development
1. Start the backend server: `npm start`
2. Open `index.html` in your browser
3. The system will work locally with full functionality

### Production Deployment
1. Deploy `server.js` to your hosting platform
2. Update the API base URL in `student.js` and `faculty.js` if needed
3. Ensure your hosting platform supports Node.js
4. Set up a Supabase project
5. Set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables

## 🔧 Configuration

### Backend Configuration
- **Port**: Default port 5000 (configurable in `server.js`)
- **Database**: Supabase database
- **JWT Secret**: Configure in `server.js` for production

### Frontend Configuration
- **API Base URL**: Set in `student.js` and `faculty.js` (default: `http://localhost:5000/api`)
- **Theme Colors**: Customizable in `styles.css`
- **Animations**: Configurable timing in CSS

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if port 5000 is available
   - Ensure all dependencies are installed
   - Check Node.js version compatibility
   - Verify Supabase connection

2. **Database errors**
   - Ensure Supabase project is set up correctly
   - Check connection string in environment variables
   - Verify database user permissions

3. **Frontend not loading**
   - Check browser console for JavaScript errors
   - Ensure all files are in the correct directory
   - Verify backend server is running

4. **Authentication issues**
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify backend authentication middleware

5. **Google Authentication issues**
   - Ensure Google OAuth credentials are correctly configured
   - Check that the redirect URI is properly set in Google Cloud Console
   - Verify Supabase Google authentication provider is enabled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For support or questions:
- Check the troubleshooting section above
- Review the code comments for implementation details
- Ensure all dependencies are properly installed
- Verify the backend server is running
- Confirm Supabase is accessible

---

**Note**: This system is designed for educational purposes and local development. For production use, consider implementing additional security measures, database optimization, and proper error handling.