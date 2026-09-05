/* =========================================================================
   Zainpreneur Agency — i18n scaffolding (SRS v2 §11 i18n/RTL)
   Central string registry with English + Arabic buckets. Pages render
   through t(key); adding Urdu (or any locale) means adding one bucket —
   no UI changes. Language pref lives on the customer record (account
   page) with a localStorage fallback for staff / logged-out screens.
   ========================================================================= */

const ZP_LANG_KEY = 'zp_lang';

const ZP_STRINGS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.technology': 'Technology',
    'nav.services': 'My Services',
    'nav.deployments': 'Deployments',
    'nav.software': 'My Software',
    'nav.invoices': 'Invoices & Billing',
    'nav.costs': 'Costs',
    'nav.renewals': 'Renewals',
    'nav.request': 'Request a Service',
    'nav.support': 'Support',
    'nav.documents': 'Documents',
    'nav.vault': 'Credentials Vault',
    'nav.account': 'Account',
    'nav.overview': 'Overview',
    'nav.customers': 'Customers',
    'nav.requests': 'Service Requests',
    'nav.agencyServices': 'Services',
    'nav.tasks': 'Delivery Tasks',
    'nav.catalogue': 'Software Catalogue',
    'nav.users': 'Users',
    'nav.workload': 'Workload',
    'nav.roles': 'Roles',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.recommendations': 'Recommendations',
    'nav.myTasks': 'My Tasks',
    'nav.backConsole': 'Back to Console',
    'nav.backTasks': 'Back to My Tasks',
    'login.customerTitle': 'Sign in to your account',
    'login.customerSub': 'Track your deployed services, billing, and support requests.',
    'login.customerDemo': 'Demo customer accounts — click to sign in',
    'login.agencyTitle': 'Agency console sign in',
    'login.agencySub': 'Internal access — manage customers, services, and billing.',
    'login.agencyDemo': 'Demo agency account — click to sign in',
    'login.teamTitle': 'Delivery team sign in',
    'login.teamSub': 'View your assigned tasks and work the deployment catalogue.',
    'login.teamDemo': 'Demo team accounts — click to sign in',
    'login.badCredentials': 'We couldn\'t find an account with those credentials. Try one of the demo accounts below.',
    'login.badAgency': 'Invalid agency credentials.',
    'login.badTeam': 'Invalid team credentials.',
    'login.disabled': 'This account has been disabled. Please contact your administrator.',
    'login.expired': 'Your session has expired — please sign in again.',
    'login.signedOut': 'You\'ve been signed out.',
    'login.forgotTitle': 'Reset your password',
    'login.forgotSub': 'Enter your account email and we\'ll issue a demo reset link.',
    'login.resetTitle': 'Choose a new password',
    'login.resetSub': 'Demo reset — no email is actually sent.',
    'login.mfaTitle': 'Two-step verification',
    'login.mfaCodeHint': 'Demo code: 123456',
    'login.mfaBad': 'Incorrect code. Hint: the demo code is 123456.',
    'login.resetOk': 'Password updated — sign in with your new password.',
    'login.resetBad': 'This reset token is invalid or expired. Request a new one.',
    'login.noAccount': 'This account no longer exists.',
    'login.forgotSent': 'If an account exists for this email, a reset link is on its way (demo: nothing is sent).',
    'login.forgotIssued': 'Demo reset link issued (valid 15 min, this tab only):'
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.technology': 'التقنية',
    'nav.services': 'خدماتي',
    'nav.deployments': 'عمليات النشر',
    'nav.software': 'برامجي',
    'nav.invoices': 'الفواتير والمحاسبة',
    'nav.costs': 'التكاليف',
    'nav.renewals': 'التجديدات',
    'nav.request': 'طلب خدمة',
    'nav.support': 'الدعم',
    'nav.documents': 'المستندات',
    'nav.vault': 'خزنة بيانات الاعتماد',
    'nav.account': 'الحساب',
    'nav.overview': 'نظرة عامة',
    'nav.customers': 'العملاء',
    'nav.requests': 'طلبات الخدمة',
    'nav.agencyServices': 'الخدمات',
    'nav.tasks': 'مهام التسليم',
    'nav.catalogue': 'كتالوج البرامج',
    'nav.users': 'المستخدمون',
    'nav.workload': 'عبء العمل',
    'nav.roles': 'الأدوار',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.recommendations': 'التوصيات',
    'nav.myTasks': 'مهامي',
    'nav.backConsole': 'عودة إلى وحدة التحكم',
    'nav.backTasks': 'عودة إلى مهامي',
    'login.customerTitle': 'سجّل الدخول إلى حسابك',
    'login.customerSub': 'تابع خدماتك وفواتيرك وطلبات الدعم.',
    'login.customerDemo': 'حسابات تجريبية — انقر لتسجيل الدخول',
    'login.agencyTitle': 'تسجيل دخول وحدة الوكالة',
    'login.agencySub': 'وصول داخلي — إدارة العملاء والخدمات والفواتير.',
    'login.agencyDemo': 'حساب تجريبي — انقر لتسجيل الدخول',
    'login.teamTitle': 'تسجيل دخول فريق التسليم',
    'login.teamSub': 'اعرض مهامك المسندة واعمل على الكتالوج.',
    'login.teamDemo': 'حسابات فريق تجريبية — انقر لتسجيل الدخول',
    'login.badCredentials': 'تعذر العثور على حساب بهذه البيانات. جرّب أحد الحسابات التجريبية أدناه.',
    'login.badAgency': 'بيانات اعتماد الوكالة غير صالحة.',
    'login.badTeam': 'بيانات اعتماد الفريق غير صالحة.',
    'login.disabled': 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول.',
    'login.expired': 'انتهت جلستك — يرجى تسجيل الدخول مجددًا.',
    'login.signedOut': 'تم تسجيل خروجك.',
    'login.forgotTitle': 'إعادة تعيين كلمة المرور',
    'login.forgotSub': 'أدخل بريدك وسنصدر رابط إعادة تعيين تجريبي.',
    'login.resetTitle': 'اختر كلمة مرور جديدة',
    'login.resetSub': 'إعادة تعيين تجريبية — لا يتم إرسال أي بريد.',
    'login.mfaTitle': 'التحقق بخطوتين',
    'login.mfaCodeHint': 'الرمز التجريبي: 123456',
    'login.mfaBad': 'رمز غير صحيح. الرمز التجريبي هو 123456.',
    'login.resetOk': 'تم تحديث كلمة المرور — سجّل الدخول بكلمة المرور الجديدة.',
    'login.resetBad': 'رمز إعادة التعيين غير صالح أو منتهي. اطلب رمزًا جديدًا.',
    'login.noAccount': 'هذا الحساب لم يعد موجودًا.',
    'login.forgotSent': 'إذا كان هناك حساب لهذا البريد، فستصلك رسالة إعادة تعيين (تجريبي: لا يتم إرسال شيء).',
    'login.forgotIssued': 'تم إصدار رابط إعادة تعيين تجريبي (صالح 15 دقيقة، هذا التبويب فقط):'
  }
};

const ZP_RTL_LANGS = ['ar', 'ur', 'he'];

function zpLang() {
  try {
    const stored = localStorage.getItem(ZP_LANG_KEY);
    if (stored && ZP_STRINGS[stored]) return stored;
  } catch (e) { /* ignore */ }
  return 'en';
}

function zpSetLang(lang) {
  if (!ZP_STRINGS[lang]) return;
  try { localStorage.setItem(ZP_LANG_KEY, lang); } catch (e) { /* ignore */ }
  zpApplyLocale();
}

/** Looks up a string; falls back to English, then the key itself. */
function t(key) {
  const lang = zpLang();
  if (ZP_STRINGS[lang] && ZP_STRINGS[lang][key] !== undefined) return ZP_STRINGS[lang][key];
  if (ZP_STRINGS.en[key] !== undefined) return ZP_STRINGS.en[key];
  return key;
}

/** Applies lang/dir to the document. Called on shell init and login load. */
function zpApplyLocale() {
  const lang = zpLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = ZP_RTL_LANGS.indexOf(lang) !== -1 ? 'rtl' : 'ltr';
}
