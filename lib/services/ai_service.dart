import 'dart:convert';
import 'package:http/http.dart' as http;

class AIService {
  // DeepSeek API Configuration with your provided key
  static const String _apiKey = "sk-cb3bb72e3e0c4522a33a53d7689bb56d";
  static const String _baseUrl = "https://api.deepseek.com/v1/chat/completions";

  // Doctor Agent Persona Configuration
  static const String _doctorName = "د. سهاد";
  static const String _doctorSpecialty = "استشارية الطب الباطني والعناية المركزة";

  // System prompts for different contexts
  static const String _doctorSystemPromptAR = """
أنت د. سهاد، استشارية طب باطني.

قدمي إجابات قصيرة جداً ومباشرة (3-5 أسطر كحد أقصى).
لا تكتبي مقدمات طويلة.
لا تكرري المعلومات.
ركزي فقط على النقاط الطبية المهمة.
إذا كان الرد طويلاً، اختصريه بشدة.
استخدمي جمل واضحة ومختصرة.
""";

  static const String _doctorSystemPromptEN = """
You are Dr. Suhad, Internal Medicine Consultant.

Provide very short and direct answers (max 3-5 lines).
No long introductions.
No repetition.
Focus only on key medical points.
Be clear and concise.
If response becomes long, summarize it strongly.
""";


  /// Sends a prompt to DeepSeek AI and returns the response string.
  static Future<String> getAIResponse(String prompt, {bool isArabic = true}) async {
    if (_apiKey.isEmpty || _apiKey == "YOUR_DEEPSEEK_API_KEY_HERE") {
      return isArabic
          ? "يرجى تهيئة مفتاح API لتفعيل المساعد الطبي."
          : "Please configure the API key to activate the medical assistant.";
    }

    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
        },
        body: jsonEncode({
          "model": "deepseek-chat",
          "messages": [
            {
              "role": "system",
              "content": isArabic ? _doctorSystemPromptAR : _doctorSystemPromptEN
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.7,
          "max_tokens": 1000,
          "top_p": 0.95,
          "frequency_penalty": 0,
          "presence_penalty": 0
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        // Log the error for debugging
        print('DeepSeek API Error: ${response.statusCode} - ${response.body}');

        final errorMsg = isArabic
            ? "عذراً، حدث خطأ في الاتصال بالمساعد الطبي. (خطأ: ${response.statusCode})"
            : "Sorry, an error occurred connecting to the medical assistant. (Error: ${response.statusCode})";
        return errorMsg;
      }
    } catch (e) {
      // Log the exception
      print('Exception in getAIResponse: $e');

      return isArabic
          ? "عذراً، تعذر الوصول إلى المساعد الطبي حالياً. يرجى التحقق من اتصال الإنترنت."
          : "Sorry, unable to reach the medical assistant. Please check your internet connection.";
    }
  }

  static Future<String> getPatientSummary(Map<String, dynamic> data, List<String> meds, List<String> labs, List<String> procedures, {bool isArabic = true}) async {
    final prompt = createSummaryPrompt(data, meds, labs, procedures, isArabic);
    final response = await getAIResponse(prompt, isArabic: isArabic);

    // Add doctor signature if response doesn't already have it
    if (!response.contains(_doctorName)) {
      return response + getDoctorSignature(isArabic);
    }
    return response;
  }

  /// Generates an expert doctor response to family questions
  static Future<String> getChatResponse(String userQuestion, Map<String, dynamic> data, List<String> meds, List<String> labs, List<String> procedures, {bool isArabic = true}) async {
    final prompt = createChatPrompt(userQuestion, data, meds, labs, procedures, isArabic);
    final response = await getAIResponse(prompt, isArabic: isArabic);

    // Add doctor signature if response doesn't already have it
    if (!response.contains(_doctorName)) {
      return response + getDoctorSignature(isArabic);
    }
    return response;
  }

  static Future<String> getMedicalAlert(Map<String, dynamic> data, String changeType, dynamic oldValue, dynamic newValue, {bool isArabic = true}) async {
    final prompt = createMedicalAlertPrompt(data, changeType, oldValue, newValue, isArabic);
    final response = await getAIResponse(prompt, isArabic: isArabic);

    // Add doctor signature for alerts
    return response + getDoctorSignature(isArabic);
  }

  /// Creates a summary prompt for the doctor
  static String createSummaryPrompt(Map<String, dynamic> data, List<String> meds, List<String> labs, List<String> procedures, bool isArabic) {
    final name = data['name'] ?? (isArabic ? 'المريض' : 'the patient');
    final status = data['status'] ?? 'stable';
    final admissionDate = data['admissionDate'] ?? 'today';
    final diagnosis = data['diagnosis'] ?? (isArabic ? 'قيد التقييم' : 'under evaluation');

    String vitals = "";
    if (data.containsKey('bloodPressure') || data.containsKey('heartRate') ||
        data.containsKey('temperature') || data.containsKey('oxygenLevel')) {
      vitals = "BP: ${data['bloodPressure'] ?? 'N/A'}, HR: ${data['heartRate'] ?? 'N/A'}, " +
               "Temp: ${data['temperature'] ?? 'N/A'}°C, O2: ${data['oxygenLevel'] ?? 'N/A'}%";
    }

    // Add risk assessment based on vitals
    final riskLevel = _assessRiskLevel(data);

    if (isArabic) {
      return """
      كـ $_doctorSpecialty، قومي بإعداد تقرير موجز لعائلة المريض $name.
      
      البيانات السريرية الحالية:
      - التشخيص: $diagnosis
      - تاريخ الدخول: $admissionDate
      - الحالة العامة: $status
      - مستوى الخطورة: $riskLevel
      - العلامات الحيوية: ${vitals.isNotEmpty ? vitals : 'غير متوفرة'}
      - الأدوية الموصوفة: ${meds.isEmpty ? 'لا توجد أدوية حالية' : meds.join('، ')}
      - نتائج المختبر: ${labs.isEmpty ? 'لا توجد نتائج مختبر حديثة' : labs.join('، ')}
      - الإجراءات الطبية: ${procedures.isEmpty ? 'لا توجد إجراءات حالية' : procedures.join('، ')}
      
      التعليمات المهنية للتقرير:
      1. ابدئي بمقدمة مهنية تشرح حالتك كطبيبة معالجة
      2. اشرحي الحالة الحالية للمريض بلغة واضحة ومطمئنة
      3. إذا كانت هناك نتائج مختبر غير طبيعية، اشرحي دلالتها الطبية بإيجاز
      4. تحدثي عن خطة العلاج الحالية والأدوية المستخدمة
      5. قدمي توجيهات محددة للعائلة حول كيفية المساعدة في رعاية المريض
      6. اختتمي بجملة مطمئنة مع تقدير زمني للمتابعة القادمة
      
      ملاحظة: استخدمي لغة مهنية مع شرح المصطلحات الطبية، وحافظي على نبرة مطمئنة مع الشفافية.
      """;
    } else {
      return """
      As $_doctorSpecialty, prepare a comprehensive report for the family of patient $name.
      
      Current Clinical Data:
      - Diagnosis: $diagnosis
      - Admission Date: $admissionDate
      - General Status: $status
      - Risk Level: $riskLevel
      - Vital Signs: ${vitals.isNotEmpty ? vitals : 'Not available'}
      - Current Medications: ${meds.isEmpty ? 'No current medications' : meds.join(', ')}
      - Lab Results: ${labs.isEmpty ? 'No recent lab results' : labs.join(', ')}
      - Medical Procedures: ${procedures.isEmpty ? 'No current procedures' : procedures.join(', ')}
      
      Professional Reporting Guidelines:
      1. Start with a professional introduction explaining your role as the attending physician
      2. Explain the current patient condition in clear, reassuring language
      3. If there are abnormal lab results, briefly explain their medical significance
      4. Discuss the current treatment plan and medications used
      5. Provide specific guidance for the family on how to assist in patient care
      6. Conclude with a reassuring statement and estimated time for next follow-up
      
      Note: Use professional language while explaining medical terms, maintain a reassuring tone with transparency.
      """;
    }
  }

  /// Creates a chat prompt for the doctor
  static String createChatPrompt(String userQuestion, Map<String, dynamic> data, List<String> meds, List<String> labs, List<String> procedures, bool isArabic) {
    final name = data['name'] ?? (isArabic ? 'المريض' : 'the patient');
    final diagnosis = data['diagnosis'] ?? (isArabic ? 'قيد التقييم' : 'under evaluation');
    final riskLevel = _assessRiskLevel(data);

    final clinicalContext = """
    Clinical Summary:
    - Patient: $name
    - Diagnosis: $diagnosis
    - Risk Assessment: $riskLevel
    - Vital Signs: BP: ${data['bloodPressure'] ?? 'N/A'}, HR: ${data['heartRate'] ?? 'N/A'}, O2: ${data['oxygenLevel'] ?? 'N/A'}%
    - Active Medications: ${meds.isEmpty ? 'None' : meds.join(', ')}
    - Recent Labs: ${labs.isEmpty ? 'None' : labs.join(', ')}
    - Current Procedures: ${procedures.isEmpty ? 'None' : procedures.join(', ')}
    """;

    if (isArabic) {
      return """
      بصفتك $_doctorSpecialty، أنت تجيبين على سؤال من عائلة المريض.
      
      السياق الطبي الحالي:
      $clinicalContext
      
      سؤال العائلة: "$userQuestion"
      
      إرشادات الرد المهني:
      1. قيمي السؤال من الناحية الطبية وحددي مدى خطورته
      2. قدمي إجابة دقيقة بناءً على البيانات السريرية المتاحة
      3. إذا كان السؤال يتطلب تدخلاً فورياً، وجهي العائلة للإجراء المناسب
      4. اشرحي المصطلحات الطبية المعقدة بلغة مبسطة
      5. إذا كان السؤال خارج نطاق تخصصك أو يحتاج لاستشارة أخصائي آخر، انصحي بذلك
      6. حافظي على سرية المعلومات الطبية ولا تذكري أي بيانات خاصة
      
      مهم جداً: كوني دقيقة، مهنية، ومطمئنة في ردودك. إذا كانت هناك أي علامات خطر، أخبري العائلة بذلك بلباقة مع توجيههم للإجراءات المناسبة.
      
      الرد المطلوب:
      """;
    } else {
      return """
      As $_doctorSpecialty, you are answering a question from the patient's family.
      
      Current Medical Context:
      $clinicalContext
      
      Family Question: "$userQuestion"
      
      Professional Response Guidelines:
      1. Assess the question medically and determine its urgency
      2. Provide accurate answers based on available clinical data
      3. If the question requires immediate intervention, guide the family to appropriate actions
      4. Explain complex medical terms in simple language
      5. If the question is outside your specialty or requires another specialist's consultation, advise accordingly
      6. Maintain patient confidentiality and avoid sharing any private data
      
      Very important: Be accurate, professional, and reassuring in your responses. If there are any signs of danger, inform the family tactfully while guiding them to appropriate actions.
      
      Required Response:
      """;
    }
  }

  /// Creates a medical alert prompt
  static String createMedicalAlertPrompt(Map<String, dynamic> data, String changeType, dynamic oldValue, dynamic newValue, bool isArabic) {
    final name = data['name'] ?? (isArabic ? 'المريض' : 'the patient');
    final time = DateTime.now().toString().substring(0, 16);

    if (isArabic) {
      return """
      كـ $_doctorSpecialty، قومي بإصدار تنبيه طبي عاجل لعائلة المريض $name.
      
      تفاصيل التنبيه:
      - الوقت: $time
      - نوع التغيير: $changeType
      - القيمة السابقة: $oldValue
      - القيمة الحالية: $newValue
      
      المتطلبات المهنية للتنبيه:
      1. اشرحي طبيعة التغيير ودلالته الطبية
      2. قيمي درجة الخطورة والإجراءات المتخذة
      3. طمئني العائلة مع الشفافية
      4. حددي الخطوات التالية في خطة العلاج
      5. قدمي تعليمات واضحة للعائلة
      
      المطلوب: تنبيه طبي مهني موجز ولكن شامل.
      """;
    } else {
      return """
      As $_doctorSpecialty, issue an urgent medical alert for the family of patient $name.
      
      Alert Details:
      - Time: $time
      - Type of Change: $changeType
      - Previous Value: $oldValue
      - Current Value: $newValue
      
      Professional Alert Requirements:
      1. Explain the nature of the change and its medical significance
      2. Assess the level of risk and actions being taken
      3. Reassure the family while maintaining transparency
      4. Specify the next steps in the treatment plan
      5. Provide clear instructions for the family
      
      Required: A concise but comprehensive professional medical alert.
      """;
    }
  }

  /// Helper method to assess patient risk level based on vital signs
  static String _assessRiskLevel(Map<String, dynamic> data) {
    try {
      final bp = data['bloodPressure']?.toString() ?? '';
      final hr = int.tryParse(data['heartRate']?.toString() ?? '0') ?? 0;
      final o2 = int.tryParse(data['oxygenLevel']?.toString() ?? '0') ?? 0;
      final temp = double.tryParse(data['temperature']?.toString() ?? '0') ?? 0;

      // Critical conditions
      if (hr > 130 || hr < 40 || o2 < 85 || temp > 39.5 || temp < 35.0) {
        return 'Critical - Requires Immediate Attention';
      }

      // Moderate conditions
      if (hr > 100 || hr < 60 || o2 < 92 || temp > 38.5 || temp < 36.0) {
        return 'Moderate - Requires Close Monitoring';
      }

      // Check BP
      if (bp.contains('180') || bp.contains('90') || bp.contains('50')) {
        return 'Elevated Risk - Monitor Vital Signs';
      }

      return 'Stable - Routine Care';
    } catch (e) {
      return 'Unable to Assess - Consult Physician';
    }
  }

  /// Get doctor's professional signature
  static String getDoctorSignature(bool isArabic) {
    if (isArabic) {
      return "\n\n---\nمع تمنياتي بالشفاء العاجل،\n$_doctorName\n$_doctorSpecialty";
    } else {
      return "\n\n---\nWishing a speedy recovery,\n$_doctorName\n$_doctorSpecialty";
    }
  }

  /// Check if the API key is valid (simple check)
  static bool isApiKeyValid() {
    return _apiKey.isNotEmpty &&
           _apiKey != "YOUR_DEEPSEEK_API_KEY_HERE" &&
           _apiKey.startsWith('sk-');
  }
}
