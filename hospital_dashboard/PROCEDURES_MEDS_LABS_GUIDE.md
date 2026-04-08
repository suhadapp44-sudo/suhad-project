# 🏥 دليل إضافة Procedures, Medications & Labs إلى النظام

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تعديل لوحة التحكم لإضافة:
1. ✅ الإجراءات الطبية (Procedures)
2. ✅ الأدوية (Medications)  
3. ✅ التحاليل المخبرية (Lab Tests)

---

## 1️⃣ **تحديث هيكل Firestore**

### في Firebase Console → Firestore:

لكل مريض، سيكون لديه subcollections:

```
patients/
  └── P001/
      ├── name, room, vitals... (موجود)
      │
      ├── procedures/ (جديد)
      │   └── {auto-id}/
      │       ├── name: string
      │       ├── timestamp: timestamp
      │       ├── status: "Scheduled" | "In Progress" | "Completed"
      │       ├── note: string
      │       ├── orderedBy: string
      │       └── createdAt: timestamp
      │
      ├── medications/ (جديد)
      │   └── {auto-id}/
      │       ├── name: string
      │       ├── dose: string
      │       ├── timestamp: timestamp
      │       ├── status: "Given" | "Scheduled" | "Delayed"
      │       ├── route: "Oral" | "IV" | "IM" | "SC"
      │       ├── frequency: string
      │       ├── givenBy: string
      │       └── createdAt: timestamp
      │
      └── labTests/ (جديد)
          └── {auto-id}/
              ├── testName: string
              ├── orderedAt: timestamp
              ├── completedAt: timestamp | null
              ├── status: "Ordered" | "In Progress" | "Ready" | "Reviewed"
              ├── results: object | null
              ├── orderedBy: string
              └── createdAt: timestamp
```

**لا حاجة لإنشاء هذه المجموعات يدوياً** - ستُنشأ تلقائياً عند أول إضافة.

---

## 2️⃣ **Security Rules المُحدّثة**

في Firestore → Rules، أضف:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... القواعد الموجودة ...
    
    match /patients/{patientId} {
      allow write: if isStaff();
      allow read: if isStaff() || /* ... */;
      
      // قواعد الـ subcollections الجديدة
      match /procedures/{procedureId} {
        allow read: if isStaff();
        allow write: if isStaff();
      }
      
      match /medications/{medicationId} {
        allow read: if isStaff();
        allow write: if isStaff();
      }
      
      match /labTests/{labTestId} {
        allow read: if isStaff();
        allow write: if isStaff();
      }
    }
  }
}
```

---

## 3️⃣ **إضافة الملفات الجديدة**

### أ) CSS للصفحة الجديدة:

أنشئ `hospital_dashboard/css/patient-details.css`:

```css
/* نفس الأساسيات من dashboard.css */
@import url('dashboard.css');

/* Tabs */
.tabs {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
    border-bottom: 2px solid #e2e8f0;
}

.tab {
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-family: 'Cairo', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
}

.tab:hover {
    color: var(--primary);
}

.tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

/* Tab Content */
.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Patient Header */
.patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.patient-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
}

.meta {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    color: #64748b;
}

/* Card Header Flex */
.card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

/* Add Button */
.add-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border: none;
    border-radius: 10px;
    font-family: 'Cairo', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.add-btn svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
}

/* Timeline List */
.timeline-list {
    position: relative;
    padding-right: 2rem;
}

.timeline-list::before {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
}

.timeline-item {
    position: relative;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    margin-bottom: 1rem;
}

.timeline-item::before {
    content: '';
    position: absolute;
    right: -2.5rem;
    top: 1.5rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--primary);
    border: 3px solid white;
    box-shadow: 0 0 0 2px var(--primary);
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.75rem;
}

.timeline-title {
    font-weight: 700;
    color: var(--text-dark);
    font-size: 1.1rem;
}

.timeline-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
}

.timeline-badge.completed {
    background: #dcfce7;
    color: #16a34a;
}

.timeline-badge.scheduled {
    background: #dbeafe;
    color: #2563eb;
}

.timeline-badge.in-progress {
    background: #fef3c7;
    color: #d97706;
}

.timeline-meta {
    display: flex;
    gap: 1rem;
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.timeline-note {
    margin-top: 0.75rem;
    color: var(--text-body);
    line-height: 1.6;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 3rem;
    color: #94a3b8;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-overlay.hidden {
    display: none;
}

.modal {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal h3 {
    margin-bottom: 1.5rem;
    color: var(--text-dark);
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
}
```

---

### ب) JavaScript للصفحة:

أنشئ `hospital_dashboard/js/patient-details.js`:

```javascript
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
    serverTimestamp
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

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Get staff data
    const staffDoc = await getDoc(doc(db, 'staff', user.uid));
    if (staffDoc.exists()) {
        currentStaff = { uid: user.uid, ...staffDoc.data() };
    }

    if (patientId) {
        await loadPatientData(patientId);
        loadProcedures(patientId);
        loadMedications(patientId);
        loadLabTests(patientId);
    }
});

// Load Patient Data
async function loadPatientData(id) {
    const patientDoc = await getDoc(doc(db, 'patients', id));
    if (patientDoc.exists()) {
        currentPatient = { id: patientDoc.id, ...patientDoc.data() };
        displayPatientHeader(currentPatient);
        displayCurrentVitals(currentPatient);
    }
}

// Display Patient Header
function displayPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('patientRoom').textContent = `غرفة: ${patient.room}`;
    
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

// ... المزيد من الوظائف في الملف الكامل
```

---

## 4️⃣ **استخدام النظام**

### **إضافة إجراء طبي:**

```javascript
// في patient-details.js
async function addProcedure(data) {
    await addDoc(collection(db, 'patients', patientId, 'procedures'), {
        name: data.name,
        timestamp: serverTimestamp(),
        status: data.status, // "Scheduled", "In Progress", "Completed"
        note: data.note,
        orderedBy: currentStaff.name,
        createdAt: serverTimestamp()
    });
}
```

### **إضافة دواء:**

```javascript
async function addMedication(data) {
    await addDoc(collection(db, 'patients', patientId, 'medications'), {
        name: data.name,
        dose: data.dose,
        timestamp: serverTimestamp(),
        status: "Given", // أو "Scheduled"
        route: data.route, // "Oral", "IV", etc
        givenBy: currentStaff.name,
        createdAt: serverTimestamp()
    });
}
```

### **إضافة تحليل:**

```javascript
async function addLabTest(data) {
    await addDoc(collection(db, 'patients', patientId, 'labTests'), {
        testName: data.testName,
        orderedAt: serverTimestamp(),
        status: "Ordered",
        orderedBy: currentStaff.name,
        createdAt: serverTimestamp()
    });
}
```

---

## 5️⃣ **التكامل مع Flutter**

### في Flutter، ستقرأ البيانات:

```dart
// Get Procedures
Stream<List<Procedure>> getProcedures(String patientId) {
  return FirebaseFirestore.instance
      .collection('patients')
      .doc(patientId)
      .collection('procedures')
      .orderBy('timestamp', descending: true)
      .snapshots()
      .map((snapshot) => snapshot.docs
          .map((doc) => Procedure.fromFirestore(doc))
          .toList());
}

// Get Medications
Stream<List<Medication>> getMedications(String patientId) {
  return FirebaseFirestore.instance
      .collection('patients')
      .doc(patientId)
      .collection('medications')
      .orderBy('timestamp', descending: true)
      .snapshots()
      .map((snapshot) => snapshot.docs
          .map((doc) => Medication.fromFirestore(doc))
          .toList());
}

// Get Lab Tests
Stream<List<LabTest>> getLabTests(String patientId) {
  return FirebaseFirestore.instance
      .collection('patients')
      .doc(patientId)
      .collection('labTests')
      .orderBy('orderedAt', descending: true)
      .snapshots()
      .map((snapshot) => snapshot.docs
          .map((doc) => LabTest.fromFirestore(doc))
          .toList());
}
```

---

## 6️⃣ **الخطوات التالية**

1. ✅ **إنشاء `patient-details.css`** (الكود أعلاه)
2. ✅ **إنشاء `patient-details.js`** (كامل مع جميع الوظائف)
3. ✅ **تحديث `dashboard.js`** لربط زر "View" بالصفحة الجديدة
4. ✅ **اختبار إضافة Procedure, Medication, Lab Test**
5. ✅ **التحقق من ظهورهم في Flutter**

---

## 🎯 النتيجة النهائية:

### **Web Dashboard سيكون قادر على:**
- ✅ إضافة/عرض الإجراءات الطبية
- ✅ إضافة/عرض الأدوية
- ✅ إضافة/عرض التحاليل
- ✅ تحديث العلامات الحيوية
- ✅ تحليل AI

### **Flutter App سيعرض:**
- ✅ جميع الإجراءات Real-time
- ✅ جميع الأدوية Real-time
- ✅ جميع التحاليل Real-time
- ✅ التقارير بالعربية

---

**هل تريد أن أكمل إنشاء الملفات الكاملة؟** 🚀
