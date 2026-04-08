// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    doc,
    getDoc,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Load staff data
        const staffDoc = await getDoc(doc(db, 'staff', user.uid));

        let staffData;
        if (!staffDoc.exists()) {
            console.warn('Staff profile not found for uid:', user.uid);
            // Create dummy data so we can still use the dashboard
            staffData = {
                name: user.displayName || user.email.split('@')[0],
                role: 'admin' // Default to admin for testing
            };
        } else {
            staffData = staffDoc.data();
        }

        displayStaffInfo(staffData);

        // Load patients
        loadPatients();

    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback for debugging - do not sign out immediately on error
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            avatarEl.textContent = '?';
            avatarEl.title = `Error: ${user.email}`;
            avatarEl.style.backgroundColor = '#ef4444'; // Red for error
        }
        loadPatients(); // Try rendering dashboard anyway
    }
});

// Display staff information
function displayStaffInfo(staffData) {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        // Display first letter of name or person icon
        if (staffData.name) {
            avatarEl.textContent = staffData.name.charAt(0).toUpperCase();
            avatarEl.style.display = 'flex';
            avatarEl.style.justifyContent = 'center';
            avatarEl.style.alignItems = 'center';
        } else {
            avatarEl.innerHTML = '<i class="material-icons">person</i>';
        }

        // Add tooltip with full info
        const roleLabel = getRoleLabel(staffData.role);
        avatarEl.title = `${staffData.name} (${roleLabel})`;
    }
}

function getRoleLabel(role) {
    const labels = {
        'nurse': 'ممرضة',
        'doctor': 'طبيب',
        'admin': 'مدير النظام'
    };
    return labels[role] || role;
}

// Display current date
function displayCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const arabicDate = now.toLocaleDateString('ar-SA', options);
    document.getElementById('currentDate').textContent = arabicDate;
}

displayCurrentDate();
displayCurrentDate();
setInterval(displayCurrentDate, 60000); // Update every minute

// State
let allPatients = [];
let currentFilter = 'all';

// Initialize Selectors
document.querySelectorAll('#unitFilterMenu li').forEach(item => {
    item.addEventListener('click', () => {
        // Update active class
        document.querySelectorAll('#unitFilterMenu li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');

        // Update filter
        currentFilter = item.getAttribute('data-filter');
        filterAndDisplayPatients();
    });
});
function loadPatients() {
    const patientsQuery = query(
        collection(db, 'patients'),
        orderBy('lastUpdate', 'desc')
    );

    onSnapshot(patientsQuery, (snapshot) => {
        const patients = [];
        snapshot.forEach((doc) => {
            patients.push({
                id: doc.id,
                ...doc.data()
            });
        });

        allPatients = patients;
        filterAndDisplayPatients();
    }, (error) => {
        console.error('Error loading patients:', error);
        showErrorInTable('حدث خطأ أثناء تحميل بيانات المرضى');
    });
}

// Filter and Display
function filterAndDisplayPatients() {
    let filtered = allPatients;

    console.log('Current Filter:', currentFilter); // DEBUG

    if (currentFilter !== 'all') {
        const normalizedFilter = currentFilter.trim().toLowerCase();

        filtered = allPatients.filter(p => {
            const patientUnit = (p.unit || '').trim().toLowerCase();
            // Simple contains check can be safer if names vary slightly
            return patientUnit.includes(normalizedFilter) || normalizedFilter.includes(patientUnit);
        });
    }

    console.log('Filtered Count:', filtered.length); // DEBUG
    displayPatients(filtered);
    updateStatistics(allPatients); // Always show total statistics
}

// Translate Unit Name
function translateUnit(unitName) {
    const units = {
        'General ICU': 'العناية المركزة العامة',
        'Cardiac ICU': 'عناية القلب (CCU)',
        'Surgical ICU': 'العناية الجراحية',
        'Medical ICU': 'العناية الباطنية',
        'Pediatric ICU': 'عناية الأطفال (PICU)',
        'Neonatal ICU': 'عناية حديثي الولادة (NICU)',
        'Trauma ICU': 'عناية الحوادث والإصابات'
    };
    return units[unitName] || unitName || 'غير محدد';
}

// Display Patients in Table
function displayPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');



    if (patients.length === 0) {
        const message = currentFilter === 'all' ? 'لا يوجد مرضى حالياً' : `لا يوجد مرضى في ${currentFilter}`;
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10">
                    <svg viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; margin: 0 auto; color: #cbd5e1;">
                        <path d="M20 21V5C20 3.89543 19.1046 3 18 3H6C4.89543 3 4 3.89543 4 5V21" stroke="currentColor" stroke-width="2"/>
                        <path d="M4 21H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p style="margin-top: 1rem; color: #64748b;">${message}</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = patients.map(patient => `
        <tr data-patient-id="${patient.id}">
            <td>${patient.id}</td>
            <td style="font-weight: 600;">${patient.name}</td>
            <td>${patient.age || '-'}</td>
            <td>${translateUnit(patient.unit)}</td>
            <td>${patient.room}</td>
            <td>${getStatusBadge(patient.status)}</td>
            <td>${patient.heartRate || '-'} <span style="font-size: 0.8em; color: #999;">bpm</span></td>
            <td>${patient.bloodPressure || '-'}</td>
            <td>${patient.oxygenLevel || '-'}<span style="color: #94a3b8;">%</span></td>
            <td>${formatTimestamp(patient.lastUpdate)}</td>
            <td>
                <div class="action-buttons" style="display: flex; gap: 8px;">
                    <button class="action-btn" onclick="viewDetails('${patient.id}')" title="الملف الطبي" style="flex: 1; justify-content: center; padding: 6px 12px; border-radius: 6px; background-color: #8b5cf6; color: white; display: flex; align-items: center; gap: 4px; border: none; cursor: pointer;">
                        <svg viewBox="0 0 24 24" fill="none" style="width: 16px; height: 16px;">
                            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>الملف</span>
                    </button>
                    <button class="action-btn view" onclick="viewPatient('${patient.id}')" title="عرض الحالة الصحية" style="flex: 1; justify-content: center; padding: 6px 12px; border-radius: 6px; background-color: #3b82f6; color: white; display: flex; align-items: center; gap: 4px; border: none; cursor: pointer;">
                        <svg viewBox="0 0 24 24" fill="none" style="width: 16px; height: 16px;">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>الحالة</span>
                    </button>
                    <button class="action-btn edit" onclick="editPatient('${patient.id}')" title="تحديث البيانات" style="padding: 6px 12px; border-radius: 6px; background-color: #f1f5f9; color: #475569; display: flex; align-items: center; gap: 4px; border: 1px solid #e2e8f0; cursor: pointer;">
                        <svg viewBox="0 0 24 24" fill="none" style="width: 16px; height: 16px;">
                            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>تعديل</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Get Status Badge HTML
function getStatusBadge(status) {
    const statusMap = {
        'critical': { label: 'حرجة', class: 'critical' },
        'warning': { label: 'تحذير', class: 'warning' },
        'stable': { label: 'مستقرة', class: 'stable' }
    };

    const statusInfo = statusMap[status] || statusMap['stable'];

    return `
        <span class="status-badge ${statusInfo.class}">
            <span class="status-indicator"></span>
            ${statusInfo.label}
        </span>
    `;
}

// Format Timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';

    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;

    const options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// Update Statistics
function updateStatistics(patients) {
    const total = patients.length;
    const critical = patients.filter(p => p.status === 'critical').length;
    const warning = patients.filter(p => p.status === 'warning').length;
    const stable = patients.filter(p => p.status === 'stable').length;

    animateCounter('totalPatients', total);
    animateCounter('criticalPatients', critical);
    animateCounter('warningPatients', warning);
    animateCounter('stablePatients', stable);
}

// Animate Counter
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Set directly without animation for now (simpler and more reliable)
    element.textContent = target;
}

// Show Error in Table
function showErrorInTable(message) {
    const tbody = document.getElementById('patientsTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="10" style="color: #dc2626;">
                <svg viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; margin: 0 auto;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
                <p style="margin-top: 1rem;">${message}</p>
            </td>
        </tr>
    `;
}

// View Patient Status
window.viewPatient = function (patientId) {
    window.location.href = `patient-status.html?id=${patientId}`;
};

// View Patient Medical File/Details
window.viewDetails = function (patientId) {
    window.location.href = `patient-details.html?id=${patientId}`;
};

// Edit Patient
window.editPatient = function (patientId) {
    window.location.href = `patient-edit.html?id=${patientId}`;
};

// Add Patient Button - redirect to patient-edit without ID to create new
document.getElementById('addPatientBtn').addEventListener('click', () => {
    // Generate new patient ID
    const newId = 'P' + String(Date.now()).slice(-5);
    window.location.href = `patient-edit.html?id=${newId}&new=true`;
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
            alert('حدث خطأ أثناء تسجيل الخروج');
        }
    }
});
