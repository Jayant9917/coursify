// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

// DOM Elements
const navLinks = document.getElementById('navLinks');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const navBackdrop = document.getElementById('navBackdrop');
const adminContent = document.getElementById('adminContent');
const adminWelcome = document.getElementById('adminWelcome');
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
            <a href="index.html">Home</a>
            <a href="#" class="active">Dashboard</a>
            <a href="#" id="logoutBtn">Logout</a>
        `;
        adminContent.style.display = 'block';
        adminWelcome.style.display = 'none';
        loadAdminCourses();
    } else {
        // Admin is not logged in
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="#" class="active">Admin Dashboard</a>
            <a href="#" id="signinBtn" class="btn-primary">Sign In</a>
            <a href="#" id="signupBtn" class="btn-primary">Sign Up</a>
        `;
        adminContent.style.display = 'none';
        adminWelcome.style.display = 'block';

        // Add event listeners to the newly created buttons
        document.getElementById('signinBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(signinModal);
        });
        document.getElementById('signupBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openModal(signupModal);
        });
        
        // Add event listeners to welcome page buttons
        if (document.getElementById('welcomeSigninBtn')) {
            document.getElementById('welcomeSigninBtn').addEventListener('click', () => {
                openModal(signinModal);
            });
        }
        
        if (document.getElementById('welcomeSignupBtn')) {
            document.getElementById('welcomeSignupBtn').addEventListener('click', () => {
                openModal(signupModal);
            });
        }
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
                <p class="course-price">₹${course.price}</p>
                <div class="course-actions">
                    <button onclick="editCourse('${course._id}')" class="btn-secondary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteCourse('${course._id}')" class="btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Edit Course
async function editCourse(courseId) {
    showLoading();
    try {
        // First, get the course details
        const response = await axios.get(`${API_BASE_URL}/admin/course/${courseId}`, {
            headers: { token: localStorage.getItem('adminToken') }
        });
        const course = response.data.course;

        // Create and show the edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Course</h2>
                <form id="editCourseForm">
                    <div class="form-group">
                        <label for="editCourseTitle">Title</label>
                        <input type="text" id="editCourseTitle" value="${course.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="editCourseDescription">Description</label>
                        <textarea id="editCourseDescription" required>${course.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="editCourseImageUrl">Image URL</label>
                        <input type="url" id="editCourseImageUrl" value="${course.imageUrl}" required>
                    </div>
                    <div class="form-group">
                        <label for="editCoursePrice">Price (₹)</label>
                        <input type="number" id="editCoursePrice" value="${course.price}" step="0.01" required>
                    </div>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Handle form submission
        const editForm = document.getElementById('editCourseForm');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            try {
                await axios.put(`${API_BASE_URL}/admin/course/${courseId}`, {
                    title: document.getElementById('editCourseTitle').value,
                    description: document.getElementById('editCourseDescription').value,
                    imageUrl: document.getElementById('editCourseImageUrl').value,
                    price: parseFloat(document.getElementById('editCoursePrice').value)
                }, {
                    headers: { token: localStorage.getItem('adminToken') }
                });
                showToast('Course updated successfully!');
                modal.remove();
                loadAdminCourses();
            } catch (error) {
                showToast(error.response?.data?.msg || 'Error updating course', 'error');
            } finally {
                hideLoading();
            }
        });

        // Close modal functionality
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            modal.remove();
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    } catch (error) {
        showToast('Error loading course details', 'error');
    } finally {
        hideLoading();
    }
}

// Delete Course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }
    
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

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthState();
    
    // Add active class to current nav link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.textContent.includes('Dashboard')) {
            link.classList.add('active');
        }
    });
    
    // Hamburger menu toggle
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            const navLinksEl = document.getElementById('navLinks');
            if (navLinksEl) navLinksEl.classList.toggle('active');
            if (navBackdrop) navBackdrop.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
    
    // Backdrop click to close menu
    if (navBackdrop) {
        navBackdrop.addEventListener('click', () => {
            if (hamburgerMenu) hamburgerMenu.classList.remove('active');
            const navLinksEl = document.getElementById('navLinks');
            if (navLinksEl) navLinksEl.classList.remove('active');
            if (navBackdrop) navBackdrop.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    }
    
    // Close mobile menu when a link is clicked
    const navLinksElements = document.querySelectorAll('.nav-links a');
    if (navLinksElements.length > 0) {
        navLinksElements.forEach(link => {
            link.addEventListener('click', () => {
                if (hamburgerMenu) hamburgerMenu.classList.remove('active');
                const navLinksEl = document.getElementById('navLinks');
                if (navLinksEl) navLinksEl.classList.remove('active');
                if (navBackdrop) navBackdrop.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
}); 