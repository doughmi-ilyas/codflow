export const LOCALES = ["fr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

const fr = {
  appName: "CODFlow",
  login: { title: "Connexion", tenant: "Boutique", email: "E-mail", password: "Mot de passe", submit: "Se connecter", error: "Identifiants invalides" },
  nav: { dashboard: "Tableau de bord", orders: "Commandes", logout: "Déconnexion" },
  role: { owner: "Propriétaire", manager: "Responsable", agent: "Agent", courier: "Livreur" },
  brand: { tagline: "Gérez vos commandes paiement à la livraison", p1: "Plusieurs boutiques, données isolées", p2: "Rôles et permissions par équipe", p3: "Suivi des espèces encaissées" },
  orders: {
    title: "Commandes", new: "Nouvelle commande", reference: "Référence", customer: "Client", phone: "Téléphone", city: "Ville", address: "Adresse",
    total: "Montant (MAD)", status: "Statut", all: "Tous", search: "Rechercher", empty: "Aucune commande", create: "Créer", page: "Page", of: "sur",
    history: "Historique", courier: "Livreur", cash: "Espèces encaissées (MAD)", note: "Note", apply: "Appliquer", chooseCourier: "Choisir un livreur", back: "Retour", close: "Fermer", results: "résultats", details: "Détails", actions: "Actions",
  },
  status: { new: "Nouvelle", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", refused: "Refusée", returned: "Retournée" },
  action: { confirmed: "Confirmer", shipped: "Expédier", delivered: "Marquer livrée", refused: "Refuser", returned: "Marquer retournée" },
  stats: { title: "Tableau de bord", collected: "Espèces encaissées", delivered: "Montant livré", difference: "Écart", onTheRoad: "En cours de livraison", orders: "commandes", recent: "Dernières commandes", viewAll: "Tout voir", distribution: "Répartition des commandes" },
  errors: { generic: "Une erreur est survenue", forbidden: "Action non autorisée" },
};

type Dict = typeof fr;

const en: Dict = {
  appName: "CODFlow",
  login: { title: "Sign in", tenant: "Shop", email: "Email", password: "Password", submit: "Sign in", error: "Invalid credentials" },
  nav: { dashboard: "Dashboard", orders: "Orders", logout: "Sign out" },
  role: { owner: "Owner", manager: "Manager", agent: "Agent", courier: "Courier" },
  brand: { tagline: "Run your cash-on-delivery orders", p1: "Several shops, isolated data", p2: "Roles and permissions per team", p3: "Cash collection tracking" },
  orders: {
    title: "Orders", new: "New order", reference: "Reference", customer: "Customer", phone: "Phone", city: "City", address: "Address",
    total: "Amount (MAD)", status: "Status", all: "All", search: "Search", empty: "No orders", create: "Create", page: "Page", of: "of",
    history: "History", courier: "Courier", cash: "Cash collected (MAD)", note: "Note", apply: "Apply", chooseCourier: "Choose a courier", back: "Back", close: "Close", results: "results", details: "Details", actions: "Actions",
  },
  status: { new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", refused: "Refused", returned: "Returned" },
  action: { confirmed: "Confirm", shipped: "Ship", delivered: "Mark delivered", refused: "Refuse", returned: "Mark returned" },
  stats: { title: "Dashboard", collected: "Cash collected", delivered: "Delivered value", difference: "Difference", onTheRoad: "Out for delivery", orders: "orders", recent: "Latest orders", viewAll: "View all", distribution: "Orders by status" },
  errors: { generic: "Something went wrong", forbidden: "Action not allowed" },
};

const ar: Dict = {
  appName: "CODFlow",
  login: { title: "تسجيل الدخول", tenant: "المتجر", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "دخول", error: "بيانات الدخول غير صحيحة" },
  nav: { dashboard: "لوحة التحكم", orders: "الطلبات", logout: "تسجيل الخروج" },
  role: { owner: "المالك", manager: "المسؤول", agent: "موظف", courier: "الموزّع" },
  brand: { tagline: "أدِر طلباتك بالدفع عند الاستلام", p1: "عدة متاجر، بيانات معزولة", p2: "أدوار وصلاحيات لكل فريق", p3: "تتبع المبالغ المحصّلة" },
  orders: {
    title: "الطلبات", new: "طلب جديد", reference: "المرجع", customer: "الزبون", phone: "الهاتف", city: "المدينة", address: "العنوان",
    total: "المبلغ (درهم)", status: "الحالة", all: "الكل", search: "بحث", empty: "لا توجد طلبات", create: "إنشاء", page: "الصفحة", of: "من",
    history: "السجل", courier: "الموزّع", cash: "المبلغ المحصّل (درهم)", note: "ملاحظة", apply: "تطبيق", chooseCourier: "اختر موزّعاً", back: "رجوع", close: "إغلاق", results: "نتيجة", details: "التفاصيل", actions: "الإجراءات",
  },
  status: { new: "جديد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التسليم", refused: "مرفوض", returned: "مُرجَع" },
  action: { confirmed: "تأكيد", shipped: "شحن", delivered: "تم التسليم", refused: "رفض", returned: "تم الإرجاع" },
  stats: { title: "لوحة التحكم", collected: "المبلغ المحصّل", delivered: "قيمة المسلَّم", difference: "الفرق", onTheRoad: "قيد التوصيل", orders: "طلبات", recent: "آخر الطلبات", viewAll: "عرض الكل", distribution: "الطلبات حسب الحالة" },
  errors: { generic: "حدث خطأ ما", forbidden: "إجراء غير مسموح" },
};

export const dictionaries: Record<Locale, Dict> = { fr, en, ar };
export const t = (l: Locale): Dict => dictionaries[l];
