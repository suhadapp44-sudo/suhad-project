// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
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

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');
const isNewPatient = urlParams.get('new') === 'true';

let currentPatient = null;

// Check authentication and load patient
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (patientId) {
        if (isNewPatient) {
            // New patient - just set the ID
            currentPatient = {
                id: patientId,
                name: '',
                room: '',
                unit: '',
                age: '',
                familyPhone: '',
                diagnosis: ''
            };
            // Set the ID in the form
            document.getElementById('patientId').value = patientId;
        } else {
            // Existing patient - load from Firestore
            await loadPatientData(patientId);
        }
    }
});

// Load Patient Data
async function loadPatientData(id) {
    try {
        const patientDoc = await getDoc(doc(db, 'patients', id));

        if (!patientDoc.exists()) {
            // Patient doesn't exist - this is a new patient
            console.log('New patient - no data to load');
            currentPatient = {
                id: id,
                name: '',
                room: '',
                unit: '',
                age: '',
                familyPhone: '',
                diagnosis: ''
            };
            document.getElementById('patientId').value = id;
            return;
        }

        currentPatient = { id: patientDoc.id, ...patientDoc.data() };
        populateForm(currentPatient);

    } catch (error) {
        console.error('Error loading patient:', error);
        // On error, treat as new patient
        currentPatient = {
            id: id,
            name: '',
            room: '',
            unit: '',
            age: '',
            familyPhone: '',
            diagnosis: ''
        };
        document.getElementById('patientId').value = id;
    }
}

// Populate Form
function populateForm(patient) {
    document.getElementById('patientId').value = patient.id;
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('age').value = patient.age || '';
    document.getElementById('unit').value = patient.unit || '';
    document.getElementById('room').value = patient.room || '';
    document.getElementById('familyPhone').value = patient.familyPhone || '';
    document.getElementById('diagnosis').value = patient.diagnosis || '';
    document.getElementById('gender').value = patient.gender || '';

    // Handle admissionDate (convert Timestamp to datetime-local string)
    if (patient.admissionDate) {
        const date = patient.admissionDate.toDate ? patient.admissionDate.toDate() : new Date(patient.admissionDate);
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('admissionDate').value = localDate;
    }

    // Show view status button for existing patients
    const viewStatusBtn = document.getElementById('viewStatusBtn');
    if (viewStatusBtn) {
        viewStatusBtn.style.display = 'flex';
        viewStatusBtn.onclick = () => window.location.href = `patient-status.html?id=${patient.id}`;
    }
}

// Save Patient Data
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.querySelector('span').textContent;
    saveBtn.disabled = true;
    saveBtn.querySelector('span').textContent = 'جاري الحفظ...';

    try {
        const patientData = {
            name: document.getElementById('patientName').value,
            age: document.getElementById('age').value,
            unit: document.getElementById('unit').value,
            room: document.getElementById('room').value,
            familyPhone: document.getElementById('familyPhone').value,
            diagnosis: document.getElementById('diagnosis').value,
            gender: document.getElementById('gender').value,
            admissionDate: new Date(document.getElementById('admissionDate').value),
            lastUpdate: serverTimestamp()
        };

        // Update patient document
        await setDoc(doc(db, 'patients', patientId), patientData, { merge: true });

        alert('تم حفظ البيانات بنجاح!');
        // Keep user on page or go back? Usually go back or stay.
        // Let's go back to dashboard as typical flow
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Save error:', error);
        alert('حدث خطأ أثناء الحفظ');
        saveBtn.disabled = false;
        saveBtn.querySelector('span').textContent = originalText;
    }
});
