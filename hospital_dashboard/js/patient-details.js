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
    limit,
    updateDoc
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
        // Use onSnapshot for real-time updates
        onSnapshot(doc(db, 'patients', id), (docSnapshot) => {
            if (docSnapshot.exists()) {
                currentPatient = { id: docSnapshot.id, ...docSnapshot.data() };
                displayPatientHeader(currentPatient);
                displayCurrentVitals(currentPatient);
            } else {
                alert('المريض غير موجود');
                window.location.href = 'dashboard.html';
            }
        });
    } catch (error) {
        console.error('Error loading patient:', error);
    }
}

// ========================================
// Display Functions
// ========================================

// Helper Dictionary
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

function displayPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'غير محدد';
    document.getElementById('patientId').textContent = patient.id || '---';
    document.getElementById('patientRoom').textContent = patient.room || '---';
    document.getElementById('patientUnit').textContent = translateUnit(patient.unit || ''); // Translated
    document.getElementById('patientAge').textContent = patient.age || '--';

    const avatarEl = document.getElementById('patientAvatar');
    if (patient.name) {
        avatarEl.textContent = patient.name.charAt(0).toUpperCase();
    }

    const statusBadge = document.getElementById('patientStatus');
    const statusMap = {
        'critical': { label: 'حرجة 🚨', class: 'critical' },
        'warning': { label: 'تحذير ⚠️', class: 'warning' },
        'stable': { label: 'مستقرة ✅', class: 'stable' }
    };
    const status = statusMap[patient.status] || statusMap['stable'];
    statusBadge.textContent = status.label;
    statusBadge.className = `status-badge ${status.class}`;
}

function displayCurrentVitals(patient) {
    const container = document.getElementById('currentVitals');

    // Mapping for styles matching the reference CSS icons
    const vitals = [
        {
            label: 'معدل القلب',
            value: patient.heartRate,
            unit: 'bpm',
            iconClass: 'hr',
            iconName: 'favorite'
        },
        {
            label: 'ضغط الدم',
            value: patient.bloodPressure,
            unit: 'mmHg',
            iconClass: 'bp',
            iconName: 'speed'
        },
        {
            label: 'الأكسجين',
            value: patient.oxygenLevel,
            unit: '%',
            iconClass: 'spo2',
            iconName: 'air'
        },
        {
            label: 'درجة الحرارة',
            value: patient.temperature,
            unit: '°C',
            iconClass: 'temp',
            iconName: 'thermostat'
        }
    ];

    container.innerHTML = vitals.map(vital => `
        <div class="vital-card">
            <div class="vital-icon ${vital.iconClass}">
                <i class="material-icons">${vital.iconName}</i>
            </div>
            <div class="vital-info">
                <div class="vital-name">${vital.label}</div>
                <div class="vital-value">
                    ${vital.value || '-'} <small style="font-size: 0.6em; font-weight:normal;">${vital.unit}</small>
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
                    <i class="material-icons">health_and_safety</i>
                    <p>لا توجد إجراءات طبية</p>
                </div>
            `;
            return;
        }

        // ... inside loadMedications ...
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="material-icons">medication</i>
                    <p>لا توجد أدوية مسجلة</p>
                </div>
            `;
            return;
        }

        // ... inside loadLabTests ...
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="material-icons">biotech</i>
                    <p>لا توجد تحاليل مخبرية</p>
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
                    <i class="material-icons">medication</i>
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
                    <i class="material-icons">biotech</i>
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

// DeepSeek Configuration
const DEEPSEEK_API_KEY = 'sk-86b482579a3f4dcd963f61eac651e112';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Service Account Configuration (FOR TESTING - In production use a backend)
const SERVICE_ACCOUNT = {
    "project_id": "suhad-80c82",
    "client_email": "firebase-adminsdk-fbsvc@suhad-80c82.iam.gserviceaccount.com",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQChlrttRaUxm2eP\nNHQPnVbcqB79ZmqDyCfqD/hbmvTNkmJI1SxCrSu8pTrNILGan/8y5mKSg1wictWR\n1rALrizlxf3yOQ5RUeebJhbth1XGv5KjY2U1NzMiUPlvBMGgNcm6fbol8gjptWoU\nos+PqBds0Q4aI1m6zFA/1DpGy28L1J2YRxwJzUMpBu+Q/5oS5j0lHHoXmk/s7lsn\n0VIP30Cz6oz9aEUDvLnkEdrXU+MPIXrxBVfA440vd8yzbdyyIbwx6p2jVtXKQ0/3\nKvNV+k91487T90z8tBAK20avYpT2g6hBgqwo7BH8XnbRPSgkcKIK7/wtlIcYmNpX\njEUkTdu1AgMBAAECggEACCSvQeDAZDlbdPNVBQNuIPUlCKqsZANGhaxz3PP4cdK2\nesqpbhvJiDqAdd13rd3xz7geEBmoH0FPw4eA/Dm1IAhEFbyr3MvGowI+pg5Ls5Ys\nduj3rQCg5lIT2/Uup9sGFUyoQKjLq7F9jNguoyP6uDxp3EXbTAdnZOwWWsJ+UGd8\nW+XqIUzb610AyBNNN0BBjVWpvZ72l0t3mXOvcfTc+wGAveLeuqjsyzDfdV89UcAK\njudA2wUODFVaOUXXDBB1u7zC95x/rhG+a2BA0e9L7jKiJhi6HX1coyOuYpiBrkGN\ TZs4IV6uLKpe6xxzGtCNJbsyw0ZFY9QCN0FWIknYoQKBgQDUTuD95tkj2emSqiUV\nJmaeTTm4YsXoiETtTPqpO3g9RMYB0/17ZKQgLlHpaTFH7LTweV/Tr9C5wYDkve9C\nZx5C+zaQe+gw/2FP6LqEAxlfX2K6yZyXjPx2r6E1tM0JAfjTPxtUpetjxUOCD4Xc\niNgVeM8NNkWRqpMqKmz9BRkoYQKBgQDC18j7JJn/oOUeCL0on5IkO6U0+3IpU1Vl\nVbrSU3BM3eNbXYjkSHIwA7aNet7Tt+pCbM9BRQhHc/qzIBny9C5fSlBlGa02HuQ1\nzRV6zNpSMrack/I++4ecG5+kjtofZl5p4G7DutNLV6MZEnRANmmPl1pthkZwabV1\n8eZM3Boj1QKBgFTCOOikpMO/V5SKAMv0zLseMZD/Peubm4jxVpEBgPtU3YgVTflZ\ MHz4gRMiP95rDcGDc1JbuoSuT/sCKOblrBspl5sPHJ+TFRKF4xCY/CQrPIs9uhp2\n2sO3UjDSwZh7BQ+w/gRJSTRHqK/f6p0ktL+9v0uTAysoYiBPV7ubsXOBAoGAYQoX\njv0rtaTsd4jirNjMcD9EiJ6yvOJEJbQM17O2upHIKjjrdMagGEnBIbWQROHUSkDm\n+BrphKy+r3fNdLMoZU0dvTyMh+fawPDjQcXE9itLx6/ndnbPk3AukkaTXBAf9ZtR\njyn9EgkTsej+/PwcludKokG90z7SoWtYx+7XFgECgYBSH17w5xpNyoKKyjbOvOf1\n0QBJ0FdtQSd2pcBcOsBj8VjNzTgBFxZaMtbaSglEFcVBb06oV2rRdo6Or6ArddLf\nGKYMMOpDpWfbWWTrq0v4mKlwMXLfcDUJpUN52TriuhbZ5ZO+CHEAbimfPKG2h+7Z\n8CdqCrkxjYWi9ZIcVCWIcQ==\n-----END PRIVATE KEY-----\n"
};

/**
 * Generates an OAuth2 Access Token for FCM using the Service Account (Client-side)
 * Uses jsrsasign library loaded in HTML
 */
async function getFCMAccessToken() {
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);

    // Sign the JWT
    const sJWT = KJUR.jws.JWS.sign(null, sHeader, sPayload, SERVICE_ACCOUNT.private_key);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
    });

    const data = await response.json();
    return data.access_token;
}

// Helper to send FCM Push Notification using HTTP v1
async function sendFCMPush(title, body) {
    if (!currentPatient || !currentPatient.fcmTokens || currentPatient.fcmTokens.length === 0) {
        console.log('No FCM tokens found for this patient.');
        return;
    }

    try {
        const accessToken = await getFCMAccessToken();
        const endpoint = `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`;

        // Loop through all tokens since v1 sends to individual tokens
        for (const token of currentPatient.fcmTokens) {
            const message = {
                message: {
                    token: token,
                    notification: {
                        title: title,
                        body: body
                    },
                    data: {
                        type: "alert",
                        patientId: patientId
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default",
                            click_action: "FLUTTER_NOTIFICATION_CLICK"
                        }
                    }
                }
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const result = await response.json();
            console.log(`FCM Send Result for token ${token.substring(0, 10)}...:`, result);
        }
    } catch (error) {
        console.error('Error sending FCM v1 push:', error);
    }
}

// Helper to create alerts for the family app
async function createFamilyAlert(title, message, type) {
    try {
        // 1. Save to Firestore (for in-app list)
        await addDoc(collection(db, 'patients', patientId, 'alerts'), {
            title: title,
            message: message,
            type: type, // medication, lab, critical, info
            timestamp: serverTimestamp(),
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            isAI: true
        });
        console.log('Alert saved to Firestore');

        // 2. Send Real Push Notification (FCM) - ONLY FOR CRITICAL/EMERGENCY
        if (type === 'critical') {
            await sendFCMPush(title, message);
        } else {
            console.log(`Push skipped: Type is ${type}, not critical.`);
        }

    } catch (error) {
        console.error('Error handling alert:', error);
    }
}

// AI Analysis Function using DeepSeek
async function generateAIEventReport(eventType, eventDetails) {
    // Fallback if no patient
    if (!currentPatient) {
        return `تم ${eventType}: ${eventDetails}`;
    }

    // Prepare the medical context
    const patientContext = {
        name: currentPatient.name,
        status: currentPatient.status || 'مستقرة',
        diagnosis: currentPatient.diagnosis || 'غير متوفر',
        vitals: {
            heartRate: currentPatient.heartRate || '-',
            bloodPressure: currentPatient.bloodPressure || '-',
            temperature: currentPatient.temperature || '-'
        }
    };

    // Build the prompt in Arabic
    const prompt = `بناءً على حالة المريض ${patientContext.name} (${patientContext.status})، 
والتشخيص: ${patientContext.diagnosis}، 
والعلامات الحيوية: نبض ${patientContext.vitals.heartRate}، ضغط ${patientContext.vitals.bloodPressure}، 
حرارة ${patientContext.vitals.temperature}...

تم إجراء: ${eventType} (${eventDetails}).

اكتب رسالة تطمينية قصيرة جداً (سطرين كحد أقصى) للعائلة تشرح أهمية هذا الإجراء لحالة المريض، 
مع التركيز على الجانب العلاجي الإيجابي دون ذكر أرقام دقيقة.`;

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "أنت مساعد طبي عربي محترف. مهمتك كتابة رسائل تطمينية قصيرة للعائلات بلغة طبية بسيطة وإيجابية. ركز على تفسير الإجراءات الطبية بشكل مبسط."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.7,
                frequency_penalty: 0.5,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiText = data.choices[0].message.content.trim();
            return aiText;
        } else {
            console.error('Unexpected response format:', data);
            throw new Error('Invalid API response format');
        }

    } catch (error) {
        console.error('DeepSeek AI Generation Error:', error);
        // Return a graceful fallback message in Arabic
        return `تم إجراء ${eventType} للمريض ${currentPatient.name} كجزء من الخطة العلاجية. ${eventDetails}`;
    }
}

window.showAddProcedure = function () {
    showModal('إضافة إجراء طبي', `
        <form id="procedureForm" class="modal-form" autocomplete="off">
            <div class="form-group">
                <label>اسم الإجراء *</label>
                <input type="text" name="name" required placeholder="مثال: Chest X-Ray" autocomplete="off">
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
        const name = formData.get('name');
        const status = formData.get('status');

        showToast('جاري التحليل والإضافة...');

        await addDoc(collection(db, 'patients', patientId, 'procedures'), {
            name: name,
            status: status,
            result: formData.get('result'),
            timestamp: serverTimestamp(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            orderedBy: currentStaff.name,
            createdAt: serverTimestamp()
        });

        // AI Generation
        const aiReport = await generateAIEventReport('إجراء طبي', name);

        // Trigger Alert with AI content
        await createFamilyAlert('تحديث طبي جديد', aiReport, 'info');

        closeModal();
        showToast('تمت الإضافة وإرسال التقرير للعائلة');
    });
};

window.showAddMedication = function () {
    showModal('إضافة دواء', `
        <form id="medicationForm" class="modal-form" autocomplete="off">
            <div class="form-group">
                <label>اسم الدواء *</label>
                <input type="text" name="name" required placeholder="مثال: Aspirin" autocomplete="off">
            </div>
            <div class="form-group">
                <label>الجرعة *</label>
                <input type="text" name="dose" required placeholder="مثال: 500mg" autocomplete="off">
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
        const name = formData.get('name');
        const dose = formData.get('dose');

        showToast('جاري التحليل والإضافة...');

        await addDoc(collection(db, 'patients', patientId, 'medications'), {
            name: name,
            dose: dose,
            route: formData.get('route'),
            status: formData.get('status'),
            timestamp: serverTimestamp(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            givenBy: currentStaff.name,
            createdAt: serverTimestamp()
        });

        // AI Generation
        const aiReport = await generateAIEventReport('دواء', `${name} (${dose})`);

        // Trigger Alert with AI content
        await createFamilyAlert('خطة علاجية جديدة', aiReport, 'medication');

        closeModal();
        showToast('تمت الإضافة وإرسال التقرير للعائلة');
    });
};

window.showAddLabTest = function () {
    showModal('طلب تحليل مخبري', `
        <form id="labTestForm" class="modal-form" autocomplete="off">
            <div class="form-group">
                <label>نوع التحليل *</label>
                <input type="text" name="testName" required placeholder="مثال: Complete Blood Count (CBC)" autocomplete="off">
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
WBC: 8500" rows="5"></textarea>
            </div>
        </form>
    `, async () => {
        const form = document.getElementById('labTestForm');
        const formData = new FormData(form);
        const testName = formData.get('testName');
        const resultsText = formData.get('results');

        showToast('جاري التحليل والإضافة...');

        // ... existing result parsing logic ...
        let results = null;
        if (resultsText && resultsText.trim()) {
            const lines = resultsText.split('\n').filter(line => line.trim());
            const parsed = {};
            lines.forEach(line => {
                const parts = line.split(':');
                if (parts.length >= 2) parsed[parts[0].trim()] = parts.slice(1).join(':').trim();
            });
            results = Object.keys(parsed).length > 0 ? parsed : { 'Summary': resultsText };
        }

        const data = {
            testName: testName,
            status: formData.get('status'),
            orderedAt: serverTimestamp(),
            date: serverTimestamp(),
            orderedBy: currentStaff.name,
            createdAt: serverTimestamp()
        };

        if (results) {
            data.results = results;
            data.completedAt = serverTimestamp();
            data.result = 'Available';
        }

        await addDoc(collection(db, 'patients', patientId, 'labResults'), data);

        // AI Generation
        const aiReport = await generateAIEventReport('تحليل مخبري', testName);

        // Trigger Alert with AI content
        await createFamilyAlert('تحديث المختبر', aiReport, 'lab');

        closeModal();
        showToast('تمت الإضافة وإرسال التقرير للعائلة');
    });
};

function showModal(title, content, onSubmit) {
    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal">
            <h3 style="margin-bottom: 1.5rem; color: #333;">${title}</h3>
            ${content}
            <div class="modal-actions">
                <button onclick="closeModal()" style="padding: 10px 20px; background: #eee; border: none; border-radius: 8px; cursor: pointer;">إلغاء</button>
                <button id="modalSubmitBtn" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 8px; cursor: pointer;">حفظ</button>
            </div>
        </div>
    `;
    overlay.classList.add('active'); // Use active class

    document.getElementById('modalSubmitBtn').addEventListener('click', onSubmit);

    // Click outside to close
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
}

window.closeModal = function () {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
};

// ========================================
// Edit Patient
// ========================================

window.editPatient = function () {
    window.location.href = `patient-edit.html?id=${patientId}`;
};

window.showUpdateVitals = function () {
    if (!currentPatient) return;

    showModal('تحديث العلامات الحيوية', `
        <form id="vitalsForm" class="modal-form" autocomplete="off">
            <div class="form-group">
                <label>معدل ضربات القلب (bpm)</label>
                <input type="number" name="heartRate" value="${currentPatient.heartRate || ''}" placeholder="مثال: 75">
            </div>
            <div class="form-group">
                <label>ضغط الدم (mmHg)</label>
                <input type="text" name="bloodPressure" value="${currentPatient.bloodPressure || ''}" placeholder="مثال: 120/80">
            </div>
            <div class="form-group">
                <label>مستوى الأكسجين (%)</label>
                <input type="number" name="oxygenLevel" value="${currentPatient.oxygenLevel || ''}" placeholder="مثال: 98">
            </div>
            <div class="form-group">
                <label>درجة الحرارة (°C)</label>
                <input type="number" step="0.1" name="temperature" value="${currentPatient.temperature || ''}" placeholder="مثال: 37.2">
            </div>
        </form>
    `, async () => {
        const form = document.getElementById('vitalsForm');
        const formData = new FormData(form);

        const newVitals = {
            heartRate: parseInt(formData.get('heartRate')) || null,
            bloodPressure: formData.get('bloodPressure'),
            oxygenLevel: parseInt(formData.get('oxygenLevel')) || null,
            temperature: parseFloat(formData.get('temperature')) || null
        };

        showToast('جاري تحديث البيانات وتحليلها...');

        // Update Firestore
        await updateDoc(doc(db, 'patients', patientId), {
            ...newVitals,
            lastUpdate: serverTimestamp()
        });

        // Generate AI Report for Vitals via DeepSeek
        const prompt = `
        أنت استشاري عناية مركزة.
        المريض: "${currentPatient.name}". التشخيص: "${currentPatient.diagnosis}".
        
        تم تسجيل علامات حيوية جديدة:
        - نبض: ${newVitals.heartRate} (السابق: ${currentPatient.heartRate})
        - ضغط: ${newVitals.bloodPressure}
        - أكسجين: ${newVitals.oxygenLevel}%
        - حرارة: ${newVitals.temperature}°C

        المطلوب: 
        1. قيم الحالة (مستقرة، مقلقة، حرجة).
        2. اكتب رسالة قصيرة للعائلة (بالعربية) تشرح الوضع الحالي.
        مثال: "الحالة مستقرة، هناك تحسن في درجة الحرارة." أو "نلاحظ ارتفاعاً في النبض ونقوم بالمتابعة."
        `;

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: "أنت طبيب استشاري. يجب أن تبدأ إجابتك دائما بكلمة واحدة تعبر عن حالة المريض بين قوسين: (مستقرة) أو (مقلقة) أو (حرجة)، ثم اكتب الرسالة." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 200
                })
            });

            const data = await response.json();

            let aiText = "تم تحديث العلامات الحيوية.";
            if (data.choices && data.choices[0] && data.choices[0].message) {
                aiText = data.choices[0].message.content.trim();
            }

            // --- AI AUTO STATUS UPDATE ---
            let newStatus = currentPatient.status || "مستقرة";
            let alertType = 'info';

            if (aiText.includes('(حرجة)')) {
                newStatus = "حرجة";
                alertType = 'critical';
            } else if (aiText.includes('(مقلقة)')) {
                newStatus = "مقلقة";
                alertType = 'warning';
            } else if (aiText.includes('(مستقرة)')) {
                newStatus = "مستقرة";
                alertType = 'info';
            }

            // Update Global Patient Status
            await updateDoc(doc(db, 'patients', patientId), {
                status: newStatus
            });

            // Clean AI text for the family (remove the status tag)
            const cleanAiText = aiText.replace(/\(.*\)/, '').trim();

            // Send Alert to Family
            await createFamilyAlert('تحديث العلامات الحيوية', cleanAiText, alertType);

        } catch (e) {
            console.error('AI Vitals Error', e);
            await createFamilyAlert('تحديث العلامات الحيوية', 'تم تحديث القراءات الحيوية للمريض.', 'info');
        }

        closeModal();
        showToast('تم التحديث بنجاح');
    });
};

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
