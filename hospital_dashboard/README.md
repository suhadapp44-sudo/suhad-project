# 🏥 Suhad Hospital Management System

نظام متكامل لإدارة مرضى العناية المركزة مع ذكاء اصطناعي متقدم

---

## 📋 نظرة عامة

نظام **سُهاد** هو منصة شاملة تتكون من:

1. **🌐 لوحة تحكم ويب للمستشفى** - لإدارة بيانات المرضى
2. **📱 تطبيق موبايل للعائلات** - لمتابعة حالة المريض
3. **🤖 محرك ذكاء اصطناعي** - لتحليل البيانات وإرسال التقارير

---

## 🚀 البدء السريع

### 1️⃣ إعداد Firebase

#### أ) إنشاء مشروع Firebase:
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. فعّل **Authentication** (Phone Number & Email/Password)
4. فعّل **Cloud Firestore**
5. فعّل **Cloud Messaging**

#### ب) إضافة التطبيقات:
1. **Android App:**
   - أضف تطبيق Android
   - حمّل `google-services.json`
   - ضعه في `android/app/`

2. **Web App:**
   - أضف تطبيق Web
   - احفظ Firebase Config

#### ج) إعداد Firestore Database:

قم بإنشاء المجموعات (Collections) التالية:

```
📦 Firestore Database
│
├── 👥 users/
│   └── {userId}/
│       ├── phoneNumber: "+966XXXXXXXXX"
│       ├── name: "اسم العائلة"
│       ├── fcmToken: "token..."
│       ├── patients: ["P001"]
│       └── createdAt: timestamp
│
├── 👨‍⚕️ staff/
│   └── {staffId}/
│       ├── email: "nurse@hospital.com"
│       ├── name: "Sarah Ali"
│       ├── role: "nurse"
│       └── department: "ICU"
│
├── 🏥 patients/
│   └── {patientId}/
│       ├── name: "Ahmed Al-Sayed"
│       ├── room: "ICU-04"
│       ├── status: "critical|warning|stable"
│       ├── heartRate: 115
│       ├── bloodPressure: "120/80"
│       ├── oxygenLevel: 98
│       ├── temperature: 37.5
│       ├── familyPhone: "+966XXXXXXXXX"
│       ├── diagnosis: "..."
│       ├── lastUpdate: timestamp
│       │
│       ├── 🤖 aiReports/ (subcollection)
│       │   └── {reportId}/
│       │       ├── timestamp
│       │       ├── status
│       │       ├── arabicSummary
│       │       ├── alertLevel
│       │       └── vitals: {...}
│       │
│       └── 💊 medications/ (subcollection)
│           └── {medId}/
│               ├── name
│               ├── dose
│               └── timestamp
│
└── 🔔 notifications/
    └── {notificationId}/
        ├── userId
        ├── patientId
        ├── title
        ├── message
        ├── status
        ├── sentAt
        └── read: false
```

#### د) Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Staff collection - only staff can access
    match /staff/{staffId} {
      allow read, write: if request.auth != null && 
                            exists(/databases/$(database)/documents/staff/$(request.auth.uid));
    }
    
    // Patients - staff can write, families can read their own
    match /patients/{patientId} {
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/staff/$(request.auth.uid));
      
      allow read: if request.auth != null && (
        exists(/databases/$(database)/documents/staff/$(request.auth.uid)) ||
        patientId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.patients
      );
      
      // AI Reports subcollection
      match /aiReports/{reportId} {
        allow read: if request.auth != null;
        allow write: if exists(/databases/$(database)/documents/staff/$(request.auth.uid));
      }
    }
    
    // Users - only owner can access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if exists(/databases/$(database)/documents/staff/$(request.auth.uid));
    }
  }
}
```

---

### 2️⃣ إعداد Gemini AI

1. احصل على API Key من [Google AI Studio](https://makersuite.google.com/app/apikey)
2. في ملف `hospital_dashboard/js/patient-edit.js`:
   ```javascript
   const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```

---

### 3️⃣ إعداد لوحة التحكم الويب

#### أ) تحديث Firebase Config:

افتح جميع ملفات JavaScript في `hospital_dashboard/js/` وحدث:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

#### ب) إنشاء حساب موظف:

استخدم Firebase Console لإضافة:

1. **Authentication → Add User:**
   - Email: `nurse@hospital.com`
   - Password: `Test123456`

2. **Firestore → staff → Add Document:**
   ```json
   {
     "email": "nurse@hospital.com",
     "name": "ممرضة الاختبار",
     "role": "nurse",
     "department": "ICU"
   }
   ```
   **Note:** Document ID يجب أن يكون نفس الـ UID من Authentication

#### ج) تشغيل الموقع:

```bash
cd hospital_dashboard
# استخدم أي server محلي، مثال:
python -m http.server 8000
# أو
npx serve
```

افتح: `http://localhost:8000/login.html`

---

### 4️⃣ إعداد تطبيق Flutter

#### أ) إضافة Firebase Dependencies:

في `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  firebase_messaging: ^14.7.10
```

```bash
flutter pub get
```

#### ب) تحديث Android Configuration:

في `android/app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")  // أضف هذا
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
}
```

في `android/build.gradle.kts`:

```kotlin
plugins {
    id("com.google.gms.google-services") version "4.4.0" apply false
}
```

#### ج) إضافة `google-services.json`:

تأكد أن الملف موجود في: `android/app/google-services.json`

---

## 📖 كيفية الاستخدام

### 🖥️ لوحة التحكم (للموظفين):

1. **تسجيل الدخول:**
   - افتح `login.html`
   - أدخل البريد وكلمة المرور

2. **إضافة مريض جديد:**
   - من Dashboard → "إضافة مريض جديد"
   - أدخل البيانات الأساسية
   - احفظ

3. **تحديث العلامات الحيوية:**
   - اضغط على "تحديث" بجانب المريض
   - أدخل العلامات الحيوية الجديدة
   - اضغط "تحليل بالذكاء الاصطناعي"
   - سيظهر التقرير تلقائياً
   - احفظ التحديثات

4. **النتيجة:**
   - يتم حفظ البيانات في Firestore
   - يتم إرسال إشعار للعائلة (إذا كان alertLevel >= 5)
   - يحدث التطبيق تلقائياً

### 📱 التطبيق (للعائلات):

1. **تسجيل الدخول:**
   - رقم الهاتف + OTP

2. **عرض المرضى:**
   - قائمة بالمرضى المرتبطين

3. **عرض التفاصيل:**
   - العلامات الحيوية
   - تقرير الذكاء الاصطناعي بالعربية المبسطة
   - الأدوية والإجراءات

4. **الإشعارات:**
   - تصل تلقائياً عند التحديثات المهمة

---

## 🤖 كيف يعمل الذكاء الاصطناعي؟

### التدفق الكامل:

```
1. الممرضة تدخل العلامات الحيوية في لوحة التحكم
         ↓
2. تضغط "تحليل بالذكاء الاصطناعي"
         ↓
3. يتم إرسال البيانات إلى Gemini API
         ↓
4. Gemini يحلل:
   - معدل القلب
   - ضغط الدم
   - مستوى الأكسجين
   - درجة الحرارة
   - التاريخ الطبي
         ↓
5. Gemini يرجع:
   {
     "status": "stable|warning|critical",
     "arabicSummary": "تقرير بالعربية مبسط",
     "alertLevel": 7,
     "shouldNotify": true,
     "recommendations": [...]
   }
         ↓
6. يعرض التقرير في الصفحة
         ↓
7. عند الحفظ:
   - يحفظ في Firestore
   - إذا shouldNotify = true → إشعار للعائلة
         ↓
8. العائلة تستلم الإشعار وترى التقرير في التطبيق
```

---

## 🔔 إعداد الإشعارات (FCM)

### للموبايل:

1. في `main.dart`:
```dart
await Firebase.initializeApp();

// Request permission
NotificationSettings settings = await FirebaseMessaging.instance.requestPermission();

// Get FCM token
String? token = await FirebaseMessaging.instance.getToken();

// Save to Firestore
await FirebaseFirestore.instance.collection('users').doc(userId).set({
  'fcmToken': token,
}, SetOptions(merge: true));
```

2. Listen to notifications:
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // Show notification
});
```

---

## 🧪 الاختبار

### 1. إنشاء بيانات اختبارية:

في Firestore Console، أضف:

**Patient P001:**
```json
{
  "name": "Ahmed Test",
  "room": "ICU-01",
  "status": "stable",
  "heartRate": 85,
  "bloodPressure": "120/80",
  "oxygenLevel": 98,
  "temperature": 37.0,
  "familyPhone": "+966501234567",
  "diagnosis": "Test case",
  "lastUpdate": "2026-02-03T00:00:00Z"
}
```

**Family User:**
```json
{
  "phoneNumber": "+966501234567",
  "name": "Test Family",ع
  "patients": ["P001"],
  "fcmToken": "will_be_added_by_app"
}
```

### 2. اختبار السيناريو الكامل:

1. سجل دخول في لوحة التحكم
2. حدث بيانات المريض P001
3. أدخل علامات حرجة:
   - Heart Rate: 140
   - Oxygen: 85
4. اضغط "تحليل بالذكاء الاصطناعي"
5. تأكد أن التقرير يظهر بحالة "critical"
6. احفظ
7. تحقق من Firestore:
   - `patients/P001` محدث
   - `patients/P001/aiReports` يحتوي على التقرير
   - `notifications` يحتوي على الإشعار

---

## 📁 هيكل الملفات

```
suhad/
├── hospital_dashboard/          # لوحة التحكم الويب
│   ├── login.html
│   ├── dashboard.html
│   ├── patient-edit.html
│   ├── css/
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   └── patient-edit.css
│   └── js/
│       ├── login.js
│       ├── dashboard.js
│       └── patient-edit.js       # محرك الذكاء الاصطناعي
│
├── lib/                          # تطبيق Flutter
│   ├── main.dart
│   ├── screens/
│   ├── services/
│   │   └── firebase_his_service.dart  # سيتم إنشاؤه
│   └── models/
│
└── android/
    └── app/
        └── google-services.json
```

---

## 🔐 الأمان

✅ Firebase Authentication  
✅ Firestore Security Rules  
✅ Phone Verification (OTP)  
✅ Role-based Access Control  
✅ HTTPS Only  
✅ Token Validation  

---

## 🎨 المميزات

✅ تصميم عصري واحترافي  
✅ دعم كامل للغة العربية (RTL)  
✅ تحديثات فورية (Real-time)  
✅ ذكاء اصطناعي متقدم  
✅ إشعارات Push  
✅ Responsive Design  
✅ Dark Mode Ready  
✅ PWA Compatible  

---

## 📞 الدعم

للمساعدة أو الاستفسارات، راجع الوثائق:
- [Firebase Docs](https://firebase.google.com/docs)
- [Flutter Docs](https://flutter.dev/docs)
- [Gemini AI Docs](https://ai.google.dev/docs)

---

## 📄 الترخيص

© 2026 Suhad Hospital Management System
