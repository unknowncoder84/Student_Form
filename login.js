// Login page functionality
let currentUser = null;
let supabase = null;

// Initialize Supabase client
function initSupabase() {
    // These values should be set as environment variables in production
    const SUPABASE_URL = 'https://vxrwtsmbrmzujxaezwqq.supabase.co'; // Your Supabase URL
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnd0c21icm16dWp4YWV6d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDE3MzIsImV4cCI6MjA3MzIxNzczMn0.YSqexS5h4cxNAulIeVPZUHhK34eTfO8_0hbNY8HzLXI'; // Your Supabase anon key
    
    try {
        // Validate URL format
        if (!SUPABASE_URL.startsWith('https://')) {
            console.error('❌ Invalid Supabase URL format. Must start with "https://"');
            return false;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return false;
    }
}

// DOM elements
const studentSection = document.getElementById('studentSection');
const facultySection = document.getElementById('facultySection');
const studentBack = document.getElementById('studentBack');
const facultyBack = document.getElementById('facultyBack');
const demoCredentials = document.getElementById('demoCredentials');
const notification = document.getElementById('notification');

// Initialize login sections
function setupLoginSections() {
    // Show student section by default
    activateSection('student');
    
    // Add click handlers for section switching
    studentSection.addEventListener('click', (e) => {
        // Only activate if clicking on the section itself, not on form elements
        if (e.target === studentSection || e.target.closest('.section-header')) {
            activateSection('student');
        }
    });
    
    facultySection.addEventListener('click', (e) => {
        // Only activate if clicking on the section itself, not on form elements
        if (e.target === facultySection || e.target.closest('.section-header')) {
            activateSection('faculty');
        }
    });
    
    // Add Google login button handlers
    document.getElementById('studentGoogleLoginBtn')?.addEventListener('click', () => handleGoogleLogin('student'));
    document.getElementById('facultyGoogleLoginBtn')?.addEventListener('click', () => handleGoogleLogin('faculty'));
}

function activateSection(type) {
    const studentForm = document.getElementById('studentLoginForm');
    const facultyForm = document.getElementById('facultyLoginForm');

    if (type === 'student') {
        // Section visual states
        studentSection.classList.add('active');
        studentSection.classList.remove('inactive');
        facultySection.classList.remove('active');
        facultySection.classList.add('inactive');

        // Back buttons
        studentBack.style.display = 'block';
        facultyBack.style.display = 'none';

        // Show/hide forms
        studentForm.classList.add('active');
        facultyForm.classList.remove('active');

        // Focus on student form
        const studentUsername = document.getElementById('studentUsername');
        if (studentUsername) studentUsername.focus();
    } else {
        // Section visual states
        facultySection.classList.add('active');
        facultySection.classList.remove('inactive');
        studentSection.classList.remove('active');
        studentSection.classList.add('inactive');

        // Back buttons
        facultyBack.style.display = 'block';
        studentBack.style.display = 'none';

        // Show/hide forms
        facultyForm.classList.add('active');
        studentForm.classList.remove('active');

        // Focus on faculty form
        const facultyUsername = document.getElementById('facultyUsername');
        if (facultyUsername) facultyUsername.focus();
    }
}

function resetSections() {
    studentSection.classList.remove('active');
    facultySection.classList.remove('active');
    studentSection.classList.remove('inactive');
    facultySection.classList.remove('inactive');
    studentBack.style.display = 'none';
    facultyBack.style.display = 'none';
    
    // Clear forms
    document.getElementById('studentLoginForm').reset();
    document.getElementById('facultyLoginForm').reset();
    
    // Hide forms
    document.getElementById('studentLoginForm').classList.remove('active');
    document.getElementById('facultyLoginForm').classList.remove('active');
    
    // Clear any error messages
    showNotification('', 'info');
}

// Demo credentials functionality
function useDemoCredentials(type, username, password) {
    if (type === 'student') {
        document.getElementById('studentUsername').value = username;
        document.getElementById('studentPassword').value = password;
        activateSection('student');
    } else {
        document.getElementById('facultyUsername').value = username;
        document.getElementById('facultyPassword').value = password;
        activateSection('faculty');
    }
    
    // Show success message
    showNotification(`Demo credentials loaded for ${type}`, 'success');
}

function toggleDemoPanel() {
    demoCredentials.classList.toggle('show');
}

// Google Login Handler
async function handleGoogleLogin(role) {
    if (!supabase) {
        showNotification('Google authentication not properly configured. Please contact administrator.', 'error');
        console.log('💡 Check browser console for Supabase initialization errors.');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback.html'
            }
        });
        
        if (error) {
            console.error('Google login error:', error);
            showNotification('Google login failed: ' + error.message, 'error');
            console.log('💡 Check DEPLOYMENT_GUIDE.md for Google auth setup instructions.');
            return;
        }
        
        // The redirect will handle the rest of the flow
    } catch (error) {
        console.error('Google login error:', error);
        showNotification('Google login failed. Please try again.', 'error');
        console.log('💡 Check DEPLOYMENT_GUIDE.md for troubleshooting steps.');
    }
}

// Create or update user in our database
async function createOrUpdateUser(googleUser, role) {
    if (!supabase) return;
    
    try {
        // Check if user already exists
        const { data: existingUsers, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('provider_id', googleUser.id)
            .eq('provider', 'google')
            .limit(1);
        
        if (fetchError) {
            console.error('Error checking existing user:', fetchError);
            return;
        }
        
        if (existingUsers.length > 0) {
            // Update existing user
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    email: googleUser.email,
                    name: googleUser.user_metadata?.full_name || googleUser.email,
                    updated_at: new Date()
                })
                .eq('provider_id', googleUser.id);
            
            if (updateError) {
                console.error('Error updating user:', updateError);
            }
            return existingUsers[0];
        } else {
            // Create new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username: googleUser.email,
                        email: googleUser.email,
                        name: googleUser.user_metadata?.full_name || googleUser.email,
                        role: role,
                        provider: 'google',
                        provider_id: googleUser.id,
                        created_at: new Date()
                    }
                ])
                .select();
            
            if (insertError) {
                console.error('Error creating user:', insertError);
                return null;
            }
            
            // If this is the first time, we need to collect additional information
            if (newUser && newUser.length > 0) {
                // Redirect to profile completion page
                localStorage.setItem('pending_user_id', newUser[0].id);
                localStorage.setItem('pending_user_role', role);
                window.location.href = 'complete-profile.html';
                return newUser[0];
            }
        }
    } catch (error) {
        console.error('Error creating/updating user:', error);
    }
    return null;
}

// Login form handlers
document.getElementById('studentLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin('student');
});

document.getElementById('facultyLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin('faculty');
});

async function handleLogin(type) {
    const username = document.getElementById(`${type}Username`).value.trim();
    const password = document.getElementById(`${type}Password`).value;

    // Basic validation
    if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const loginBtn = document.getElementById(`${type}LoginBtn`);
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username, 
                password, 
                role: type 
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;

            showNotification(`Welcome ${data.user.username}! Redirecting...`, 'success');

            // Redirect to appropriate dashboard after a short delay
            setTimeout(() => {
                if (type === 'student') {
                    window.location.href = 'student.html';
                } else {
                    window.location.href = 'faculty.html';
                }
            }, 1500);
        } else {
            showNotification(data.error || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('Cannot connect to server. Please make sure the server is running.', 'error');
        } else {
            showNotification('Network error. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Notification system
function showNotification(message, type = 'info') {
    if (!message) {
        notification.style.display = 'none';
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds for success/info, 8 seconds for errors
    const hideDelay = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        notification.style.display = 'none';
    }, hideDelay);
}

// Initialize login page
document.addEventListener('DOMContentLoaded', () => {
    setupLoginSections();
    
    // Initialize Supabase
    initSupabase();
    
    // Ensure default state shows student form
    document.getElementById('studentLoginForm').classList.add('active');
    document.getElementById('facultyLoginForm').classList.remove('active');
    facultySection.classList.add('inactive');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            // Redirect to appropriate dashboard
            if (currentUser.role === 'student') {
                window.location.href = 'student.html';
            } else if (currentUser.role === 'faculty') {
                window.location.href = 'faculty.html';
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resetSections();
        }
    });
});