// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCJXl3lOaTuxTW9S1rE9jLtk4LvK-7kFBg",
    authDomain: "suhad-80c82.firebaseapp.com",
    projectId: "suhad-80c82",
    storageBucket: "suhad-80c82.firebasestorage.app",
    messagingSenderId: "527713675665",
    appId: "1:527713675665:web:94c69d4777b0755363d230",
    measurementId: "G-RT1CJ94F58"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication State
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const staffDoc = await getDoc(doc(db, 'staff', user.uid));
        if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            document.getElementById('userName').textContent = staffData.name || user.email;
            document.getElementById('userRole').textContent = getRoleLabel(staffData.role);
        } else {
            document.getElementById('userName').textContent = user.email;
        }
    } catch (error) {
        console.error('Error loading staff data:', error);
    }

    loadPatients();
});

function getRoleLabel(role) {
    const labels = {
        'admin': 'مدير النظام',
        'doctor': 'طبيب',
        'nurse': 'ممرضة'
    };
    return labels[role] || 'موظف';
}

// Load Patients
function loadPatients() {
    const patientsQuery = query(
        collection(db, 'patients'),
        orderBy('lastUpdate', 'desc')
    );

    onSnapshot(patientsQuery, (snapshot) => {
        const patients = [];
        snapshot.forEach((doc) => {
            patients.push({ id: doc.id, ...doc.data() });
        });

        displayPatients(patients);
        updateStatistics(patients);
    }, (error) => {
        console.error('Error loading patients:', error);
        showError();
    });
}

// Display Patients
function displayPatients(patients) {
    const container = document.getElementById('patientsContainer');

    if (patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏥</div>
                <div class="empty-state-text">لا يوجد مرضى مسجلين حالياً</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>المريض</th>
                    <th>الغرفة</th>
                    <th>الحالة</th>
                    <th>معدل القلب</th>
                    <th>ضغط الدم</th>
                    <th>الأكسجين</th>
                    <th>آخر تحديث</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${patients.map(patient => `
                    <tr>
                        <td>
                            <div class="patient-name">${patient.name}</div>
                            <div class="patient-id">${patient.id}</div>
                        </td>
                        <td>${patient.room || '-'}</td>
                        <td>${getStatusBadge(patient.status)}</td>
                        <td class="vital-mini">${patient.heartRate || '-'} bpm</td>
                        <td class="vital-mini">${patient.bloodPressure || '-'}</td>
                        <td class="vital-mini">${patient.oxygenLevel || '-'}%</td>
                        <td class="vital-mini">${formatTimestamp(patient.lastUpdate)}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-primary" onclick="viewPatient('${patient.id}')">
                                    عرض
                                </button>
                                <button class="btn btn-secondary" onclick="editPatient('${patient.id}')">
                                    تعديل
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Get Status Badge
function getStatusBadge(status) {
    const statuses = {
        'critical': { label: 'حرجة 🚨', class: 'critical' },
        'warning': { label: 'تحذير ⚠️', class: 'warning' },
        'stable': { label: 'مستقرة ✅', class: 'stable' }
    };

    const statusInfo = statuses[status] || statuses['stable'];
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>`;
}

// Update Statistics
function updateStatistics(patients) {
    const total = patients.length;
    const critical = patients.filter(p => p.status === 'critical').length;
    const warning = patients.filter(p => p.status === 'warning').length;
    const stable = patients.filter(p => p.status === 'stable').length;

    animateValue('totalPatients', total);
    animateValue('criticalCount', critical);
    animateValue('warningCount', warning);
    animateValue('stableCount', stable);
}

function animateValue(id, target) {
    const element = document.getElementById(id);
    if (!element) return;

    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const startTime = Date.now();

    function update() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(start + (range * easeProgress));

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Format Timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 172800) return 'أمس';

    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('ar-SA', options);
}

// Navigation Functions
window.viewPatient = function (patientId) {
    window.location.href = `patient-details.html?id=${patientId}`;
};

window.editPatient = function (patientId) {
    window.location.href = `patient-edit.html?id=${patientId}`;
};

// Add Patient
document.getElementById('addPatientBtn').addEventListener('click', () => {
    const newId = 'P' + String(Date.now()).slice(-5);
    window.location.href = `patient-edit.html?id=${newId}&new=true`;
});

// Logout
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

// Show Error
function showError() {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">حدث خطأ أثناء تحميل البيانات</div>
        </div>
    `;
}
