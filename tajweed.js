let rules = [];

function applyTajweed(text) {
    if (typeof text !== 'string') {
        console.error('applyTajweed: invalid input type, expected string');
        return text || '';
    }

    if (text.length === 0) return '';

    detectAllRules(text);
    return buildHtmlFromRules(text);
}

function detectAllRules(text) {
    if (typeof text !== 'string') {
        throw new TypeError(`detectAllRules expects string, got ${typeof text}`);
    }
    if (text.length === 0) return [];

    rules = [];

    for (let i = 0; i < text.length; i++) {
        let found = detectMadds(text, i);
        if (found) {
            continue;
        }

        found = detectHurufMuqattaat(text, i);
        if (found) {
            continue;
        }

        found = detectMaddLeen(text, i);
        if (found) {
            continue;
        }
    }
}

function buildHtmlFromRules(text) {
    rules.sort((a, b) => a.index - b.index);

    let output = '';
    let currentIndex = 0;

    for (const rule of rules) {
        if (rule.index < currentIndex) continue;

        output += text.slice(currentIndex, rule.index);
        if (rule.type.startsWith('waqf-')) {
            output += ' ';
        }
        output += `<span class="${rule.type}">${text.slice(rule.index, rule.index + rule.length)}</span>`;
        currentIndex = rule.index + rule.length;
    }

    output += text.slice(currentIndex);

    return output;
}

function detectMadds(text, index) {
    for (const madd of maddTypes) {
        if (text[index - 1] && text[index - 1] !== ' ' && text[index] === madd.char && !hasArabicVowel(text, index)) {
            let prevIndex = getPreviousArabicBaseLetterIndex(text, index);
            if (hasSukun(text, prevIndex)) {
                continue;
            }
            let length = index - prevIndex + madd.length;
            let type = madd.type;
            let nextIndex = getNextArabicBaseLetterIndex(text, index + madd.length);
            if (isAtStop(text, index + length + 1)) { // end of ayah
                type = 'tajweed-madd-arid';
            }
            else if (hasArabicShadda(text, nextIndex)) {
                type = 'tajweed-madd-lazim';
            }
            else if (hasArabicMadda(text, prevIndex)) {
                type = 'tajweed-madd-munfasil';
            }
            else if (hasArabicMadda(text, index)) {
                type = 'tajweed-madd-muttasil';
                length += 1;
            }
            else if (text[nextIndex] === ALIF
                && text[index] !== 'و'
                && !hasArabicVowel(text, nextIndex)
            ) { // alif with sukun
                type = 'silent-letter';
                prevIndex++;
            }
            else if (text[index] === ALIF && hasFathataan(text, prevIndex)) { // waw with sukun
                continue
            }
            else if (text[nextIndex] === LAM && hasSukun(text, nextIndex)) { // lam with sukun
                type = 'silent-letter';
                prevIndex++;
                length--;
            }
            else if (hasQasr(text, index)) {
                type = 'tajweed-qasr';
                prevIndex++;
            }
            else if (hasArabicVowel(text, nextIndex + 1)) {
                continue
            }

            rules.push({ index: prevIndex, length: length, type: type });
            return true
        }
    }
    return false;
}

function detectHurufMuqattaat(text, index) {
    //if (!hasArabicVowel(text, index) && hasArabicMadda(text, index) && text[index + 1] !== SUBSCRIPT_ALIF) {
if (
    //isWordStart(text, index) &&
    !hasArabicVowel(text, index) &&
    MUQATTAAT.includes(text[index]) &&
    hasArabicMadda(text, index)
) {
        rules.push({ index: index, length: 2, type: 'tajweed-madd-lazim' });
        return true;
    }

    return false;
}

function detectMaddLeen(text, i) {
    const prevPrev = text[i - 2];
    const prev = text[i - 1];
    const curr = text[i];
    const next = text[i + 1];
    if (!((curr === 'و' || curr === 'ي' || curr === 'ی' || curr === 'ى') && (prev === FATHA || (prev === SHADDA && prevPrev === FATHA)) && next === SUKUN)) {
        return false;
    }

    let j = i + 2; // Start after the leen letter and its sukun
    let letterCount = 0;
    while (j < text.length && !isWordBreak(text[j])) {
        if (isArabicLetter(text[j])) {
            letterCount++;
        }
        j++;
    }

    // Madd Leen only occurs if there is exactly one letter after it before the stop
    const found = letterCount === 1 && isAtStop(text, j);
    if (found) {
        let beginIndex = i - 2;
        const length = 4;
        if (prev === SHADDA) {
            beginIndex--;
        }

        rules.push({ index: beginIndex, length: length, type: 'tajweed-madd-liin' });

    }
    return found;
}

function isAtStop(text, i) {
    let j = i;
    while (j < text.length && text[j] === ' ') {
        j++;
    }
    if (j >= text.length) return true; // End of text is a stop
    const charAtBreak = text[j];
    return Object.keys(WAQF_CLASSES).includes(charAtBreak) || charAtBreak === AYAH_END;
}

function hasArabicVowelORG(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }

    const vowelRegex = /[\u064B-\u0652]/;

    // Check the character AFTER the letter
    return vowelRegex.test(text[index + 1]);
}

function hasArabicVowel(text, index) {
    for (let i = index + 1; i < text.length; i++) {
        const c = text[i];
        if (c >= '\u064B' && c <= '\u0652') return true;
        if (c < '\u064B' || c > '\u065F') break;
    }
    return false;
}

function hasSukun(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }
    return text[index + 1] === SUKUN;
}

function hasFathataan(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }

    return text[index + 1] === FATHATAN;
}

function hasQasr(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }

    return text[index + 1] === QASR;
}

function hasArabicShadda(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    let i = index + 1;
    while (i < text.length) {
        const char = text[i];

        // Stop if we reach a non-diacritic Arabic letter
        if (char < '\u064B' || char > '\u065F') {
            break;
        }

        if (char === SHADDA) {
            return true;
        }

        i++;
    }

    return false;
}

function hasArabicMadda(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    const MADDA = '\u0653';

    let i = index + 1;
    while (i < text.length) {
        const char = text[i];

        // Stop when we reach a non-diacritic
        if (char < '\u064B' || char > '\u065F') {
            break;
        }

        if (char === MADDA) {
            return true;
        }

        i++;
    }

    return false;
}

function getPreviousArabicBaseLetterIndex(text, index) {
    if (!text || index <= 0 || index > text.length) {
        return -1;
    }

    for (let i = index - 1; i >= 0; i--) {
        const char = text[i];

        // Skip Arabic combining marks (harakat, shadda, madda, etc.)
        if (char >= '\u064B' && char <= '\u065F') {
            continue;
        }

        return i; // Found base letter
    }

    return -1;
}

function getNextArabicBaseLetterIndex(text, index) {
    if (!text || index <= 0 || index > text.length) {
        return -1;
    }

    for (let i = index; i < text.length; i++) {
        const char = text[i];

        if (WAQF_CLASSES[char] || char === AYAH_END) {
            return i; // Stop signs are considered base letters for this purpose
        }

        // Skip Arabic combining marks (harakat, shadda, madda, etc.)
        if ((char >= '\u064B' && char <= '\u065F') || char === ' ') {
            continue;
        }

        return i; // Found base letter
    }

    return -1;
}

//HELPER FUNCTIONS AND CONSTANTS
const ARABIC_LETTER_REGEX = /[\u0600-\u06FF]/;

function isArabicLetterORG(char) {
    //return ARABIC_LETTER_REGEX.test(char);
    return char >= FATHATAN && char <= SUKUN;
}

function isArabicLetter(char) {
    return char >= '\u0621' && char <= '\u064A'; // hamza → ya
}


const WAQF_CLASSES = {
    '\u06D8': 'waqf-lazim',    // Meem
    '\u0615': 'waqf-awla',     // Ta
    '\u06DA': 'waqf-jaiz',     // Jeem
    '\u06D7': 'waqf-awla',     // Qala
    '\u06D6': 'waqf-continue', // Sala
    '\u06DB': 'waqf-muanaqah', // Mu'anaqah
    '\u0619': 'waqf-jaiz',     // Small high dotless head of khah
    '\u06D9': 'waqf-continue'  // Small high lam-alif (ۙ)
};


function isWordBreak(char) {
    return /\s/.test(char) || Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END;
}

function isWordStart(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    // Must be an Arabic base letter
    const char = text[index];
    if (char < '\u0621' || char > '\u064A') {
        return false;
    }

    // Look backwards for the previous non-diacritic character
    for (let i = index - 1; i >= 0; i--) {
        const prev = text[i];

        // Skip Arabic combining marks
        if (prev >= '\u064B' && prev <= '\u065F') {
            continue;
        }

        // Word starts after space, waqf sign, or ayah end
        if (
            prev === ' ' ||
            prev === AYAH_END ||
            Object.keys(WAQF_CLASSES).includes(prev)
        ) {
            return true;
        }

        // Otherwise it's inside a word
        return false;
    }

    // Reached start of string → start of word
    return true;
}


const FATHA = '\u064E';
const FATHATAN = '\u064B';
const SHADDA = '\u0651';
const SUKUN = '\u0652';
const QASR = '\u08D1';

const ALIF = '\u0627';
const SUBSCRIPT_ALIF = '\u0656';
const SUPERSCRIPT_ALIF = '\u0670';

const LAM = '\u0644';

const AYAH_END = '\u06DD'; // ۝

const maddTypes = [
    { char: ALIF, type: 'tajweed-madd-asli', length: 1 },
    { char: 'و', type: 'tajweed-madd-asli', length: 1 },
    { char: SUPERSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 1 },
    { char: SUBSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 2 }
];

const MUQATTAAT = ['ا','ل','م','ك','ه','ي','ع','ص','ط','س','ح','ق','ن'];

//-----------------------------------------------------------

