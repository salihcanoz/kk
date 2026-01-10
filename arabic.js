// arabic-letters.js

// Arabic Letters
const ALIF = '\u0627';      // ا
const BA = '\u0628';       // ب
const TA = '\u0629';       // ة
const THA = '\u062B';      // ث
const JEEM = '\u062C';     // ج
const HA = '\u062D';       // ح
const KHA = '\u062E';      // خ
const DAL = '\u062F';      // د
const THAL = '\u0630';     // ذ
const RA = '\u0631';       // ر
const ZAY = '\u0632';      // ز
const SEEN = '\u0633';     // س
const SHEEN = '\u0634';    // ش
const SAD = '\u0635';      // ص
const DAD = '\u0636';      // ض
const TAH = '\u0637';      // ط
const ZAH = '\u0638';      // ظ
const AIN = '\u0639';      // ع
const GHAIN = '\u063A';    // غ
const FA = '\u0641';       // ف
const QAF = '\u0642';      // ق
const KAF = '\u0643';      // ك
const LAM = '\u0644';      // ل
const MEEM = '\u0645';     // م
const NOON = '\u0646';     // ن
const HA2 = '\u0647';      // ه
const WAW = '\u0648';      // و
const YAA = '\u064A';      // ي
const HAMZA = '\u0621';    // ء
const ALIF_HAMZA_ABOVE = '\u0623';   // أ
const WAW_HAMZA = '\u0624';          // ؤ
const ALIF_HAMZA_BELOW = '\u0625';   // إ
const YAA_HAMZA = '\u0626';          // ئ
const ALIF_MAQSURA = '\u0649';       // ى
const TAA_MARBUTA = '\u0629';        // ة

// Superscript and Subscript Alif's (for Quranic orthography)
const SMALL_ALIF_ABOVE = '\u0670';   // ٰ (Alif Khanjariyah)
const SMALL_ALIF_BELOW = '\u0656';

// Extended madd letters and related characters
const ALIF_MADDA = '\u0622';          // آ (Alif with madda above)
const SMALL_HIGH_MADDA = '\u06E0';    // ۠ (Small high madda)


// Additional small letters for Quranic text
const SMALL_WAW = '\u06E5';          // ۥ
const SMALL_YAA = '\u06E6';          // ۦ

// Extended Arabic letters for Quranic orthography
const SMALL_HIGH_NOON = '\u06E2';    // ۢ
const SMALL_HIGH_MEEM = '\u06E3';    // ۣ
const SMALL_HIGH_LAM = '\u06E4';     // ۤ
const SMALL_HIGH_JEEM = '\u06E8';    // ۨ

// Arabic Vowel Signs (Tashkeel)
const FATHA = '\u064E';        // َ
const DAMMA = '\u064F';        // ُ
const KASRA = '\u0650';        // ِ
const SHADDA = '\u0651';       // ّ
const SUKUN = '\u0652';        // ْ
const FATHA_TANWEEN = '\u064B'; // ً
const DAMMA_TANWEEN = '\u064C'; // ٌ
const KASRA_TANWEEN = '\u064D'; // ٍ
const MADDAH = '\u0653';       // ٓ
const HAMZA_ABOVE = '\u0654';  // ٔ
const HAMZA_BELOW = '\u0655';  // ٕ

// Additional diacritics for Quranic text
const SMALL_HIGH_ROUNDED_ZERO = '\u06DF';   // ۟
const SMALL_HIGH_SEEN = '\u06ED';           // ۭ
const SMALL_HIGH_REH = '\u06EF';            // ۯ

// Quranic symbols
const END_OF_AYAH = '\u06DD';               // ۝
const START_OF_RUB_EL_HIZB = '\u06DE';      // ۞
const PLACE_OF_SAJDAH = '\u06E9';           // ۩
const BISMILLAH = '\uFDFD';                 // ﷽

// Punctuation
const COMMA = '\u060C';     // ،
const SEMICOLON = '\u061B'; // ؛
const QUESTION_MARK = '\u061F'; // ؟

// Ligatures
const LAM_ALIF = '\uFEFB';   // ﻻ

const maddLetters = [ALIF, WAW, ALIF_MAQSURA, SMALL_ALIF_ABOVE
    , SMALL_ALIF_BELOW];

const vowels = [
    FATHA.codePointAt(0),
    DAMMA.codePointAt(0),
    KASRA.codePointAt(0),
    FATHA_TANWEEN.codePointAt(0),
    DAMMA_TANWEEN.codePointAt(0),
    KASRA_TANWEEN.codePointAt(0),
    SUKUN.codePointAt(0)
];


function isArabicLetter(char) {
    // Basic check - Arabic letters are in specific Unicode ranges
    const code = char.codePointAt(0);
    return (code >= 0x0600 && code <= 0x06FF) ||
        (code >= 0xFE70 && code <= 0xFEFF);
}

function isDiacritic(char) {
    const code = char.codePointAt(0);
    // Arabic diacritics range
    return code >= 0x064B && code <= 0x065F;
}

// Function to detect madd asli in parsed text
function findMaddAsli(tokens) {
    const maddPositions = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'space' || !token.letter) continue;

        // Check if this could be a madd letter
        const isPotentialMadd = isPotentialMaddLetter(token.letter);

        if (isPotentialMadd) {
            // Check if it has sukun or is at word end
            const hasSukun = token.diacritics.includes(SUKUN);
            const isWordEnd = isEndOfWord(tokens, i);

            if (hasSukun || isWordEnd) {
                // Check previous letter's vowel for proper madd context
                const prevToken = i > 0 ? tokens[i - 1] : null;

                if (prevToken && prevToken.letter && !isDiacritic(prevToken.letter)) {
                    const maddType = getMaddType(prevToken, token);

                    if (maddType) {
                        maddPositions.push({
                            position: token.position,
                            length: 1 + token.diacritics.length,
                            type: maddType,
                            token: token
                        });
                    }
                }
            }
        }

        // Special case: Check for small alif above (ٰ) - which indicates madd
        if (token.diacritics.includes(SMALL_ALIF_ABOVE)) {
            // This is a madd indicator - the preceding letter should be prolonged
            maddPositions.push({
                position: token.position - 1, // Position of letter before small alif
                length: 1,
                type: 'ALIF_MADD_SMALL',
                token: tokens[i - 1] || token
            });
        }
    }

    return maddPositions;
}

function isEndOfWord(tokens, currentIndex) {
    // Check if next token is space or end of array
    if (currentIndex >= tokens.length - 1) return true;

    const nextToken = tokens[currentIndex + 1];
    return nextToken.type === 'space';
}

function getMaddType(prevToken, maddToken) {
    const maddLetter = maddToken.letter;

    // Check previous letter's last diacritic (usually the vowel)
    const prevVowel = prevToken.diacritics.length > 0 ?
        prevToken.diacritics[prevToken.diacritics.length - 1] : '';

    const maddCode = maddLetter.codePointAt(0);

    // Alif madd: previous letter must have FATHA
    if ((maddCode === ALIF.codePointAt(0) ||
            maddCode === ALIF_MADDA.codePointAt(0) ||
            maddCode === ALIF_HAMZA_ABOVE.codePointAt(0) ||
            maddCode === ALIF_HAMZA_BELOW.codePointAt(0)) &&
        prevVowel === FATHA) {
        return 'ALIF_MADD';
    }

    // Waw madd: previous letter must have DAMMA
    if ((maddCode === WAW.codePointAt(0) ||
            maddCode === WAW_HAMZA.codePointAt(0)) &&
        prevVowel === DAMMA) {
        return 'WAW_MADD';
    }

    // Yaa madd: previous letter must have KASRA
    if ((maddCode === YAA.codePointAt(0) ||
            maddCode === YAA_HAMZA.codePointAt(0) ||
            maddCode === ALIF_MAQSURA.codePointAt(0)) &&
        prevVowel === KASRA) {
        return 'YAA_MADD';
    }

    return null;
}