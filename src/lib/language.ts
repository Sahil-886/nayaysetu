/**
 * Language Helper for NyaySetu Multi-Language AI Outputs
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
];

export function getLanguageInstruction(lang?: string): string {
  switch (lang) {
    case 'hi':
      return `\n\nIMPORTANT LANGUAGE INSTRUCTION (MANDATORY): Write your entire response in Hindi (हिंदी) using Devanagari script. Do not use English except for legal citations, statute names, section numbers, and case names. Respond ONLY in Hindi.`;
    case 'mr':
      return `\n\nIMPORTANT LANGUAGE INSTRUCTION (MANDATORY): Write your entire response in Marathi (मराठी) using Devanagari script. Do not use English except for legal citations, statute names, section numbers, and case names. Respond ONLY in Marathi.`;
    case 'ta':
      return `\n\nIMPORTANT LANGUAGE INSTRUCTION (MANDATORY): Write your entire response in Tamil (தமிழ்) using Tamil script. Do not use English except for legal citations, statute names, section numbers, and case names. Respond ONLY in Tamil.`;
    case 'en':
    default:
      return `\n\nIMPORTANT LANGUAGE INSTRUCTION (MANDATORY): Write your entire response in clear, plain ENGLISH. Do NOT use Hindi, Devanagari script, or any other language.`;
  }
}

export function getNotFoundMessage(lang?: string): string {
  switch (lang) {
    case 'hi':
      return 'प्रदान किए गए कानूनी दस्तावेज़ों में जानकारी नहीं मिली।';
    case 'mr':
      return 'दिलेल्या कायदेशीर दस्तऐवजांमध्ये माहिती आढळली नाही.';
    case 'ta':
      return 'வழங்கப்பட்ட சட்ட ஆவணங்களில் தகவல் கிடைக்கவில்லை.';
    default:
      return 'Not found in the provided documents.';
  }
}
