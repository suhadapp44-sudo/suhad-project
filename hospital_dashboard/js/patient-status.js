// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
    updateDoc,
    orderBy,
    limit,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// DeepSeek Configuration
const DEEPSEEK_API_KEY = 'sk-86b482579a3f4dcd963f61eac651e112';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Service Account Configuration (FOR FCM HTTP v1)
const SERVICE_ACCOUNT = {
    "project_id": "suhad-80c82",
    "client_email": "firebase-adminsdk-fbsvc@suhad-80c82.iam.gserviceaccount.com",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQChlrttRaUxm2eP\nNHQPnVbcqB79ZmqDyCfqD/hbmvTNkmJI1SxCrSu8pTrNILGan/8y5mKSg1wictWR\n1rALrizlxf3yOQ5RUeebJhbth1XGv5KjY2U1NzMiUPlvBMGgNcm6fbol8gjptWoU\nos+PqBds0Q4aI1m6zFA/1DpGy28L1J2YRxwJzUMpBu+Q/5oS5j0lHHoXmk/s7lsn\n0VIP30Cz6oz9aEUDvLnkEdrXU+MPIXrxBVfA440vd8yzbdyyIbwx6p2jVtXKQ0/3\nKvNV+k91487T90z8tBAK20avYpT2g6hBgqwo7BH8XnbRPSgkcKIK7/wtlIcYmNpX\njEUkTdu1AgMBAAECggEACCSvQeDAZDlbdPNVBQNuIPUlCKqsZANGhaxz3PP4cdK2\nesqpbhvJiDqAdd13rd3xz7geEBmoH0FPw4eA/Dm1IAhEFbyr3MvGowI+pg5Ls5Ys\nduj3rQCg5lIT2/Uup9sGFUyoQKjLq7F9jNguoyP6uDxp3EXbTAdnZOwWWsJ+UGd8\nW+XqIUzb610AyBNNN0BBjVWpvZ72l0t3mXOvcfTc+wGAveLeuqjsyzDfdV89UcAK\njudA2wUODFVaOUXXDBB1u7zC95x/rhG+a2BA0e9L7jKiJhi6HX1coyOuYpiBrkGN\ TZs4IV6uLKpe6xxzGtCNJbsyw0ZFY9QCN0FWIknYoQKBgQDUTuD95tkj2emSqiUV\nJmaeTTm4YsXoiETtTPqpO3g9RMYB0/17ZKQgLlHpaTFH7LTweV/Tr9C5wYDkve9C\nZx5C+zaQe+gw/2FP6LqEAxlfX2K6yZyXjPx2r6E1tM0JAfjTPxtUpetjxUOCD4Xc\niNgVeM8NNkWRqpMqKmz9BRkoYQKBgQDC18j7JJn/oOUeCL0on5IkO6U0+3IpU1Vl\nVbrSU3BM3eNbXYjkSHIwA7aNet7Tt+pCbM9BRQhHc/qzIBny9C5fSlBlGa02HuQ1\nzRV6zNpSMrack/I++4ecG5+kjtofZl5p4G7DutNLV6MZEnRANmmPl1pthkZwabV1\n8eZM3Boj1QKBgFTCOOikpMO/V5SKAMv0zLseMZD/Peubm4jxVpEBgPtU3YgVTflZ\ MHz4gRMiP95rDcGDc1JbuoSuT/sCKOblrBspl5sPHJ+TFRKF4xCY/CQrPIs9uhp2\n2sO3UjDSwZh7BQ+w/gRJSTRHqK/f6p0ktL+9v0uTAysoYiBPV7ubsXOBAoGAYQoX\njv0rtaTsd4jirNjMcD9EiJ6yvOJEJbQM17O2upHIKjjrdMagGEnBIbWQROHUSkDm\n+BrphKy+r3fNdLMoZU0dvTyMh+fawPDjQcXE9itLx6/ndnbPk3AukkaTXBAf9ZtR\njyn9EgkTsej+/PwcludKokG90z7SoWtYx+7XFgECgYBSH17w5xpNyoKKyjbOvOf1\n0QBJ0FdtQSd2pcBcOsBj8VjNzTgBFxZaMtbaSglEFcVBb06oV2rRdo6Or6ArddLf\nGKYMMOpDpWfbWWTrq0v4mKlwMXLfcDUJpUN52TriuhbZ5ZO+CHEAbimfPKG2h+7Z\n8CdqCrkxjYWi9ZIcVCWIcQ==\n-----END PRIVATE KEY-----\n"
};

/**
 * Generates an OAuth2 Access Token for FCM using the Service Account (Client-side)
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

    // Sign the JWT using jsrsasign library
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

        for (const token of currentPatient.fcmTokens) {
            const message = {
                message: {
                    token: token,
                    notification: { title, body },
                    data: { type: "alert", patientId: patientId },
                    android: {
                        priority: "high",
                        notification: { sound: "default", click_action: "FLUTTER_NOTIFICATION_CLICK" }
                    }
                }
            };

            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });
        }
        console.log('Push notification sent successfully via HTTP v1');
    } catch (error) {
        console.error('Error sending FCM push:', error);
    }
}

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

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');

let currentPatient = null;
let currentStaff = {}; // Define currentStaff

// Check authentication and load patient
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentStaff = { uid: user.uid, name: user.displayName || 'Admin', email: user.email }; // Simple fallback

    if (patientId) {
        await loadPatientData(patientId);
    } else {
        alert('No patient ID specified');
        window.location.href = 'dashboard.html';
    }
});

// Load Patient Data
async function loadPatientData(id) {
    try {
        const patientDoc = await getDoc(doc(db, 'patients', id));

        if (!patientDoc.exists()) {
            alert('Patient not found');
            window.location.href = 'dashboard.html';
            return;
        }

        currentPatient = { id: patientDoc.id, ...patientDoc.data() };
        displayPatientSummary(currentPatient);
        populateVitals(currentPatient);

        // Load Medical Records
        loadProcedures(id);
        loadMedications(id);
        loadLabTests(id);
        loadTimelineHistory(id); // Load Timeline Events

    } catch (error) {
        console.error('Error loading patient:', error);
    }
}

// ... (Existing helper functions) ...

// Timeline Functions
function loadTimelineHistory(patientId) {
    const timelineQuery = query(
        collection(db, 'patients', patientId, 'timeline'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    onSnapshot(timelineQuery, (snapshot) => {
        const container = document.getElementById('updateHistory');
        if (snapshot.empty) {
            container.innerHTML = '<p class="empty-text">لا توجد سجلات حديثة</p>';
            return;
        }

        container.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate() : new Date();
            const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            let icon = 'info';
            let colorClass = 'text-gray-500';

            if (data.type === 'critical') { icon = 'warning'; colorClass = 'text-red-500'; }
            else if (data.type === 'check_circle') { icon = 'check_circle'; colorClass = 'text-green-500'; }
            else if (data.type === 'medication') { icon = 'vaccines'; colorClass = 'text-blue-500'; }
            else if (data.type === 'procedure') { icon = 'healing'; colorClass = 'text-purple-500'; }
            else if (data.type === 'lab') { icon = 'biotech'; colorClass = 'text-teal-500'; }

            // Allow override icon from data
            if (data.icon) icon = data.icon;

            return `
                <div class="timeline-update-item" style="display: flex; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                    <div class="update-icon ${colorClass}" style="width: 32px; height: 32px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg viewBox="0 0 24 24" fill="none" style="width: 18px; height: 18px;">
                            ${getIconPath(icon)}
                        </svg>
                    </div>
                    <div class="update-content">
                        <div class="update-title" style="font-weight: 600; font-size: 0.95rem; color: #334155;">${data.title}</div>
                        <div class="update-desc" style="font-size: 0.85rem; color: #64748b;">${data.description || ''}</div>
                        <div class="update-time" style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

async function addToTimeline(patientId, title, description, type = 'info', icon = null) {
    try {
        await addDoc(collection(db, 'patients', patientId, 'timeline'), {
            title,
            description,
            type,
            icon,
            timestamp: serverTimestamp(),
            staff: currentStaff.name || 'Admin'
        });
    } catch (error) {
        console.error('Error adding to timeline:', error);
    }
}

function getIconPath(iconName) {
    const icons = {
        'info': '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2"/>',
        'warning': '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        'check_circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        'vaccines': '<path d="M3 21l18 0M5 21l0-14l14 0l0 14M17 10l-4 4l-4-4M12 3l0 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        // Simple fallback paths for now
        'healing': '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="2"/>',
        'biotech': '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="2"/>'
    };
    return icons[iconName] || icons['info'];
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

// Display Patient Summary
function displayPatientSummary(patient) {
    document.getElementById('displayPatientName').textContent = patient.name || 'غير معروف';
    document.getElementById('displayPatientId').textContent = `ID: ${patient.id}`;
    document.getElementById('displayAge').textContent = patient.age ? `${patient.age} سنة` : '-- سنة';
    document.getElementById('displayUnit').textContent = translateUnit(patient.unit || '');
    document.getElementById('displayRoom').textContent = patient.room ? `غرفة ${patient.room}` : '--';

    // Update Edit Button Link
    const editBtn = document.getElementById('editPatientBtn');
    if (editBtn) {
        editBtn.onclick = () => window.location.href = `patient-edit.html?id=${patient.id}`;
    }
}

// Populate Vitals Inputs & Add Individual Save Buttons
function populateVitals(patient) {
    const vitals = ['heartRate', 'bloodPressure', 'oxygenLevel', 'temperature'];

    vitals.forEach(vital => {
        const input = document.getElementById(vital);
        if (input) {
            input.value = patient[vital] || '';
            const parent = input.parentElement;

            // Check if button already exists
            if (!parent.querySelector('.save-icon-btn')) {
                const btn = document.createElement('button');
                btn.className = 'save-icon-btn';
                btn.type = 'button';
                btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" stroke-width="2"/><path d="M7 3V8H15V3" stroke="currentColor" stroke-width="2"/></svg>`;
                btn.onclick = () => saveIndividualVital(vital, input.value);
                parent.appendChild(btn);
            }
        }
    });
}

// Get Vital Signs from Form
function getVitalSigns() {
    return {
        heartRate: parseInt(document.getElementById('heartRate').value) || null,
        bloodPressure: document.getElementById('bloodPressure').value || null,
        oxygenLevel: parseInt(document.getElementById('oxygenLevel').value) || null,
        temperature: parseFloat(document.getElementById('temperature').value) || null
    };
}

// Analyze with DeepSeek AI (Background)
async function analyzeWithAI(vitals, patientData) {
    const prompt = `
    أنت طبيب مساعد ذكي في وحدة العناية المركزة.
    بيانات المريض: ${patientData.name}. التشخيص: ${patientData.diagnosis || 'غير محدد'}.
    البيانات الحيوية:
    - نبض: ${vitals.heartRate} bpm
    - ضغط: ${vitals.bloodPressure}
    - أكسجين: ${vitals.oxygenLevel}%
    - حرارة: ${vitals.temperature}°C

    المطلوب تحليل الحالة وإرجاع JSON فقط بالصيغة التالية:
    {
      "status": "stable/warning/critical",
      "arabicSummary": "تقرير بالعربية (max 150 chars)",
      "alertLevel": 0-10,
      "shouldNotify": true/false
    }
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
                    {
                        role: "system",
                        content: "You are a medical AI assistant. You MUST return valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.5,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error('DeepSeek API Error');

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error('AI Analysis Error:', error);
        return getFallbackAnalysis(vitals);
    }
}

// Fallback Analysis (if AI fails)
function getFallbackAnalysis(vitals) {
    let status = 'stable';
    let alertLevel = 0;

    // Simple logic
    if (vitals.heartRate > 120 || vitals.heartRate < 50) { alertLevel += 5; status = 'critical'; }
    else if (vitals.heartRate > 100 || vitals.heartRate < 60) { alertLevel += 3; status = 'warning'; }

    if (vitals.oxygenLevel < 90) { alertLevel += 5; status = 'critical'; }
    else if (vitals.oxygenLevel < 95) { alertLevel += 3; status = 'warning'; }

    return {
        status,
        arabicSummary: status === 'stable' ? 'الحالة مستقرة.' : 'توجد مؤشرات غير طبيعية.',
        alertLevel,
        shouldNotify: status !== 'stable'
    };
}

// Send Notification/Alert to Family App & Save AI Report
async function processAIResult(analysis, vitals) {
    if (!analysis) return;

    try {
        // 1. Save Full AI Report
        await addDoc(collection(db, 'patients', patientId, 'aiReports'), {
            timestamp: serverTimestamp(),
            ...analysis,
            vitals
        });

        // 3. Send Notification to Family (FCM) - ONLY FOR CRITICAL
        if (analysis.status === 'critical') {
            const pushTitle = 'تنبيه طارئ 🚨';
            await sendFCMPush(pushTitle, analysis.arabicSummary);
            
            // 3.1 Save to 'alerts' collection for the app history
            await addDoc(collection(db, 'patients', patientId, 'alerts'), {
                title: pushTitle,
                message: analysis.arabicSummary,
                type: 'critical',
                timestamp: serverTimestamp()
            });
        } else {
            console.log(`Push skipped: AI Status is ${analysis.status}`);
        }

        // 4. Update Patient Status Globally
        let statusAr = { 'stable': 'مستقرة', 'warning': 'مقلقة', 'critical': 'حرجة' };
        await updateDoc(doc(db, 'patients', patientId), {
            status: statusAr[analysis.status] || 'مستقرة'
        });

        console.log('AI Analysis processed, saved, and notification sent.');

    } catch (error) {
        console.error('Error processing AI result:', error);
    }
}

// Helper to trigger AI analysis in background
async function triggerBackgroundAnalysis() {
    if (!currentPatient) return;
    const vitals = getVitalSigns();
    analyzeWithAI(vitals, currentPatient).then(analysis => {
        processAIResult(analysis, vitals);
    });
}

// Save Individual Vital Sign with AI Trigger
async function saveIndividualVital(field, value) {
    if (!value) return;

    // Parse value if number
    let parsedValue = value;
    if (field === 'heartRate' || field === 'oxygenLevel') parsedValue = parseInt(value);
    if (field === 'temperature') parsedValue = parseFloat(value);

    try {
        const updateData = {
            [field]: parsedValue,
            lastUpdate: serverTimestamp()
        };

        // 1. Save data
        await updateDoc(doc(db, 'patients', patientId), updateData);

        // Log to Timeline
        const fieldNames = {
            'heartRate': 'معدل ضربات القلب',
            'bloodPressure': 'ضغط الدم',
            'oxygenLevel': 'مستوى الأكسجين',
            'temperature': 'درجة الحرارة'
        };
        await addToTimeline(patientId, 'تحديث علامة حيوية', `تم تحديث ${fieldNames[field] || field} إلى ${parsedValue}`, 'check_circle');

        alert(`تم تحديث ${field} بنجاح ✅`);

        // 2. Background AI Analysis
        triggerBackgroundAnalysis();

    } catch (error) {
        console.error('Error saving vital:', error);
        alert('حدث خطأ أثناء الحفظ');
    }
}

// Save Status Button Handler (Save Vitals & Trigger AI)
document.getElementById('saveStatusBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveStatusBtn');
    const originalText = saveBtn.querySelector('span').textContent;
    saveBtn.disabled = true;
    saveBtn.querySelector('span').textContent = 'جاري حفظ البيانات...';

    try {
        const vitals = getVitalSigns();

        const updateData = {
            ...vitals,
            lastUpdate: serverTimestamp()
        };

        // 1. Update patient document with new vitals
        await setDoc(doc(db, 'patients', patientId), updateData, { merge: true });

        // Log to Timeline
        await addToTimeline(patientId, 'تحديث العلامات الحيوية', 'تم تحديث مجموعة من العلامات الحيوية للمريض', 'check_circle');

        alert('تم حفظ البيانات بنجاح ✅');

        // 2. Background AI Analysis
        triggerBackgroundAnalysis();

    } catch (error) {
        console.error('Save error:', error);
        alert('حدث خطأ أثناء الحفظ');
    } finally {
        saveBtn.disabled = false;
        saveBtn.querySelector('span').textContent = originalText;
    }
});

// ========================================
// EXTENDED FUNCTIONALITY: Medical Records & Quick Actions
// Ported from patient-details.js for patient-status.html
// ========================================

// 1. Loading Functions
function loadProcedures(patientId) {
    const proceduresQuery = query(
        collection(db, 'patients', patientId, 'procedures'),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    onSnapshot(proceduresQuery, (snapshot) => {
        const container = document.getElementById('proceduresList');
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-state"><p>لا توجد إجراءات طبية حديثة</p></div>';
            return;
        }
        const procedures = [];
        snapshot.forEach(doc => procedures.push({ id: doc.id, ...doc.data() }));
        displayProcedures(procedures, container);
    });
}

function loadMedications(patientId) {
    const medicationsQuery = query(
        collection(db, 'patients', patientId, 'medications'),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    onSnapshot(medicationsQuery, (snapshot) => {
        const container = document.getElementById('medicationsList');
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-state"><p>لا توجد أدوية حديثة</p></div>';
            return;
        }
        const medications = [];
        snapshot.forEach(doc => medications.push({ id: doc.id, ...doc.data() }));
        displayMedications(medications, container);
    });
}

function loadLabTests(patientId) {
    const labTestsQuery = query(
        collection(db, 'patients', patientId, 'labTests'),
        orderBy('orderedAt', 'desc'),
        limit(5)
    );

    onSnapshot(labTestsQuery, (snapshot) => {
        const container = document.getElementById('labTestsList');
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-state"><p>لا توجد تحاليل حديثة</p></div>';
            return;
        }
        const labTests = [];
        snapshot.forEach(doc => labTests.push({ id: doc.id, ...doc.data() }));
        displayLabTests(labTests, container);
    });
}

// 2. Display Functions
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-SA');
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
            </div>
        </div>
    `).join('') + '</div>';
}

function displayMedications(medications, container) {
    container.innerHTML = '<div class="timeline-list">' + medications.map(med => `
        <div class="timeline-item ${med.status.toLowerCase()}">
            <div class="timeline-header">
                <div class="timeline-title">${med.name}</div>
                <div class="timeline-badge ${med.status.toLowerCase()}">${med.status}</div>
            </div>
            <div class="timeline-dose">💊 ${med.dose}</div>
            <div class="timeline-meta">
                <span>⏰ ${formatTimestamp(med.timestamp)}</span>
            </div>
        </div>
    `).join('') + '</div>';
}

function displayLabTests(labTests, container) {
    container.innerHTML = '<div class="timeline-list">' + labTests.map(test => `
        <div class="timeline-item ${test.status.toLowerCase().replace(' ', '-')}">
            <div class="timeline-header">
                <div class="timeline-title">${test.testName}</div>
                <div class="timeline-badge ${test.status.toLowerCase().replace(' ', '-')}">${test.status}</div>
            </div>
            <div class="timeline-meta">
                <span>📅 ${formatTimestamp(test.orderedAt)}</span>
            </div>
        </div>
    `).join('') + '</div>';
}

// 3. Modal & Quick Actions Logic
window.showModal = function (title, content, onSubmit) {
    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal">
            <h3 style="margin-bottom: 1.5rem; color: #1e293b; font-weight: 700;">${title}</h3>
            ${content}
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                <button onclick="closeModal()" style="padding: 0.75rem 1.5rem; background: #f1f5f9; color: #334155; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo', sans-serif;">إلغاء</button>
                <button id="modalSubmitBtn" style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo', sans-serif;">حفظ</button>
            </div>
        </div>
    `;
    overlay.classList.remove('hidden');

    document.getElementById('modalSubmitBtn').addEventListener('click', onSubmit);

    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
};

window.switchModalTab = function (tabIndex) {
    const tabs = document.querySelectorAll('.modal-tab');
    const contents = document.querySelectorAll('.tab-content');
    const submitBtn = document.getElementById('modalSubmitBtn');

    tabs.forEach((tab, index) => {
        tab.classList.toggle('active', index === tabIndex);
    });

    contents.forEach((content, index) => {
        content.classList.toggle('active', index === tabIndex);
    });

    // Hide submit button on Results tab (tab 1)
    if (submitBtn) {
        submitBtn.style.display = tabIndex === 0 ? 'block' : 'none';
    }
};

window.closeModal = function () {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
};

// Quick Actions Implementation
window.showAddProcedure = function () {
    const renderProceduresList = async () => {
        const q = query(collection(db, 'patients', patientId, 'procedures'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        let html = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString('linear') || 'مجدول';
            const statusClass = (data.status || 'Routine').toLowerCase().replace(' ', '');
            html += `
                <div class="result-item">
                    <div class="result-item-header">
                        <span class="result-item-title">${data.name}</span>
                        <span class="result-item-badge ${statusClass}">${data.status}</span>
                    </div>
                    <div class="result-item-meta">${date}</div>
                    ${data.result ? `<div class="result-item-content"><strong>النتيجة:</strong> ${data.result}</div>` : ''}
                </div>
            `;
        });
        return html || '<p class="empty-text">لا توجد إجراءات سابقة</p>';
    };

    showModal('الإجراءات الطبية', `
        <div class="modal-tabs">
            <div class="modal-tab active" onclick="switchModalTab(0)">
                <i class="material-icons">add_circle</i> طلب إجراء
            </div>
            <div class="modal-tab" onclick="switchModalTab(1); document.getElementById('procListContainer').innerHTML = 'جاري التحميل...'; (async () => { document.getElementById('procListContainer').innerHTML = await window._procListFunc(); })()">
                <i class="material-icons">history</i> النتائج والجدولة
            </div>
        </div>

        <div id="tab0" class="tab-content active">
            <form id="procedureForm" class="modal-form" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label>اسم الإجراء *</label>
                    <input type="text" name="name" required placeholder="مثال: Chest X-Ray">
                </div>
                <div class="form-group">
                    <label>الحالة (الأولوية) *</label>
                    <select name="status" required>
                        <option value="STAT">STAT (فوري)</option>
                        <option value="URGENT">URGENT (عاجل)</option>
                        <option value="Routine" selected>Routine (روتيني)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>سبب الإجراء</label>
                    <textarea name="reason" placeholder="أدخل سبب طلب الإجراء..." rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label>ملاحظات إضافية</label>
                    <textarea name="result" placeholder="أدخل أي ملاحظات أخرى..." rows="2"></textarea>
                </div>
            </form>
        </div>

        <div id="tab1" class="tab-content">
            <div id="procListContainer" style="max-height: 400px; overflow-y: auto;">
                جاري تحميل السجل...
            </div>
        </div>
    `, async () => {
        const form = document.getElementById('procedureForm');
        const formData = new FormData(form);
        const name = formData.get('name');

        await addDoc(collection(db, 'patients', patientId, 'procedures'), {
            name: name,
            status: formData.get('status'),
            reason: formData.get('reason'),
            result: formData.get('result'),
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        await addToTimeline(patientId, 'إضافة إجراء طبي', `تمت إضافة إجراء: ${name}`, 'procedure', 'healing');
        triggerBackgroundAnalysis();
        closeModal();
    });
    
    // Attachment for async list loading
    window._procListFunc = renderProceduresList;
};

window.showAddMedication = function () {
    const renderMedsList = async () => {
        const q = query(collection(db, 'patients', patientId, 'medications'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        let html = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString('linear') || 'مجدول';
            html += `
                <div class="result-item">
                    <div class="result-item-header">
                        <span class="result-item-title">${data.name} (${data.dose})</span>
                        <span class="result-item-badge routine">${data.route}</span>
                    </div>
                    <div class="result-item-meta">${date} - الحالة: ${data.status}</div>
                    ${data.notes ? `<div class="result-item-content"><strong>ملاحظات:</strong> ${data.notes}</div>` : ''}
                </div>
            `;
        });
        return html || '<p class="empty-text">لا توجد أدوية مسجلة</p>';
    };

    showModal('الأدوية', `
        <div class="modal-tabs">
            <div class="modal-tab active" onclick="switchModalTab(0)">
                <i class="material-icons">add_circle</i> إضافة دواء
            </div>
            <div class="modal-tab" onclick="switchModalTab(1); document.getElementById('medsListContainer').innerHTML = 'جاري التحميل...'; (async () => { document.getElementById('medsListContainer').innerHTML = await window._medsListFunc(); })()">
                <i class="material-icons">history</i> السجل والجرعات
            </div>
        </div>

        <div id="tab0" class="tab-content active">
            <form id="medicationForm" class="modal-form" style="display: flex; flex-direction: column; gap: 1rem;">
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
                        <option value="Oral">Oral (فموي)</option>
                        <option value="IV">IV (وريدي)</option>
                        <option value="IM">IM (عضلي)</option>
                        <option value="SC">SC (تحت الجلد)</option>
                        <option value="Nebulization">Nebulization (تبخير)</option>
                        <option value="Sublingual">Sublingual (تحت اللسان)</option>
                        <option value="Rectal">Rectal (شرجي)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>الحالة *</label>
                    <select name="status" required>
                        <option value="STAT">STAT</option>
                        <option value="URGENT">URGENT</option>
                        <option value="Routine" selected>Routine</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ملاحظات</label>
                    <textarea name="notes" placeholder="أدخل ملاحظات الجرعة..." rows="2"></textarea>
                </div>
            </form>
        </div>

        <div id="tab1" class="tab-content">
            <div id="medsListContainer" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
    `, async () => {
        const form = document.getElementById('medicationForm');
        const formData = new FormData(form);
        const name = formData.get('name');

        await addDoc(collection(db, 'patients', patientId, 'medications'), {
            name: name,
            dose: formData.get('dose'),
            route: formData.get('route'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        await addToTimeline(patientId, 'إضافة دواء', `تمت إضافة دواء: ${name}`, 'medication', 'vaccines');
        triggerBackgroundAnalysis();
        closeModal();
    });

    window._medsListFunc = renderMedsList;
};

window.showAddLabTest = function () {
    const renderLabsList = async () => {
        const q = query(collection(db, 'patients', patientId, 'labTests'), orderBy('orderedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        let html = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.orderedAt?.toDate().toLocaleString('linear') || 'مطلوب';
            const statusClass = (data.status || 'Routine').toLowerCase();
            html += `
                <div class="result-item">
                    <div class="result-item-header">
                        <span class="result-item-title">${data.testName}</span>
                        <span class="result-item-badge ${statusClass}">${data.status}</span>
                    </div>
                    <div class="result-item-meta">${date}</div>
                    ${data.results ? `<div class="result-item-content"><strong>النتيجة:</strong> ${data.results.Summary || 'موجودة في الملف'}</div>` : '<div class="result-item-content"><em>بانتظار النتائج...</em></div>'}
                </div>
            `;
        });
        return html || '<p class="empty-text">لا توجد تحاليل سابقة</p>';
    };

    showModal('التحاليل الطبية', `
        <div class="modal-tabs">
            <div class="modal-tab active" onclick="switchModalTab(0)">
                <i class="material-icons">add_circle</i> طلب تحليل
            </div>
            <div class="modal-tab" onclick="switchModalTab(1); document.getElementById('labsListContainer').innerHTML = 'جاري التحميل...'; (async () => { document.getElementById('labsListContainer').innerHTML = await window._labsListFunc(); })()">
                <i class="material-icons">biotech</i> النتائج السابقة
            </div>
        </div>

        <div id="tab0" class="tab-content active">
            <form id="labTestForm" class="modal-form" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label>نوع التحليل *</label>
                    <input type="text" name="testName" required placeholder="مثال: CBC / Kidney Profile">
                </div>
                <div class="form-group">
                    <label>الحالة (الأولوية) *</label>
                    <select name="status" required>
                        <option value="STAT">STAT (فوري)</option>
                        <option value="URGENT">URGENT (عاجل)</option>
                        <option value="Routine" selected>Routine (روتيني)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ملاحظات للمختبر</label>
                    <textarea name="results" placeholder="أي تفاصيل إضافية للطلب..." rows="3"></textarea>
                </div>
            </form>
        </div>

        <div id="tab1" class="tab-content">
            <div id="labsListContainer" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
    `, async () => {
        const form = document.getElementById('labTestForm');
        const formData = new FormData(form);
        const testName = formData.get('testName');

        await addDoc(collection(db, 'patients', patientId, 'labTests'), {
            testName: testName,
            status: formData.get('status'),
            results: formData.get('results') ? { 'Summary': formData.get('results') } : null,
            orderedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        await addToTimeline(patientId, 'طلب تحليل مخبري', `تم طلب تحليل: ${testName}`, 'lab', 'biotech');
        triggerBackgroundAnalysis();
        closeModal();
    });

    window._labsListFunc = renderLabsList;
};


