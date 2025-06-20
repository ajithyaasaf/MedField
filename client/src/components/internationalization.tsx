import React, { createContext, useContext, useState } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface Translations {
  [key: string]: {
    [lang: string]: string;
  };
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
];

const translations: Translations = {
  // Common
  'common.welcome': {
    en: 'Welcome',
    ta: 'வருக',
  },
  'common.save': {
    en: 'Save',
    ta: 'சேமி',
  },
  'common.cancel': {
    en: 'Cancel',
    ta: 'ரத்து செய்',
  },
  'common.submit': {
    en: 'Submit',
    ta: 'சமர்ப்பி',
  },
  'common.loading': {
    en: 'Loading...',
    ta: 'ஏற்றுகிறது...',
  },
  
  // Dashboard
  'dashboard.title': {
    en: 'MedField Pro',
    ta: 'மெட்ஃபீல்ட் ப்ரோ',
  },
  'dashboard.clockIn': {
    en: 'Clock In',
    ta: 'நேரம் பதிவு',
  },
  'dashboard.clockOut': {
    en: 'Clock Out',
    ta: 'வெளியேறு',
  },
  'dashboard.newQuote': {
    en: 'New Quote',
    ta: 'புதிய மேற்கோள்',
  },
  'dashboard.todaySchedule': {
    en: "Today's Schedule",
    ta: 'இன்றைய அட்டவணை',
  },
  'dashboard.recentQuotations': {
    en: 'Recent Quotations',
    ta: 'சமீபத்திய மேற்கோள்கள்',
  },
  
  // Attendance
  'attendance.clockedIn': {
    en: 'Clocked In',
    ta: 'நேரம் பதிவானது',
  },
  'attendance.clockedOut': {
    en: 'Clocked Out',
    ta: 'வெளியேறியது',
  },
  'attendance.locationRequired': {
    en: 'Location Required',
    ta: 'இடம் தேவை',
  },
  'attendance.enableLocation': {
    en: 'Please enable location services to clock in.',
    ta: 'நேரம் பதிவு செய்ய இடம் சேவைகளை இயக்கவும்.',
  },
  
  // Quotations
  'quotation.create': {
    en: 'Create Quotation',
    ta: 'மேற்கோள் உருவாக்கு',
  },
  'quotation.hospital': {
    en: 'Hospital',
    ta: 'மருத்துவமனை',
  },
  'quotation.product': {
    en: 'Product',
    ta: 'தயாரிப்பு',
  },
  'quotation.quantity': {
    en: 'Quantity',
    ta: 'அளவு',
  },
  'quotation.price': {
    en: 'Price',
    ta: 'விலை',
  },
  'quotation.total': {
    en: 'Total',
    ta: 'மொத்தம்',
  },
  
  // Schedule
  'schedule.visit': {
    en: 'Visit',
    ta: 'சந்திப்பு',
  },
  'schedule.time': {
    en: 'Time',
    ta: 'நேரம்',
  },
  'schedule.noVisits': {
    en: 'No scheduled visits for today',
    ta: 'இன்றைக்கு திட்டமிடப்பட்ட சந்திப்புகள் இல்லை',
  },
  
  // Notifications
  'notification.clockOutReminder': {
    en: 'Clock Out Reminder',
    ta: 'வெளியேறு நினைவூட்டல்',
  },
  'notification.quotationFollowUp': {
    en: 'Quotation Follow-up',
    ta: 'மேற்கோள் தொடர்ச்சி',
  },
  'notification.locationAlert': {
    en: 'Location Alert',
    ta: 'இட எச்சரிக்கை',
  },
};

interface I18nContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  languages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[currentLanguage] || translation['en'] || key;
  };

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('medfield-language', lang);
  };

  React.useEffect(() => {
    const savedLang = localStorage.getItem('medfield-language');
    if (savedLang && languages.some(l => l.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

export function LanguageSelector() {
  const { currentLanguage, setLanguage, languages } = useTranslation();

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        className="appearance-none bg-transparent border border-gray-300 rounded px-3 py-1 text-sm"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}