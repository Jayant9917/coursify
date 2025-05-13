// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

// DOM Elements
const navLinks = document.getElementById('navLinks');
const adminContent = document.getElementById('adminContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');
const signinModal = document.getElementById('signinModal');
const signupModal = document.getElementById('signupModal');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const closeButtons = document.querySelectorAll('.close');
const createCourseForm = document.getElementById('createCourseForm');
const adminCourses = document.getElementById('adminCourses');

// Loading Spinner
function showLoading() {
    loadingSpinner.style.display = 'block';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Authentication State Management
function updateAuthState() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Admin is logged in
        navLinks.innerHTML = `
            <a href="#" class="active">Dashboard</a>
            <a href="#" id="logoutBtn">Logout</a>
        `;
        adminContent.style.display = 'block';
        loadAdminCourses();
    } else {
        // Admin is not logged in
        navLinks.innerHTML = `
            <a href="#" class="active">Admin Dashboard</a>
            <a href="#" id="signinBtn">Sign In</a>
            <a href="#" id="signupBtn" class="btn-primary">Sign Up</a>
        `;
        adminContent.style.display = 'none';

        // Add event listeners to the newly created buttons
        document.getElementById('signinBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(signinModal);
        });
        document.getElementById('signupBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(signupModal);
        });
    }
}

// Modal Management
function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// Event Listeners for Modals
document.addEventListener('click', (e) => {
    if (e.target === signinModal) closeModal(signinModal);
    if (e.target === signupModal) closeModal(signupModal);
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        closeModal(signinModal);
        closeModal(signupModal);
    });
});

// Auth Form Submissions
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/signin`, {
            email: document.getElementById('signinEmail').value,
            password: document.getElementById('signinPassword').value
        });
        localStorage.setItem('adminToken', response.data.token);
        closeModal(signinModal);
        updateAuthState();
        showToast('Successfully signed in!');
    } catch (error) {
        showToast(error.response?.data?.msg || 'Error signing in', 'error');
    } finally {
        hideLoading();
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    try {
        await axios.post(`${API_BASE_URL}/admin/signup`, {
            firstName: document.getElementById('signupFirstName').value,
            lastName: document.getElementById('signupLastName').value,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value
        });
        showToast('Successfully signed up! Please sign in.');
        closeModal(signupModal);
        openModal(signinModal);
    } catch (error) {
        showToast(error.response?.data?.msg || 'Error signing up', 'error');
    } finally {
        hideLoading();
    }
});

// Create Course
createCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/course`, {
            title: document.getElementById('courseTitle').value,
            description: document.getElementById('courseDescription').value,
            imageUrl: document.getElementById('courseImageUrl').value,
            price: parseFloat(document.getElementById('coursePrice').value)
        }, {
            headers: { token: localStorage.getItem('adminToken') }
        });
        showToast('Course created successfully!');
        createCourseForm.reset();
        loadAdminCourses();
    } catch (error) {
        showToast(error.response?.data?.msg || 'Error creating course', 'error');
    } finally {
        hideLoading();
    }
});

// Load Admin Courses
async function loadAdminCourses() {
    showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/course/bulk`, {
            headers: { token: localStorage.getItem('adminToken') }
        });
        displayAdminCourses(response.data.courses);
    } catch (error) {
        showToast('Error loading courses', 'error');
    } finally {
        hideLoading();
    }
}

function displayAdminCourses(courses) {
    if (courses.length === 0) {
        adminCourses.innerHTML = '<p class="no-courses">You haven\'t created any courses yet.</p>';
        return;
    }

    adminCourses.innerHTML = courses.map(course => `
        <div class="course-card">
            <img src="${course.imageUrl}" alt="${course.title}" class="course-image">
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <p class="course-price">$${course.price}</p>
                <div class="course-actions">
                    <button onclick="editCourse('${course._id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteCourse('${course._id}')" class="btn-danger">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Edit Course
async function editCourse(courseId) {
    // TODO: Implement edit course functionality
    showToast('Edit functionality coming soon!', 'info');
}

// Delete Course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    showLoading();
    try {
        await axios.delete(`${API_BASE_URL}/admin/course/${courseId}`, {
            headers: { token: localStorage.getItem('adminToken') }
        });
        showToast('Course deleted successfully!');
        loadAdminCourses();
    } catch (error) {
        showToast(error.response?.data?.msg || 'Error deleting course', 'error');
    } finally {
        hideLoading();
    }
}

// Logout
document.addEventListener('click', (e) => {
    if (e.target.id === 'logoutBtn') {
        localStorage.removeItem('adminToken');
        updateAuthState();
        showToast('Successfully logged out!');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthState();
}); 