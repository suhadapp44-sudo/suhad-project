# 🚀 دليل الإعداد السريع - Suhad System

## ✅ قائمة المهام

### 1️⃣ إعداد Firebase (20 دقيقة)

- [ ] إنشاء مشروع Firebase جديد
- [ ] تفعيل Authentication (Email + Phone)
- [ ] تفعيل Firestore
- [ ] تفعيل Cloud Messaging
- [ ] إضافة تطبيق Android
- [ ] تحميل `google-services.json` ووضعه في `android/app/`
- [ ] إضافة تطبيق Web
- [ ] نسخ Firebase Config

### 2️⃣ Firebase Configuration

#### في Firebase Console:

**أ) Authentication:**
```
1. Authentication → Sign-in method
2. فعّل "Email/Password"
3. فعّل "Phone"
4. احفظ
```

**ب) Firestore Database:**
```
1. Firestore Database → Create database
2. Start in production mode
3. اختر المنطقة القريبة منك
```

**ج) Cloud Messaging:**
```
1. تلقائياً مفعّل
2. Web Push Certificates → Generate key pair
3. احفظ الـ Key
```

### 3️⃣ إنشاء حساب الموظف الأول

**في Firebase Console → Authentication:**

```
Email: admin@hospital.com
Password: Hospital@123
```

احفظ الـ **UID** الذي تم إنشاؤه

**في Firestore → staff → Add Document:**

Document ID: `[استخدم نفس الـ UID من الخطوة السابقة]`

```json
{
  "email": "admin@hospital.com",
  "name": "مدير النظام",
  "role": "admin",
  "department": "Administration",
  "createdAt": "2026-02-03T00:00:00Z"
}
```

### 4️⃣ Firestore Security Rules

انسخ والصق في **Firestore → Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isStaff() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/staff/$(request.auth.uid));
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /staff/{staffId} {
      allow read: if isStaff();
      allow write: if isStaff() && 
                      get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /patients/{patientId} {
      allow write: if isStaff();
      allow read: if isStaff() || 
                     (isAuthenticated() && 
                      patientId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.patients);
      
      match /aiReports/{reportId} {
        allow read: if isStaff() || 
                       (isAuthenticated() && 
                        patientId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.patients);
        allow write: if isStaff();
      }
      
      match /medications/{medId} {
        allow read: if isStaff();
        allow write: if isStaff();
      }
    }
    
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow write: if isStaff();
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

**اضغط "Publish"**

### 5️⃣ الحصول على Gemini API Key

1. اذهب إلى: https://makersuite.google.com/app/apikey
2. سجل دخول بحساب Google
3. Create API Key → Create API key in new project
4. انسخ الـ API Key المُنشأ

### 6️⃣ تحديث ملفات JavaScript

#### أ) افتح: `hospital_dashboard/js/login.js`

**ابحث عن:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    ...
```

**استبدل بـ:** (Firebase Config من Firebase Console → Project Settings → Web App)
```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123:web:abc..."
};
```

#### ب) كرر نفس الخطوة في:
- `hospital_dashboard/js/dashboard.js`
- `hospital_dashboard/js/patient-edit.js`

#### ج) في `hospital_dashboard/js/patient-edit.js`:

**ابحث عن:**
```javascript
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
```

**استبدل بـ:**
```javascript
const GEMINI_API_KEY = 'AIza...'; // المفتاح من الخطوة 5
```

### 7️⃣ تشغيل لوحة التحكم

**Option 1: Python**
```bash
cd hospital_dashboard
python -m http.server 8000
```

**Option 2: Node.js**
```bash
cd hospital_dashboard
npx serve
```

**Option 3: VSCode Live Server**
1. تثبيت Extension "Live Server"
2. Right-click على `login.html` → Open with Live Server

**افتح المتصفح:** `http://localhost:8000/login.html`

**تسجيل الدخول:**
- Email: `admin@hospital.com`
- Password: `Hospital@123`

### 8️⃣ إضافة مريض تجريبي

**في Dashboard → إضافة مريض جديد:**

```
رقم المريض: P001
الاسم: أحمد التجريبي
الغرفة: ICU-01
هاتف العائلة: +966501234567
التشخيص: حالة اختبارية

العلامات الحيوية:
- معدل القلب: 85
- ضغط الدم: 120/80
- الأكسجين: 98
- الحرارة: 37.0
```

**اضغط "تحليل بالذكاء الاصطناعي"** ← يجب أن يظهر تقرير

**احفظ**

### 9️⃣ اختبار الذكاء الاصطناعي

**جرب حالة حرجة:**

```
معدل القلب: 140 (مرتفع)
ضغط الدم: 90/60 (منخفض)
الأكسجين: 85 (منخفض)
الحرارة: 38.5 (حمى)
```

**اضغط "تحليل" ← يجب أن يظهر:**
- الحالة: حرجة 🚨
- مستوى الخطورة: 8-9
- التقرير بالعربية
- "سيتم إرسال إشعار للعائلة"

### 🔟 إعداد Flutter App (قريباً)

```bash
cd ../
flutter pub get
flutter run
```

---

## 🐛 حل المشاكل الشائعة

### ❌ خطأ: "User not authorized"

**الحل:**
- تأكد أن الـ UID في `staff` collection يطابق الـ UID في Authentication
- تحقق من Security Rules

### ❌ خطأ: "Failed to fetch from Gemini"

**الحل:**
- تحقق من صحة الـ API Key
- تأكد من وجود اتصال بالإنترنت
- تحقق من Console للأخطاء

### ❌ الصفحة فارغة

**الحل:**
- افتح Developer Tools → Console
- تحقق من الأخطاء
- تأكد من Firebase Config صحيح

### ❌ "Permission denied" في Firestore

**الحل:**
- تحقق من Security Rules
- تأكد أن المستخدم مسجل دخول
- تحقق من وجود document في `staff` collection

---

## ✅ التحقق من النجاح

### يجب أن تكون قادراً على:

- [x] تسجيل الدخول في لوحة التحكم
- [x] رؤية Dashboard
- [x] إضافة مريض جديد
- [x] تحديث العلامات الحيوية
- [x] الحصول على تحليل AI بالعربية
- [x] حفظ البيانات في Firestore
- [x] رؤية التحديثات في Console

---

## 📊 البيانات في Firestore يجب أن تبدو هكذا:

```
📦 Firestore
│
├── staff/
│   └── [UID]/
│       ├── email: "admin@hospital.com"
│       ├── name: "مدير النظام"
│       └── role: "admin"
│
├── patients/
│   └── P001/
│       ├── name: "أحمد التجريبي"
│       ├── status: "stable"
│       ├── heartRate: 85
│       └── ...
│       │
│       └── aiReports/
│           └── [auto-id]/
│               ├── status: "stable"
│               ├── arabicSummary: "..."
│               └── alertLevel: 2
│
└── notifications/
    └── [auto-id]/
        ├── userId: "..."
        ├── patientId: "P001"
        └── message: "..."
```

---

## 🎉 أنت الآن جاهز!

**الخطوات التالية:**
1. إنشاء المزيد من حسابات الموظفين
2. إضافة المزيد من المرضى
3. تفعيل الإشعارات في التطبيق
4. تخصيص التصميم حسب احتياجاتك

**وقت الإعداد الإجمالي:** 30-45 دقيقة

---

**💡 نصيحة:** احفظ هذا الملف للرجوع إليه عند الحاجة!
