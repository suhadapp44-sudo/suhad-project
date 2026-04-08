# هيكل بيانات Firestore لتطبيق Suhad

لضمان عمل التطبيق ولوحة التحكم بشكل صحيح، يرجى اتباع هيكل البيانات التالي عند إضافة المستندات في Firestore.

## 1. مجموعة المرضى (`patients`)

كل مستند يمثل مريضاً. معرف المستند (Document ID) هو `patientId` الذي يستخدم لتسجيل الدخول.

| الحقل | النوع | الوصف | مثال |
| :--- | :--- | :--- | :--- |
| `name` | String | اسم المريض الكامل | "سعيد عبدالله" |
| `mrn` | String | الرقم الطبي | "MRN-123456" |
| `room` | String | رقم الغرفة | "ICU-101" |
| `status` | String | الحالة العامة | "Stable" أو "Critical" |
| `admissionDate` | Timestamp | تاريخ الدخول | (تاريخ ووقت) |
| `diagnosis` | String | التشخيص | "Pneumonia" |
| `familyPhone` | String | رقم جوال العائلة (للدخول) | "0501234567" |
| `fcmTokens` | Array | رموز FCM للأجهزة المسجلة | `["token1", "token2"]` |

### الحقول المباشرة (العلامات الحيوية)
يجب أن تكون هذه الحقول في جذر المستند لتسهيل الوصول إليها وتحديثها.

| الحقل | النوع | مثال |
| :--- | :--- | :--- |
| `heartRate` | Number/String | 75 |
| `bloodPressure` | String | "120/80" |
| `oxygenLevel` | Number | 98 |
| `temperature` | Number | 37.2 |
| `respiratoryRate` | Number | 18 |

---

## 2. المجموعات الفرعية للمريض (`Subcollections`)

تحت كل مستند مريض (`patients/{patientId}`):

### أ. الأدوية (`medications`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم الدواء |
| `dosage` | String | الجرعة |
| `time` | String | وقت الإعطاء |
| `status` | String | `Scheduled`, `Given`, `Delayed` |

### ب. الإجراءات (`procedures`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم الإجراء |
| `time` | String | الوقت المقرر |
| `status` | String | `Pending`, `In Progress`, `Completed` |

### ج. نتائج المختبر (`labResults`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم التحليل (e.g. Hemoglobin) |
| `result` | String | النتيجة |
| `status` | String | `Normal` أو `Abnormal` |
| `date` | Timestamp | تاريخ التحليل |

### د. التنبيهات (`alerts`)
تستخدم لعرض الإشعارات والتنبيهات في التطبيق.
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `title` | String | عنوان التنبيه |
| `message` | String | نص التنبيه |
| `type` | String | `critical`, `lab`, `medication` |
| `timestamp` | Timestamp | وقت التنبيه |

### هـ. تقارير الذكاء الاصطناعي (`aiReports`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `summary` | String | ملخص الحالة |
| `riskLevel` | String | `Stable`, `High` |
| `timestamp` | Timestamp | وقت التقرير |

---

## 3. مجموعة الطاقم الطبي (`staff`)

| الحقل | النوع | الوصف | مثال |
| :--- | :--- | :--- | :--- |
| `name` | String | اسم الموظف | "د. محمد علي" |
| `role` | String | المسمى الوظيفي | "استشاري عناية مركزة" |
| `specialty` | String | التخصص | "ICU" |

---

**ملاحظة:** تأكد من أن قواعد الأمان (Firestore Rules) تسمح بالقراءة والكتابة لهذه المجموعات أثناء التطوير.
