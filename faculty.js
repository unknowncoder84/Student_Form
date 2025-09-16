// Faculty Dashboard functionality
let currentUser = null;
let questions = [];

// DOM elements
const facultyWelcome = document.getElementById('facultyWelcome');
const questionsList = document.getElementById('questionsList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const studentsList = document.getElementById('studentsList');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const facultyLogoutBtn = document.getElementById('facultyLogoutBtn');

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    if (currentUser.role !== 'faculty') {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user's name if available, otherwise username
    const displayName = currentUser.name || currentUser.username;
    facultyWelcome.textContent = `Welcome, ${displayName}!`;
}

// Load faculty questions
async function loadFacultyQuestions() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questions/faculty', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            questions = await response.json();
            renderFacultyQuestions();
        } else {
            console.error('Failed to load questions');
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Render faculty questions
function renderFacultyQuestions() {
    questionsList.innerHTML = '';
    
    questions.forEach(question => {
        const questionElement = createFacultyQuestionElement(question);
        questionsList.appendChild(questionElement);
    });
}

function createFacultyQuestionElement(question) {
    const container = document.createElement('div');
    container.className = 'question-item';
    container.dataset.questionId = question.id;
    
    const questionInfo = document.createElement('div');
    questionInfo.className = 'question-info';
    
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question_text;
    
    const questionMeta = document.createElement('div');
    questionMeta.className = 'question-meta';
    questionMeta.innerHTML = `
        <span class="question-type">${question.question_type.toUpperCase()}</span>
        ${question.auto_unlock_date ? `<span class="auto-unlock-date">Auto-unlock: ${new Date(question.auto_unlock_date).toLocaleDateString()}</span>` : ''}
    `;
    
    questionInfo.appendChild(questionText);
    questionInfo.appendChild(questionMeta);
    
    const controls = document.createElement('div');
    controls.className = 'question-controls';
    
    const lockButton = document.createElement('button');
    lockButton.className = `lock-button ${question.is_locked ? 'locked' : 'unlocked'}`;
    lockButton.innerHTML = `<i class="fas ${question.is_locked ? 'fa-lock' : 'fa-unlock'}"></i> ${question.is_locked ? 'Locked' : 'Open'}`;
    lockButton.onclick = () => toggleQuestionLock(question.id);
    
    const calendarButton = document.createElement('button');
    calendarButton.className = 'calendar-button';
    calendarButton.innerHTML = '<i class="fas fa-calendar-alt"></i> Schedule';
    calendarButton.onclick = () => showCalendarModal(question.id);
    
    controls.appendChild(lockButton);
    controls.appendChild(calendarButton);
    
    container.appendChild(questionInfo);
    container.appendChild(controls);
    
    return container;
}

// Toggle question lock
async function toggleQuestionLock(questionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questions/toggle-lock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question_id: questionId })
        });

        if (response.ok) {
            // Reload questions to reflect changes
            loadFacultyQuestions();
        } else {
            console.error('Failed to toggle question lock');
        }
    } catch (error) {
        console.error('Error toggling question lock:', error);
    }
}

// Search students
async function searchStudents() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const students = await response.json();
            displaySearchResults(students);
        } else {
            console.error('Search failed');
        }
    } catch (error) {
        console.error('Error searching students:', error);
    }
}

function displaySearchResults(students) {
    searchResults.style.display = 'block';
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
        studentsList.innerHTML = '<p class="no-results">No students found.</p>';
        return;
    }
    
    students.forEach(student => {
        const studentElement = document.createElement('div');
        studentElement.className = 'student-item';
        studentElement.innerHTML = `
            <div class="student-info">
                <strong>${student.username}</strong>
                <span>${student.name || 'N/A'}</span>
            </div>
            <button class="view-responses-btn" onclick="viewStudentResponses(${student.id})">
                View Responses
            </button>
        `;
        studentsList.appendChild(studentElement);
    });
}

// View student responses
async function viewStudentResponses(studentId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/responses/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const responses = await response.json();
            displayStudentResponses(responses);
        } else {
            console.error('Failed to load student responses');
        }
    } catch (error) {
        console.error('Error loading student responses:', error);
    }
}

function displayStudentResponses(responses) {
    // Create a modal or expand the search results to show responses
    const responsesContainer = document.createElement('div');
    responsesContainer.className = 'responses-container';
    responsesContainer.innerHTML = `
        <h4>Student Responses</h4>
        <div class="responses-list">
            ${Object.entries(responses).map(([questionId, answer]) => {
                const question = questions.find(q => q.id == questionId);
                return question ? `<div class="response-item"><strong>${question.question_text}:</strong> ${answer}</div>` : '';
            }).join('')}
        </div>
    `;
    
    // Remove existing responses container if any
    const existing = document.querySelector('.responses-container');
    if (existing) existing.remove();
    
    searchResults.appendChild(responsesContainer);
}

// AI Chatbot functionality
function addMessage(content, isAI = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isAI ? 'ai-message' : 'user-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${content}</p>`;
    
    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = 'Just now';
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return '👋 Hello! How can I help you with the college form system today?';
    } else if (lowerMessage.includes('question') || lowerMessage.includes('form')) {
        return '📝 The form contains various sections including personal information, academic details, extracurricular activities, and technical skills. Faculty can lock/unlock questions to control student access.';
    } else if (lowerMessage.includes('lock') || lowerMessage.includes('unlock')) {
        return '🔒 Faculty can lock or unlock questions using the Question Management tab. Locked questions are hidden from students. This helps control which questions are currently active.';
    } else if (lowerMessage.includes('search') || lowerMessage.includes('student')) {
        return '🔍 Use the Student Search tab to find students by name or username. You can then view their individual responses to track progress.';
    } else if (lowerMessage.includes('save') || lowerMessage.includes('response')) {
        return '💾 Students can save their responses using the Save Responses button. All data is stored securely in the database.';
    } else if (lowerMessage.includes('sub') || lowerMessage.includes('conditional')) {
        return '🔄 Some questions have sub-questions that appear when students select "Yes". For example, if they select "Yes" for NPTEL courses, a text field appears asking for the course name.';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        return '🤝 I\'m here to help! Ask me about the form system, question management, student search, or any other features.';
    } else {
        return '🤔 I\'m not sure about that. Try asking about the form system, question management, or student search features.';
    }
}

function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, false);
    
    // Clear input
    chatInput.value = '';
    
    // Generate and add AI response
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addMessage(aiResponse, true);
    }, 500);
}

// Tab navigation
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Event listeners
searchBtn.addEventListener('click', searchStudents);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchStudents();
});

sendMessageBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

facultyLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// Initialize faculty dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadFacultyQuestions();
    setupTabNavigation();
    createCalendarModal();
    checkAutoUnlockQuestions();
    // Check for auto-unlock every minute
    setInterval(checkAutoUnlockQuestions, 60000);
});

// Calendar and auto-unlock functionality
function createCalendarModal() {
    const modal = document.createElement('div');
    modal.className = 'calendar-modal';
    modal.id = 'calendarModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-alt"></i> Schedule Auto-Unlock</h3>
                <button class="close-modal" id="closeModalBtn">×</button>
            </div>
            <div class="modal-body">
                <p>Set a date and time when this question will automatically unlock:</p>
                <div class="datetime-group">
                    <label for="unlockDate">Date:</label>
                    <input type="date" id="unlockDate" class="form-input">
                </div>
                <div class="datetime-group">
                    <label for="unlockTime">Time:</label>
                    <input type="time" id="unlockTime" class="form-input">
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" id="cancelBtn">Cancel</button>
                    <button class="clear-btn" id="clearBtn">Clear Schedule</button>
                    <button class="save-btn" id="saveBtn">Save Schedule</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeModalBtn').addEventListener('click', closeCalendarModal);
    document.getElementById('cancelBtn').addEventListener('click', closeCalendarModal);
    document.getElementById('clearBtn').addEventListener('click', clearAutoUnlock);
    document.getElementById('saveBtn').addEventListener('click', saveAutoUnlock);
}

let currentQuestionId = null;

// Make functions globally accessible
window.showCalendarModal = showCalendarModal;
window.closeCalendarModal = closeCalendarModal;
window.saveAutoUnlock = saveAutoUnlock;
window.clearAutoUnlock = clearAutoUnlock;

function showCalendarModal(questionId) {
    currentQuestionId = questionId;
    const modal = document.getElementById('calendarModal');
    const question = questions.find(q => q.id === questionId);
    
    // Set current values if they exist
    if (question && question.auto_unlock_date) {
        const date = new Date(question.auto_unlock_date);
        document.getElementById('unlockDate').value = date.toISOString().split('T')[0];
        document.getElementById('unlockTime').value = date.toTimeString().split(' ')[0].substring(0, 5);
    } else {
        document.getElementById('unlockDate').value = '';
        document.getElementById('unlockTime').value = '';
    }
    
    modal.classList.add('show');
}

function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    modal.classList.remove('show');
    currentQuestionId = null;
}

async function saveAutoUnlock() {
    const date = document.getElementById('unlockDate').value;
    const time = document.getElementById('unlockTime').value;
    
    if (!date || !time) {
        alert('Please select both date and time');
        return;
    }
    
    const unlockDateTime = new Date(`${date}T${time}`);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questions/schedule-unlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                question_id: currentQuestionId,
                unlock_date: unlockDateTime.toISOString()
            })
        });

        if (response.ok) {
            closeCalendarModal();
            loadFacultyQuestions();
            showNotification('Auto-unlock scheduled successfully!', 'success');
        } else {
            console.error('Failed to schedule auto-unlock');
            alert('Failed to schedule auto-unlock');
        }
    } catch (error) {
        console.error('Error scheduling auto-unlock:', error);
        alert('Error scheduling auto-unlock');
    }
}

async function clearAutoUnlock() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questions/clear-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question_id: currentQuestionId })
        });

        if (response.ok) {
            closeCalendarModal();
            loadFacultyQuestions();
            showNotification('Auto-unlock schedule cleared!', 'success');
        } else {
            console.error('Failed to clear auto-unlock schedule');
            alert('Failed to clear schedule');
        }
    } catch (error) {
        console.error('Error clearing auto-unlock schedule:', error);
        alert('Error clearing schedule');
    }
}

async function checkAutoUnlockQuestions() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/questions/check-auto-unlock', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.unlocked_count > 0) {
                showNotification(`${result.unlocked_count} question(s) automatically unlocked!`, 'success');
                loadFacultyQuestions();
            }
        }
    } catch (error) {
        console.error('Error checking auto-unlock:', error);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('saveNotification');
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
