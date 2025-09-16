// Student Dashboard functionality
let currentUser = null;
let questions = [];
let responses = {};

// DOM elements
const studentWelcome = document.getElementById('studentWelcome');
const studentForm = document.getElementById('studentForm');
const saveResponsesBtn = document.getElementById('saveResponsesBtn');
const logoutBtn = document.getElementById('logoutBtn');
const saveNotification = document.getElementById('saveNotification');

function getQuestionById(id) {
	return questions.find(q => q.id === id);
}

function isConditionalChild(question) {
	if (!question.parent_question_id) return false;
	const parent = getQuestionById(question.parent_question_id);
	return parent && parent.question_type === 'yesno';
}

// Check authentication
function checkAuth() {
	const token = localStorage.getItem('token');
	const user = localStorage.getItem('user');
	
	if (!token || !user) {
		window.location.href = 'login.html';
		return;
	}
	
	currentUser = JSON.parse(user);
	if (currentUser.role !== 'student') {
		window.location.href = 'login.html';
		return;
	}
	
	// Display user's name if available, otherwise username
	const displayName = currentUser.name || currentUser.username;
	studentWelcome.textContent = `Welcome, ${displayName}!`;
}

// Load student questions
async function loadStudentQuestions() {
	try {
		const token = localStorage.getItem('token');
		const response = await fetch('/api/questions/student', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (response.ok) {
			questions = await response.json();
			renderStudentForm();
			// Load any existing responses
			loadStudentResponses();
		} else {
			console.error('Failed to load questions');
		}
	} catch (error) {
		console.error('Error loading questions:', error);
	}
}

// Load existing student responses
async function loadStudentResponses() {
	try {
		const token = localStorage.getItem('token');
		const response = await fetch(`/api/responses/${currentUser.id}`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (response.ok) {
			const existingResponses = await response.json();
			// Merge with current responses
			responses = { ...responses, ...existingResponses };
			// Update form with existing responses
			updateFormWithResponses();
			// Update visibility based on loaded responses
			updateSubQuestionsVisibility();
			updateClassBasedVisibility();
		}
	} catch (error) {
		console.error('Error loading responses:', error);
	}
}

// Update form inputs with loaded responses
function updateFormWithResponses() {
	Object.entries(responses).forEach(([questionId, response]) => {
		const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
		if (!questionElement) return;

		const input = questionElement.querySelector('input, select, textarea');
		if (input) {
			if (input.type === 'radio') {
				const radioGroup = questionElement.querySelectorAll(`input[name="question-${questionId}"]`);
				radioGroup.forEach(radio => {
					if (radio.value === response) {
						radio.checked = true;
					}
				});
			} else {
				input.value = response;
			}
		}
	});
}

// Render student form
function renderStudentForm() {
	studentForm.innerHTML = '';

	// Decide layout class
	studentForm.classList.add('grid-two');

	// Build structures
	const simpleContainers = [];
	const ynGroups = new Map(); // parentId -> { parent, items: [elements] }

	questions
		.filter(q => q.question_type !== 'header')
		.sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0))
		.forEach((q, idx) => {
			const el = createQuestionElement(q, idx);
			if (q.question_type === 'yesno') {
				ynGroups.set(q.id, { parent: el, items: [] });
			} else if (q.parent_question_id && isConditionalChild(q)) {
				const group = ynGroups.get(q.parent_question_id) || { parent: null, items: [] };
				group.items.push(el);
				ynGroups.set(q.parent_question_id, group);
			} else {
				simpleContainers.push(el);
			}
		});

	// Append simple (two-column) first
	simpleContainers.forEach(el => studentForm.appendChild(el));

	// Append yn groups as nested lists, full width
	ynGroups.forEach(({ parent, items }) => {
		const wrapper = document.createElement('div');
		wrapper.className = 'grid-full';

		const list = document.createElement('ul');
		list.className = 'yn-list';
		const item = document.createElement('li');
		item.className = 'yn-item';

		// Remove any helper badges; just render as-is
		item.appendChild(parent);

		if (items.length) {
			const children = document.createElement('ul');
			children.className = 'yn-children';
			items.forEach(child => children.appendChild(child));
			item.appendChild(children);
		}

		list.appendChild(item);
		wrapper.appendChild(list);
		studentForm.appendChild(wrapper);
	});

	// Ensure correct visibility state after render
	updateSubQuestionsVisibility();
	updateClassBasedVisibility();
}

function groupQuestionsBySection() {
	const sections = [];
	let currentSection = [];
	
	questions.forEach(question => {
		if (question.question_type === 'header') {
			if (currentSection.length > 0) {
				sections.push(currentSection);
			}
			currentSection = [question];
		} else {
			currentSection.push(question);
		}
	});
	
	if (currentSection.length > 0) {
		sections.push(currentSection);
	}
	
	return sections;
}

function createQuestionSection(sectionQuestions, sectionIndex) {
	const sectionDiv = document.createElement('div');
	sectionDiv.className = 'question-section';
	
	// Add section header if first question is a header
	if (sectionQuestions[0] && sectionQuestions[0].question_type === 'header') {
		const header = document.createElement('h3');
		header.className = 'section-header';
		header.textContent = sectionQuestions[0].question_text;
		sectionDiv.appendChild(header);
		
		// Remove header from questions to process
		sectionQuestions = sectionQuestions.slice(1);
	}
	
	// Add questions to section
	sectionQuestions.forEach((question, index) => {
		const questionElement = createQuestionElement(question, sectionIndex * 100 + index);
		sectionDiv.appendChild(questionElement);
	});
	
	return sectionDiv;
}

function createQuestionElement(question, index) {
	const container = document.createElement('div');
	const conditional = isConditionalChild(question);
	container.className = `question-container ${conditional ? 'sub-question' : ''}`;
	container.style.animationDelay = `${(index + 1) * 0.1}s`;
	container.dataset.questionId = question.id;
	
	if (conditional) {
		container.dataset.parentQuestionId = question.parent_question_id;
		// hidden by default via CSS; no inline display override needed
	}
	
	if (question.question_type === 'header') {
		container.innerHTML = `<h3 class="question-header">${question.question_text}</h3>`;
		return container;
	}
	
	const label = document.createElement('label');
	label.className = 'question-label';
	label.textContent = question.question_text;
	
	container.appendChild(label);
	
	if (!question.is_locked) {
		const inputElement = createInputElement(question);
		container.appendChild(inputElement);
	}
	
	return container;
}

function createInputElement(question) {
	switch (question.question_type) {
		case 'text':
			const textInput = document.createElement('input');
			textInput.type = 'text';
			textInput.className = 'form-input';
			if (question.question_text.includes('Class')) {
				// This shouldn't be reached as Class is now a select, but keeping as fallback
				textInput.placeholder = 'Enter your class (FY/SY/TY)...';
			} else {
				textInput.placeholder = 'Enter your answer here...';
			}
			textInput.value = responses[question.id] || '';
			textInput.addEventListener('input', (e) => {
				responses[question.id] = e.target.value;
				updateSubQuestionsVisibility();
				if (question.question_text.includes('Class')) {
					updateClassBasedVisibility();
				}
			});
			return textInput;
			
		case 'textarea':
			const textarea = document.createElement('textarea');
			textarea.className = 'form-textarea';
			textarea.placeholder = 'Please provide detailed information...';
			textarea.rows = 4;
			textarea.value = responses[question.id] || '';
			textarea.addEventListener('input', (e) => {
				responses[question.id] = e.target.value;
			});
			return textarea;
			
		case 'select':
			const select = document.createElement('select');
			select.className = 'form-select';
			
			if (question.question_text.includes('Gender')) {
				select.innerHTML = `
					<option value="">Select your gender</option>
					<option value="Male">Male</option>
					<option value="Female">Female</option>
					<option value="Other">Other</option>
				`;
			} else if (question.question_text.includes('Class')) {
				select.innerHTML = `
					<option value="">Select your class</option>
					<option value="FY">FY (First Year)</option>
					<option value="SY">SY (Second Year)</option>
					<option value="TY">TY (Third Year)</option>
				`;
			} else if (question.question_text.includes('Occupation')) {
				select.innerHTML = `
					<option value="">Select your occupation</option>
					<option value="Business">Business</option>
					<option value="Government Job">Government Job</option>
					<option value="Private Job">Private Job</option>
				`;
			}
			
			select.value = responses[question.id] || '';
			select.addEventListener('change', (e) => {
				responses[question.id] = e.target.value;
				updateSubQuestionsVisibility();
				updateClassBasedVisibility();
			});
			return select;
			
		case 'yesno':
			const radioGroup = document.createElement('div');
			radioGroup.className = 'radio-group';
			
			['Yes', 'No'].forEach(value => {
				const label = document.createElement('label');
				label.className = 'radio-label';
				
				const radio = document.createElement('input');
				radio.type = 'radio';
				radio.name = `question-${question.id}`;
				radio.value = value;
				radio.checked = responses[question.id] === value;
				radio.addEventListener('change', (e) => {
					responses[question.id] = e.target.value;
					updateSubQuestionsVisibility();
				});
				
				const customRadio = document.createElement('span');
				customRadio.className = 'radio-custom';
				
				label.appendChild(radio);
				label.appendChild(customRadio);
				label.appendChild(document.createTextNode(` ${value}`));
				radioGroup.appendChild(label);
			});
			
			return radioGroup;
			
		default:
			const defaultInput = document.createElement('input');
			defaultInput.type = 'text';
			defaultInput.className = 'form-input';
			defaultInput.placeholder = 'Enter your answer here...';
			defaultInput.value = responses[question.id] || '';
			defaultInput.addEventListener('input', (e) => {
				responses[question.id] = e.target.value;
				updateSubQuestionsVisibility();
			});
			return defaultInput;
	}
}

// Update sub-questions visibility
function updateSubQuestionsVisibility() {
	// Hide only conditional sub-questions (children of yes/no)
	const allConditionalSubQuestions = Array.from(document.querySelectorAll('.sub-question'));
	allConditionalSubQuestions.forEach(subQ => {
		subQ.classList.remove('visible');
	});

	// Find all yes/no questions that have children
	const yesNoParents = questions.filter(q => q.question_type === 'yesno' && questions.some(subQ => subQ.parent_question_id === q.id));

	// Process each yes/no parent
	yesNoParents.forEach(parentQuestion => {
		const subQuestions = questions.filter(q => q.parent_question_id === parentQuestion.id);
		const parentResponse = responses[parentQuestion.id];
		const shouldShow = parentResponse === 'Yes';

		subQuestions.forEach(subQuestion => {
			const subQuestionElement = document.querySelector(`[data-question-id="${subQuestion.id}"]`);
			if (!subQuestionElement) return;
			if (shouldShow) {
				subQuestionElement.classList.add('visible');
			} else {
				subQuestionElement.classList.remove('visible');
			}
		});
	});
}

// Update class-based visibility
function updateClassBasedVisibility() {
	const classResponse = getClassResponse();
	const restrictedQuestionTexts = [
		'Enrolled in any certificate course at present?',
		'Advance Excel',
		'MS Word',
		'Tally Prime',
		'PPT',
		'AI',
		'Programming',
		'Coding',
		'Participated in any Intra collegiate competition?',
		'Participated in Inter collegiate event?',
		'Are you working part time or full time or doing internship?'
	];

	// If student is FY, completely remove restricted questions
	const shouldHideForFY = classResponse === 'FY';

	questions.forEach(question => {
		if (restrictedQuestionTexts.includes(question.question_text)) {
			const questionElement = document.querySelector(`[data-question-id="${question.id}"]`);
			if (questionElement) {
				if (shouldHideForFY) {
					// Completely remove the question element for FY students
					questionElement.remove();
					// Clear response if hidden
					delete responses[question.id];
				}
			}
			// Also check for sub-questions of restricted questions
			const subQuestions = questions.filter(q => q.parent_question_id === question.id);
			subQuestions.forEach(subQ => {
				const subQuestionElement = document.querySelector(`[data-question-id="${subQ.id}"]`);
				if (subQuestionElement && shouldHideForFY) {
					subQuestionElement.remove();
					delete responses[subQ.id];
				}
			});
		}
	});

	// Show notification when FY is selected
	if (shouldHideForFY) {
		showClassRestrictionNotification();
	} else {
		// If not FY, re-render the form to show all questions
		if (classResponse === 'SY' || classResponse === 'TY') {
			renderStudentForm();
		}
	}
}

// Show notification for FY restrictions
function showClassRestrictionNotification() {
	const notification = document.createElement('div');
	notification.className = 'fy-restriction-notification';
	notification.innerHTML = `
		<i class="fas fa-info-circle"></i>
		<strong>FY Student Notice:</strong> Some advanced questions are hidden as they're not applicable for first-year students.
	`;
	notification.style.cssText = `
		position: fixed;
		top: 120px;
		right: 2rem;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3);
		z-index: 1000;
		max-width: 300px;
		font-size: 0.9rem;
		animation: slideInRight 0.5s ease;
	`;
	
	// Remove existing notification if any
	const existing = document.querySelector('.fy-restriction-notification');
	if (existing) existing.remove();
	
	document.body.appendChild(notification);
	
	// Auto-remove after 5 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 5000);
}

// Get class response from either dropdown or text input
function getClassResponse() {
	const classQuestion = questions.find(q => q.question_text.includes('Class'));
	if (classQuestion) {
		return responses[classQuestion.id] || '';
	}
	return '';
}

// Save responses
async function saveResponses() {
	try {
		const token = localStorage.getItem('token');
		const response = await fetch('/api/responses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				student_id: currentUser.id,
				responses: responses
			})
		});

		if (response.ok) {
			showSaveNotification();
		} else {
			console.error('Failed to save responses');
		}
	} catch (error) {
		console.error('Error saving responses:', error);
	}
}

function showSaveNotification() {
	saveNotification.style.display = 'block';
	setTimeout(() => {
		saveNotification.style.display = 'none';
	}, 3000);
}

// Logout
function logout() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	window.location.href = 'login.html';
}

// Event listeners
saveResponsesBtn.addEventListener('click', saveResponses);
logoutBtn.addEventListener('click', logout);

// Initialize student dashboard
document.addEventListener('DOMContentLoaded', () => {
	checkAuth();
	loadStudentQuestions();
});
