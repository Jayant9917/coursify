// API Configuration
const API_BASE_URL = 'http://localhost:3002/api/v1';

// DOM Elements
const navLinks = document.getElementById('navLinks');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const navBackdrop = document.getElementById('navBackdrop');
const landingContent = document.getElementById('landingContent');
const dashboardContent = document.getElementById('dashboardContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');
const signinBtn = document.getElementById('signinBtn');
const signupBtn = document.getElementById('signupBtn');
const signinModal = document.getElementById('signinModal');
const signupModal = document.getElementById('signupModal');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const switchToSignup = document.getElementById('switchToSignup');
const switchToSignin = document.getElementById('switchToSignin');
const closeButtons = document.querySelectorAll('.close');
const coursesGrid = document.getElementById('coursesGrid');
const purchasedCourses = document.getElementById('purchasedCourses');
const availableCourses = document.getElementById('availableCourses');

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
    const token = localStorage.getItem('token');
    if (token) {
        // User is logged in
        navLinks.innerHTML = `
            <a href="#" class="active">Dashboard</a>
            <a href="#courses" class="courses-link">Courses</a>
            <a href="#" id="logoutBtn">Logout</a>
            <a href="admin.html" class="admin-link"><i class="fas fa-user-shield"></i> Admin</a>
        `;
        landingContent.style.display = 'none';
        dashboardContent.style.display = 'block';
        loadPurchasedCourses();
        loadAvailableCourses();
    } else {
        // User is not logged in
        navLinks.innerHTML = `
            <a href="#" class="active">Home</a>
            <a href="#courses" class="courses-link">Courses</a>
            <a href="#" id="signinBtn" class="btn-primary">Sign In</a>
            <a href="#" id="signupBtn" class="btn-primary">Sign Up</a>
            <a href="admin.html" class="admin-link"><i class="fas fa-user-shield"></i> Admin</a>
        `;
        landingContent.style.display = 'block';
        dashboardContent.style.display = 'none';
        loadFeaturedCourses();
    }

    // Add event listeners to navigation links
    attachNavLinkListeners();
}

// Function to attach event listeners to navigation links
function attachNavLinkListeners() {
    const navLinksElements = document.querySelectorAll('#navLinks a');
    navLinksElements.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only prevent default for links that need special handling
            if (link.id === 'signinBtn' || link.id === 'signupBtn' || link.id === 'logoutBtn') {
                e.preventDefault();
            }
            
            // Close mobile menu
            if (hamburgerMenu) hamburgerMenu.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            if (navBackdrop) navBackdrop.classList.remove('active');
            document.body.classList.remove('menu-open');

            // Handle special cases
            if (link.id === 'signinBtn') {
                openModal(signinModal);
            } else if (link.id === 'signupBtn') {
                openModal(signupModal);
            } else if (link.id === 'logoutBtn') {
                localStorage.removeItem('token');
                updateAuthState();
                showToast('Successfully logged out!');
            }
        });
    });
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
        const response = await axios.post(`${API_BASE_URL}/user/signin`, {
            email: document.getElementById('signinEmail').value,
            password: document.getElementById('signinPassword').value
        });
        localStorage.setItem('token', response.data.token);
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
        await axios.post(`${API_BASE_URL}/user/signup`, {
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

// Switch between Sign In and Sign Up
switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signinModal);
    openModal(signupModal);
});

switchToSignin.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signupModal);
    openModal(signinModal);
});

// Load Featured Courses (Landing Page)
async function loadFeaturedCourses() {
    showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/course/preview`);
        displayFeaturedCourses(response.data.courses);
    } catch (error) {
        showToast('Error loading courses', 'error');
    } finally {
        hideLoading();
    }
}

function displayFeaturedCourses(courses) {
    if (courses.length === 0) {
        coursesGrid.innerHTML = '<p class="no-courses">No courses available at the moment.</p>';
        return;
    }
    
    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card">
            <img src="${course.imageUrl}" alt="${course.title}" class="course-image">
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <p class="course-price">₹${course.price}</p>
                <button onclick="showCourseDetails('${course._id}')" class="btn-primary">
                    <i class="fas fa-info-circle"></i> Learn More
                </button>
            </div>
        </div>
    `).join('');
}

// Load Purchased Courses (Dashboard)
async function loadPurchasedCourses() {
    showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/user/purchases`, {
            headers: { token: localStorage.getItem('token') }
        });
        displayPurchasedCourses(response.data.coursesData);
    } catch (error) {
        showToast('Error loading purchased courses', 'error');
    } finally {
        hideLoading();
    }
}

function displayPurchasedCourses(courses) {
    if (courses.length === 0) {
        purchasedCourses.innerHTML = '<p class="no-courses">You haven\'t purchased any courses yet.</p>';
        return;
    }

    purchasedCourses.innerHTML = courses.map(course => `
        <div class="course-card">
            <img src="${course.imageUrl}" alt="${course.title}" class="course-image">
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <p class="course-price">₹${course.price}</p>
                <button class="btn-secondary">Start Learning</button>
            </div>
        </div>
    `).join('');
}

// Load Available Courses (Dashboard)
async function loadAvailableCourses() {
    showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/course/preview`);
        displayAvailableCourses(response.data.courses);
    } catch (error) {
        showToast('Error loading available courses', 'error');
    } finally {
        hideLoading();
    }
}

function displayAvailableCourses(courses) {
    availableCourses.innerHTML = courses.map(course => `
        <div class="course-card">
            <img src="${course.imageUrl}" alt="${course.title}" class="course-image">
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <p class="course-price">₹${course.price}</p>
                <button onclick="purchaseCourse('${course._id}')" class="btn-primary">Purchase</button>
            </div>
        </div>
    `).join('');
}

// Purchase Course
async function purchaseCourse(courseId) {
    showLoading();
    try {
        await axios.post(`${API_BASE_URL}/course/purchase`, 
            { courseId },
            { headers: { token: localStorage.getItem('token') } }
        );
        showToast('Course purchased successfully!');
        loadPurchasedCourses();
        loadAvailableCourses();
    } catch (error) {
        showToast(error.response?.data?.msg || 'Error purchasing course', 'error');
    } finally {
        hideLoading();
    }
}

// Get Started Button Click Handler
document.getElementById('getStartedBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
        // If user is logged in, scroll to available courses
        document.getElementById('availableCourses').scrollIntoView({ behavior: 'smooth' });
    } else {
        // If user is not logged in, show signup modal with a special message
        const signupModal = document.getElementById('signupModal');
        const modalContent = signupModal.querySelector('.modal-content');
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <h3>Welcome to Coursify! 🎓</h3>
            <p>Join our community of learners and start your journey today.</p>
            <ul class="benefits-list">
                <li><i class="fas fa-check"></i> Access to all courses</li>
                <li><i class="fas fa-check"></i> Certificate of completion</li>
                <li><i class="fas fa-check"></i> Lifetime access to materials</li>
                <li><i class="fas fa-check"></i> Expert support</li>
            </ul>
        `;
        modalContent.insertBefore(welcomeMessage, modalContent.firstChild);
        openModal(signupModal);
    }
});

// Course Details Modal
async function showCourseDetails(courseId) {
    showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/course/preview`);
        const course = response.data.courses.find(c => c._id === courseId);
        
        if (!course) {
            showToast('Course not found', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content course-details-modal">
                <span class="close">&times;</span>
                <div class="course-details">
                    <img src="${course.imageUrl}" alt="${course.title}" class="course-details-image">
                    <div class="course-details-content">
                        <h2>${course.title}</h2>
                        <div class="course-meta">
                            <span><i class="fas fa-clock"></i> 30+ Hours of Content</span>
                            <span><i class="fas fa-users"></i> 1000+ Students</span>
                            <span><i class="fas fa-star"></i> 4.8/5 Rating</span>
                        </div>
                        <div class="course-description-full">
                            <h3>What You'll Learn</h3>
                            <ul class="learning-points">
                                <li><i class="fas fa-check"></i> Comprehensive curriculum covering all essential topics</li>
                                <li><i class="fas fa-check"></i> Hands-on projects and real-world applications</li>
                                <li><i class="fas fa-check"></i> Expert-led video lectures and tutorials</li>
                                <li><i class="fas fa-check"></i> Interactive quizzes and assignments</li>
                                <li><i class="fas fa-check"></i> Certificate of completion</li>
                            </ul>
                        </div>
                        <div class="course-features">
                            <h3>Course Features</h3>
                            <div class="features-grid">
                                <div class="feature">
                                    <i class="fas fa-video"></i>
                                    <span>HD Video Lectures</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-file-alt"></i>
                                    <span>Downloadable Resources</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-infinity"></i>
                                    <span>Lifetime Access</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-mobile-alt"></i>
                                    <span>Mobile Friendly</span>
                                </div>
                            </div>
                        </div>
                        <div class="course-actions">
                            <p class="course-price-large">₹${course.price}</p>
                            <button onclick="purchaseCourse('${course._id}')" class="btn-primary">
                                <i class="fas fa-shopping-cart"></i> Enroll Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

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
    const currentPath = window.location.pathname;
    const navLinksElements = document.querySelectorAll('#navLinks a');
    navLinksElements.forEach(link => {
        const linkPath = link.getAttribute('href');
        if ((currentPath === '/' || currentPath.includes('index.html')) && linkPath === '#') {
            link.classList.add('active');
        } else if (linkPath !== '#' && currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });
    
    // Hamburger menu toggle
    if (hamburgerMenu && navLinks && navBackdrop) {
        let isMenuOpen = false;

        hamburgerMenu.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            hamburgerMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
            navBackdrop.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Reattach event listeners when menu is opened
            if (isMenuOpen) {
                attachNavLinkListeners();
            }
        });

        // Backdrop click to close menu
        navBackdrop.addEventListener('click', (e) => {
            if (e.target === navBackdrop) {
                isMenuOpen = false;
                hamburgerMenu.classList.remove('active');
                navLinks.classList.remove('active');
                navBackdrop.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });

        // Prevent clicks inside nav-links from bubbling to backdrop
        navLinks.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});
