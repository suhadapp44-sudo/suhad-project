// ========================================
// Patient Details Page - Full Implementation
// ========================================

// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');

let currentPatient = null;
let currentStaff = null;

// ========================================
// Authentication & Initialization
// ========================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const staffDoc = await getDoc(doc(db, 'staff', user.uid));
        if (staffDoc.exists()) {
            currentStaff = { uid: user.uid, ...staffDoc.data() };
        }

        if (patientId) {
            await loadPatientData(patientId);
            loadProcedures(patientId);
            loadMedications(patientId);
            loadLabTests(patientId);
            loadLatestAIReport(patientId);
        } else {
            alert('معرّف المريض غير موجود');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

// ========================================
// Load Patient Data
// ========================================

async function loadPatientData(id) {
    try {
        const patientDoc = await getDoc(doc(db, 'patients', id));
        if (patientDoc.exists()) {
            currentPatient = { id: patientDoc.id, ...patientDoc.data() };
            displayPatientHeader(currentPatient);
            displayCurrentVitals(currentPatient);
        } else {
            alert('المريض غير موجود');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error loading patient:', error);
    }
}

// ========================================
// Display Functions
// ========================================

function displayPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'غير محدد';
    document.getElementById('patientRoom').textContent = patient.room || '---';
    document.getElementById('patientId').textContent = patient.id || '---';

    // Update avatar initials
    const avatar = document.getElementById('patientAvatar');
    if (patient.name) {
        const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        avatar.textContent = initials;
    }

    // Update status badge and indicator
    const statusBadge = document.getElementById('patientStatus');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusMap = {
        'critical': { label: 'حرجة 🚨', class: 'critical', color: '#ef4444' },
        'warning': { label: 'تحذير ⚠️', class: 'warning', color: '#f59e0b' },
        'stable': { label: 'مستقرة ✅', class: 'stable', color: '#10b981' }
    };
    const status = statusMap[patient.status] || statusMap['stable'];
    statusBadge.textContent = status.label;
    statusBadge.className = `status-badge ${status.class}`;
    statusIndicator.style.background = status.color;
}

function displayCurrentVitals(patient) {
    const container = document.getElementById('currentVitals');

    const vitals = [
        {
            label: 'معدل القلب',
            value: patient.heartRate,
            unit: 'bpm',
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            icon: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        },
        {
            label: 'ضغط الدم',
            value: patient.bloodPressure,
            unit: 'mmHg',
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            icon: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.7 5.27z"/></svg>`
        },
        {
            label: 'الأكسجين',
            value: patient.oxygenLevel,
            unit: '%',
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            icon: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M12.01 5.5L12 5.5l5.05 4.25c.67.56 1.17 1.34 1.41 2.22.25.92.17 1.9-.22 2.76-.39.86-1.05 1.54-1.89 1.94-.83.4-1.76.47-2.65.2l-1.07-.32-.32 1.07c-.4 1.34-1.54 2.37-2.92 2.63l-.7.13-.13-.7c-.26-1.38.77-2.52 2.11-2.92l1.07-.32-.32-1.07c-.55-1.84 1.06-3.79 2.92-3.79.79 0 1.52.36 2.02.93L12 8l-4.59 4.59c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12.01 5.5zM6 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`
        },
        {
            label: 'درجة الحرارة',
            value: patient.temperature,
            unit: '°C',
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            icon: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v1h-1v1h1v1h-1v2.17c-.31-.11-.65-.17-1-.17s-.69.06-1 .17V5z"/></svg>`
        }
    ];

    container.innerHTML = vitals.map(vital => `
        <div class="vital-card">
            <div class="vital-icon-circle" style="color: ${vital.color}; background: ${vital.bgColor};">
                ${vital.icon}
            </div>
            <div class="vital-info">
                <span class="vital-label">${vital.label}</span>
                <div class="vital-value">
                    ${vital.value || '-'}
                    <span class="vital-unit">${vital.unit}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// Load AI Reports
// ========================================

function loadLatestAIReport(patientId) {
    const reportsQuery = query(
        collection(db, 'patients', patientId, 'aiReports'),
        orderBy('timestamp', 'desc'),
        limit(1)
    );

    onSnapshot(reportsQuery, (snapshot) => {
        const container = document.getElementById('latestAIReport');
        if (snapshot.empty) {
            container.innerHTML = '<p class="empty-state">لا يوجد تقرير AI حالياً</p>';
            return;
        }

        const report = snapshot.docs[0].data();
        displayAIReport(report, container);
    });
}

function displayAIReport(report, container) {
    const statusColors = {
        'stable': '#10b981',
        'warning': '#f59e0b',
        'critical': '#ef4444'
    };

    const statusLabels = {
        'stable': 'مستقرة ✅',
        'warning': 'تحذير ⚠️',
        'critical': 'حرجة 🚨'
    };

    container.innerHTML = `
        <div class="ai-report-card">
            <div class="ai-report-header">
                <div class="ai-icon">🤖</div>
                <div>
                    <strong>تقرير الذكاء الاصطناعي</strong>
                    <div class="ai-status-badge" style="background: ${statusColors[report.status] || statusColors.stable}20; color: ${statusColors[report.status] || statusColors.stable};">
                        ${statusLabels[report.status] || 'مستقرة'}
                    </div>
                </div>
            </div>
            <div class="ai-summary">${report.arabicSummary || 'لا يوجد ملخص'}</div>
            <div class="alert-meter">
                <div class="alert-meter-label">
                    <span>مستوى الخطورة</span>
                    <span>${report.alertLevel || 0}/10</span>
                </div>
                <div class="alert-bar">
                    <div class="alert-fill" style="width: ${(report.alertLevel || 0) * 10}%;"></div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// Load Procedures
// ========================================

function loadProcedures(patientId) {
    const proceduresQuery = query(
        collection(db, 'patients', patientId, 'procedures'),
        orderBy('timestamp', 'desc')
    );

    onSnapshot(proceduresQuery, (snapshot) => {
        const container = document.getElementById('proceduresList');
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>لا توجد إجراءات طبية مسجلة</p>
                </div>
            `;
            return;
        }

        const procedures = [];
        snapshot.forEach(doc => {
            procedures.push({ id: doc.id, ...doc.data() });
        });

        displayProcedures(procedures, container);
    });
}

function displayProcedures(procedures, container) {
    container.innerHTML = '<div class="timeline-list">' + procedures.map(proc => `
        <div class="timeline-item ${proc.status.toLowerCase().replace(' ', '-')}">
            <div class="timeline-header">
                <div class="timeline-title">${proc.name}</div>
                <div class="timeline-badge ${proc.status.toLowerCase().replace(' ', '-')}">${proc.status}</div>
            </div>
            <div class="timeline-meta">
                <span>⏰ ${formatTimestamp(proc.timestamp)}</span>
                ${proc.orderedBy ? `<span>👨‍⚕️ ${proc.orderedBy}</span>` : ''}
            </div>
            ${proc.result ? `
                <div class="timeline-results">
                    <h4>📋 النتيجة:</h4>
                    <p>${proc.result}</p>
                </div>
            ` : ''}
        </div>
    `).join('') + '</div>';
}

// ========================================
// Load Medications
// ========================================

function loadMedications(patientId) {
    const medicationsQuery = query(
        collection(db, 'patients', patientId, 'medications'),
        orderBy('timestamp', 'desc')
    );

    onSnapshot(medicationsQuery, (snapshot) => {
        const container = document.getElementById('medicationsList');
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 10L18 10" stroke="currentColor" stroke-width="2"/>
                        <path d="M10 6L10 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>لا توجد أدوية مسجلة</p>
                </div>
            `;
            return;
        }

        const medications = [];
        snapshot.forEach(doc => {
            medications.push({ id: doc.id, ...doc.data() });
        });

        displayMedications(medications, container);
    });
}

function displayMedications(medications, container) {
    container.innerHTML = '<div class="timeline-list">' + medications.map(med => `
        <div class="timeline-item ${med.status.toLowerCase()}">
            <div class="timeline-header">
                <div class="timeline-title">${med.name}</div>
                <div class="timeline-badge ${med.status.toLowerCase()}">${med.status}</div>
            </div>
            <div class="timeline-dose">💊 ${med.dose} ${med.route ? `- ${med.route}` : ''}</div>
            <div class="timeline-meta">
                <span>⏰ ${formatTimestamp(med.timestamp)}</span>
                ${med.givenBy ? `<span>👩‍⚕️ ${med.givenBy}</span>` : ''}
            </div>
        </div>
    `).join('') + '</div>';
}

// ========================================
// Load Lab Tests
// ========================================

function loadLabTests(patientId) {
    const labTestsQuery = query(
        collection(db, 'patients', patientId, 'labTests'),
        orderBy('orderedAt', 'desc')
    );

    onSnapshot(labTestsQuery, (snapshot) => {
        const container = document.getElementById('labTestsList');
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 3V5M15 3V5M9 5C6.79086 5 5 6.79086 5 9V18C5 20.2091 6.79086 22 9 22H15C17.2091 22 19 20.2091 19 18V9C19 6.79086 17.2091 5 15 5M9 5H15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 9V19" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>لا توجد تحاليل مخبرية</p>
                </div>
            `;
            return;
        }

        const labTests = [];
        snapshot.forEach(doc => {
            labTests.push({ id: doc.id, ...doc.data() });
        });

        displayLabTests(labTests, container);
    });
}

function displayLabTests(labTests, container) {
    container.innerHTML = '<div class="timeline-list">' + labTests.map(test => `
        <div class="timeline-item ${test.status.toLowerCase().replace(' ', '-')}">
            <div class="timeline-header">
                <div class="timeline-title">${test.testName}</div>
                <div class="timeline-badge ${test.status.toLowerCase().replace(' ', '-')}">${test.status}</div>
            </div>
            <div class="timeline-meta">
                <span>📅 طُلب: ${formatTimestamp(test.orderedAt)}</span>
                ${test.orderedBy ? `<span>👨‍⚕️ ${test.orderedBy}</span>` : ''}
            </div>
            ${test.results ? `
                <div class="timeline-results">
                    <h4>النتائج:</h4>
                    <div class="result-grid">
                        ${Object.entries(test.results).map(([key, value]) => `
                            <div class="result-item">
                                <span>${key}:</span>
                                <strong>${value}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('') + '</div>';
}

// ========================================
// Tabs Functionality
// ========================================

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Remove active from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active to clicked tab
        tab.classList.add('active');
        document.getElementById(`${targetTab}Tab`).classList.add('active');
    });
});

// ========================================
// Modal Functions
// ========================================

window.showAddProcedure = function () {
    showModal('إضافة إجراء طبي', `
        <form id="procedureForm" class="modal-form">
            <div class="form-group">
                <label>اسم الإجراء *</label>
                <input type="text" name="name" required placeholder="مثال: Chest X-Ray">
            </div>
            <div class="form-group">
                <label>الحالة *</label>
                <select name="status" required>
                    <option value="Scheduled">مُجدول</option>
                    <option value="In Progress">قيد التنفيذ</option>
                    <option value="Completed">مُكتمل</option>
                </select>
            </div>
            <div class="form-group">
                <label>النتيجة/الملاحظات</label>
                <textarea name="result" placeholder="أدخل نتيجة الإجراء أو أي ملاحظات..." rows="3"></textarea>
            </div>
        </form>
    `, async () => {
        const form = document.getElementById('procedureForm');
        const formData = new FormData(form);

        await addDoc(collection(db, 'patients', patientId, 'procedures'), {
            name: formData.get('name'),
            status: formData.get('status'),
            result: formData.get('result'),
            timestamp: serverTimestamp(),
            orderedBy: currentStaff.name,
            createdAt: serverTimestamp()
        });

        closeModal();
        showToast('تم إضافة الإجراء بنجاح');
    });
};

window.showAddMedication = function () {
    showModal('إضافة دواء', `
        <form id="medicationForm" class="modal-form">
            <div class="form-group">
                <label>اسم الدواء *</label>
                <input type="text" name="name" required placeholder="مثال: Aspirin">
            </div>
            <div class="form-group">
                <label>الجرعة *</label>
                <input type="text" name="dose" required placeholder="مثال: 500mg">
            </div>
            <div class="form-group">
                <label>طريقة الإعطاء *</label>
                <select name="route" required>
                    <option value="Oral">فموي (Oral)</option>
                    <option value="IV">وريدي (IV)</option>
                    <option value="IM">عضلي (IM)</option>
                    <option value="SC">تحت الجلد (SC)</option>
                </select>
            </div>
            <div class="form-group">
                <label>الحالة *</label>
                <select name="status" required>
                    <option value="Given">تم الإعطاء</option>
                    <option value="Scheduled">مُجدول</option>
                    <option value="Delayed">متأخر</option>
                </select>
            </div>
        </form>
    `, async () => {
        const form = document.getElementById('medicationForm');
        const formData = new FormData(form);

        await addDoc(collection(db, 'patients', patientId, 'medications'), {
            name: formData.get('name'),
            dose: formData.get('dose'),
            route: formData.get('route'),
            status: formData.get('status'),
            timestamp: serverTimestamp(),
            givenBy: currentStaff.name,
            createdAt: serverTimestamp()
        });

        closeModal();
        showToast('تم إضافة الدواء بنجاح');
    });
};

window.showAddLabTest = function () {
    showModal('طلب تحليل مخبري', `
        <form id="labTestForm" class="modal-form">
            <div class="form-group">
                <label>نوع التحليل *</label>
                <input type="text" name="testName" required placeholder="مثال: Complete Blood Count (CBC)">
            </div>
            <div class="form-group">
                <label>الحالة *</label>
                <select name="status" required>
                    <option value="Ordered">مُطلوب</option>
                    <option value="In Progress">قيد التنفيذ</option>
                    <option value="Ready">جاهز</option>
                    <option value="Reviewed">تمت المراجعة</option>
                </select>
            </div>
            <div class="form-group">
                <label>النتائج (اختياري)</label>
                <textarea name="results" placeholder="أدخل النتائج هنا...
مثال:
WBC: 8500
RBC: 4.5
Hemoglobin: 14" rows="5"></textarea>
                <small style="color: #64748b; font-size: 0.85rem;">💡 يمكنك إدخال النتائج على شكل: [اسم القيمة]: [القيمة]</small>
            </div>
        </form>
    `, async () => {
        const form = document.getElementById('labTestForm');
        const formData = new FormData(form);

        // Parse results if provided
        let results = null;
        const resultsText = formData.get('results');
        if (resultsText && resultsText.trim()) {
            // Try to parse as key:value pairs
            const lines = resultsText.split('\n').filter(line => line.trim());
            const parsedResults = {};
            let hasValidPairs = false;

            lines.forEach(line => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();
                    if (key && value) {
                        parsedResults[key] = value;
                        hasValidPairs = true;
                    }
                }
            });

            // Use parsed results if valid, otherwise store as plain text
            results = hasValidPairs ? parsedResults : { 'نتيجة': resultsText };
        }

        const data = {
            testName: formData.get('testName'),
            status: formData.get('status'),
            orderedAt: serverTimestamp(),
            orderedBy: currentStaff.name,
            createdAt: serverTimestamp()
        };

        // Add results if provided
        if (results) {
            data.results = results;
            data.completedAt = serverTimestamp();
        }

        await addDoc(collection(db, 'patients', patientId, 'labTests'), data);

        closeModal();
        showToast('تم إضافة التحليل بنجاح');
    });
};

function showModal(title, content, onSubmit) {
    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal">
            <h3>${title}</h3>
            ${content}
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
                <button class="btn btn-primary" id="modalSubmitBtn">حفظ</button>
            </div>
        </div>
    `;
    overlay.classList.remove('hidden');

    document.getElementById('modalSubmitBtn').addEventListener('click', onSubmit);
}

window.closeModal = function () {
    document.getElementById('modalOverlay').classList.add('hidden');
};

// ========================================
// Edit Patient
// ========================================

window.editPatient = function () {
    window.location.href = `patient-edit.html?id=${patientId}`;
};

// ========================================
// Helper Functions
// ========================================

function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;

    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('ar-SA', options);
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideUp 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
