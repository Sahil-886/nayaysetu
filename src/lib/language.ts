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
      return `\n\nLANGUAGE INSTRUCTION (MANDATORY): Respond strictly in clear, professional HINDI (हिंदी) using Devanagari script. Keep statutory act titles, section numbers, case names, and citation tokens [Chunk X] recognizable and unaltered (e.g. "Section 138 NI Act", "High Court of Delhi").`;
    case 'mr':
      return `\n\nLANGUAGE INSTRUCTION (MANDATORY): Respond strictly in clear, natural MARATHI (मराठी) using Devanagari script. Keep statutory act titles, section numbers, case names, and citation tokens [Chunk X] recognizable and unaltered.`;
    case 'ta':
      return `\n\nLANGUAGE INSTRUCTION (MANDATORY): Respond strictly in clear, natural TAMIL (தமிழ்) using Tamil script. Keep statutory act titles, section numbers, case names, and citation tokens [Chunk X] recognizable and unaltered.`;
    default:
      return '';
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
