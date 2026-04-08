// ========================================
// FIREBASE CONFIGURATION TEMPLATE
// ========================================
// 
// انسخ هذا الملف إلى config.js وحدث القيم
// لا تشارك هذا الملف مع أحد!
//
// ========================================

export const firebaseConfig = {
    // احصل على هذه القيم من:
    // Firebase Console → Project Settings → Your apps → Web app

    apiKey: "AIzaSyCJXl3lOaTuxTW9S1rE9jLtk4LvK-7kFBg",
    authDomain: "suhad-80c82.firebaseapp.com",
    projectId: "suhad-80c82",
    storageBucket: "suhad-80c82.firebasestorage.app",
    messagingSenderId: "527713675665",
    appId: "1:527713675665:web:94c69d4777b0755363d230",
    measurementId: "G-RT1CJ94F58"
};

export const geminiConfig = {
    // احصل على API Key من:
    // https://makersuite.google.com/app/apikey

    apiKey: "AIzaSyCX3dZrY7ZtR3--6UqNqbKa7-ey8jZM3IM",

    // API URL (لا تغيره)
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
};

// ========================================
// مثال على القيم الصحيحة:
// ========================================
//
// apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
// authDomain: "suhad-hospital.firebaseapp.com"
// projectId: "suhad-hospital"
// storageBucket: "suhad-hospital.appspot.com"
// messagingSenderId: "123456789012"
// appId: "1:123456789012:web:abcdef123456"
//
// ========================================

// Testing Credentials (للتطوير فقط)
export const testCredentials = {
    email: "admin@hospital.com",
    password: "Hospital@123"
};

// Sample Patient Data (للاختبار)
export const samplePatient = {
    id: "P001",
    name: "أحمد اختبار",
    room: "ICU-01",
    familyPhone: "+966501234567",
    diagnosis: "حالة اختبارية",
    vitals: {
        heartRate: 85,
        bloodPressure: "120/80",
        oxygenLevel: 98,
        temperature: 37.0
    }
};
