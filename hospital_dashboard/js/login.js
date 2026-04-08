// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCJXl3lOaTuxTW9S1rE9jLtk4LvK-7kFBg",
    authDomain: "suhad-80c82.firebaseapp.com",
    projectId: "suhad-80c82",
    storageBucket: "suhad-80c82.firebasestorage.app",
    messagingSenderId: "527713675665",
    appId: "1:527713675665:web:94c69d4777b0755363d230",
    measurementId: "G-RT1CJ94F58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const errorMessage = document.getElementById('errorMessage');
const loginButton = loginForm.querySelector('.login-button');

// Toggle Password Visibility
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    // Update icon
    const eyeIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" /><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" /></svg>`;
    const eyeSlashIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line></svg>`;

    togglePasswordBtn.innerHTML = isPassword ? eyeSlashIcon : eyeIcon;
    togglePasswordBtn.classList.toggle('active');
});

// Show Error Message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Hide Error Message
function hideError() {
    errorMessage.classList.remove('show');
}

// Set Loading State
function setLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        loginButton.querySelector('.button-text').textContent = 'جاري التحقق...';
    } else {
        loginButton.disabled = false;
        loginButton.querySelector('.button-text').textContent = 'تسجيل الدخول';
    }
}

// Verify Staff Member
async function verifyStaffMember(userId) {
    try {
        const staffDoc = await getDoc(doc(db, 'staff', userId));

        if (!staffDoc.exists()) {
            throw new Error('غير مصرح لك بالدخول إلى هذا النظام');
        }

        const staffData = staffDoc.data();

        // Check if user has nurse or admin role
        if (!['nurse', 'admin', 'doctor'].includes(staffData.role)) {
            throw new Error('غير مصرح لك بالدخول إلى هذا النظام');
        }

        return staffData;
    } catch (error) {
        throw error;
    }
}

// Handle Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    setLoading(true);

    try {
        // Sign in with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('User signed in:', user.uid);

        // Verify that user is a staff member
        const staffData = await verifyStaffMember(user.uid);

        console.log('Staff verified:', staffData);

        // Store staff data in session storage
        sessionStorage.setItem('staffData', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: staffData.name,
            role: staffData.role,
            department: staffData.department
        }));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);

        // Handle specific Firebase errors
        let errorMsg = 'حدث خطأ أثناء تسجيل الدخول';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMsg = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/user-disabled':
                errorMsg = 'تم تعطيل هذا الحساب';
                break;
            case 'auth/user-not-found':
                errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/wrong-password':
                errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'تم تجاوز عدد المحاولات. الرجاء المحاولة لاحقاً';
                break;
            case 'auth/network-request-failed':
                errorMsg = 'خطأ في الاتصال بالشبكة';
                break;
            default:
                errorMsg = error.message;
        }

        showError(errorMsg);
        setLoading(false);
    }
});

// Auto-fill for development (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development mode - add test credentials button
    const testBtn = document.createElement('button');
    testBtn.type = 'button';
    testBtn.textContent = 'Use Test Account';
    testBtn.style.cssText = 'position: fixed; top: 10px; left: 10px; padding: 0.4rem 0.8rem; background: rgba(0,0,0,0.05); border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: Cairo; z-index: 1000;';
    testBtn.addEventListener('click', () => {
        emailInput.value = 'nurse@hospital.com';
        passwordInput.value = 'test123456';
    });
    document.body.appendChild(testBtn);
}

// Check if user is already logged in
auth.onAuthStateChanged(async (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        try {
            // Verify staff member
            await verifyStaffMember(user.uid);
            // Redirect to dashboard if already logged in
            window.location.href = 'dashboard.html';
        } catch (error) {
            // Not a staff member, sign out
            auth.signOut();
        }
    }
});
