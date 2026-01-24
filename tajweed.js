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
        let found = detectHurufMuqattaat(text, i);
        if (found) {
            continue;
        }

        found = detectSilentAlifLam(text, i);
        if (found) {
            continue;
        }

        found = detectSilentHamzatWasl(text, i);
        if (found) {
            continue;
        }

        found = detectIdghamMutakaribain(text, i);
        if (found) {
            continue;
        }

        found = detectMadds(text, i);
        if (found) {
            continue;
        }

        found = detectMaddLeen(text, i);
        if (found) {
            continue;
        }

        detectQalqalah(text, i);

        const nunRule = detectNunSakinah(text, i);
        if (nunRule) {
            rules.push(nunRule.trigger);
            if (nunRule.target) {
                rules.push(nunRule.target);
            }
        }

        detectGhunna(text, i);

        detectSilatHa(text, i);
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

function detectSilentAlifLam(text, i) {
    if (text[i] !== ALIF || text[i+1] !== LAM) {
        return false;
    }

    if (!isWordStart(text, i)) {
        return false;
    }

    let nextCharIndex = i + 2;
    while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
        nextCharIndex++;
    }

    if (nextCharIndex >= text.length || !isArabicLetter(text[nextCharIndex])) {
        return false;
    }

    if (hasArabicShadda(text, nextCharIndex)) {
        if (isStartOfSpeech(text, i)) {
             rules.push({ index: i + 1, length: 1, type: 'silent-letter' });
        } else {
             rules.push({ index: i, length: 2, type: 'silent-letter' });
        }
        return true;
    }
    
    if (!isStartOfSpeech(text, i)) {
        rules.push({ index: i, length: 1, type: 'silent-letter' });
        return true;
    }

    return false;
}

function detectSilentHamzatWasl(text, i) {
    if (text[i] !== ALIF) return false;
    if (text[i+1] === LAM) return false; // Handled by detectSilentAlifLam
    
    if (!isWordStart(text, i)) return false;
    if (isStartOfSpeech(text, i)) return false;
    
    if (hasArabicVowel(text, i)) return false;
    
    // Check for Superscript Alif or Madda
    let j = i + 1;
    while (j < text.length && isDiacritic(text[j])) {
        if (text[j] === SUPERSCRIPT_ALIF || text[j] === '\u0653') return false;
        j++;
    }
    
    rules.push({ index: i, length: 1, type: 'silent-letter' });
    return true;
}

function isStartOfSpeech(text, index) {
    if (index === 0) return true;
    for (let i = index - 1; i >= 0; i--) {
        const char = text[i];
        if (char === ' ') continue;
        if (Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END) return true;
        return false;
    }
    return true;
}

function detectIdghamMutakaribain(text, i) {
    const curr = text[i];
    
    // Lam (ل) followed by Ra (ر)
    if (curr === LAM) {
        if (hasSukun(text, i) || !hasArabicVowel(text, i)) {
            let nextIndex = getNextArabicBaseLetterIndex(text, i + 1);
            if (nextIndex !== -1 && text[nextIndex] === 'ر') {
                 let len = 1;
                 if (hasSukun(text, i)) len = 2;
                 
                 rules.push({ index: i, length: len + 3, type: 'tajweed-idgham-mutakaribain' });
                 return true;
            }
        }
    }
    
    // Qaf (ق) followed by Kaf (ك)
    if (curr === 'ق') {
        if (hasSukun(text, i) || !hasArabicVowel(text, i)) {
            let nextIndex = getNextArabicBaseLetterIndex(text, i + 1);
            if (nextIndex !== -1 && text[nextIndex] === 'ك') {
                 let len = 1;
                 if (hasSukun(text, i)) len = 2;
                 
                 rules.push({ index: i, length: len, type: 'tajweed-idgham-mutakaribain' });
                 rules.push({ index: nextIndex, length: 1, type: 'tajweed-idgham-mutakaribain' });
                 return true;
            }
        }
    }
    return false;
}

function detectMadds(text, index) {
    for (const madd of maddTypes) {
        if (text[index - 1] && text[index - 1] !== ' ' && text[index] === madd.char && !hasArabicVowel(text, index)) {
            
            if (madd.char === ALIF) {
                 let prevIndex = getPreviousArabicBaseLetterIndex(text, index);
                 if (prevIndex !== -1 && text[prevIndex] === 'و' && !hasArabicVowel(text, prevIndex)) {
                      continue;
                 }
            }

            let prevIndex = getPreviousArabicBaseLetterIndex(text, index);
            if (hasSukun(text, prevIndex)) {
                continue;
            }
            let length = index - prevIndex + madd.length;
            let type = madd.type;
            let nextIndex = getNextArabicBaseLetterIndex(text, index + madd.length);

            if (madd.char === SUPERSCRIPT_ALIF && nextIndex !== -1) {
                const nextChar = text[nextIndex];
                if (nextChar === ALIF || nextChar === '\u0649' || nextChar === ALIF_MAKSURA || nextChar === YA || nextChar === 'و' || nextChar === '\u063D' || nextChar === '\u06D2') {
                    let isHamza = false;
                    let hasVowel = false;
                    let j = nextIndex + 1;
                    while (j < text.length && isDiacritic(text[j])) {
                        if (text[j] === '\u0654' || text[j] === '\u0655') {
                            isHamza = true;
                        }
                        if (text[j] >= '\u064B' && text[j] <= '\u0652') {
                            hasVowel = true;
                        }
                        j++;
                    }
                    if (!isHamza && !hasVowel) {
                        nextIndex = getNextArabicBaseLetterIndex(text, nextIndex + 1);
                    }
                }
            }

            // Calculate where the next letter ends (skipping its diacritics) to check for stop
            let checkStopIndex = nextIndex;
            if (nextIndex !== -1) {
                checkStopIndex = nextIndex + 1;
                while (checkStopIndex < text.length && isDiacritic(text[checkStopIndex])) {
                    checkStopIndex++;
                }
            }

            if (hasArabicShadda(text, nextIndex)) {
                if (hasArabicMadda(text, index) || hasArabicMadda(text, prevIndex)) {
                    type = 'tajweed-madd-lazim';
                } else if (madd.char === ALIF) {
                    rules.push({ index: index, length: 1, type: 'silent-letter' });
                    return true;
                } else {
                    continue;
                }
            }
            else if (isSameWord(text, index, nextIndex) && isAtStop(text, checkStopIndex)) {
                if (hasFathataan(text, nextIndex) && text[nextIndex] !== 'ة') {
                    // Not Arid
                } else {
                    type = 'tajweed-madd-arid';
                }
            }
            else if (hasArabicMadda(text, index)) {
                if (!isSameWord(text, index, nextIndex)) {
                    type = 'tajweed-madd-munfasil';
                    length++;
                } else {
                    type = 'tajweed-madd-muttasil';
                    length += 2;
                }
            }
            else if (hasArabicMadda(text, prevIndex) && hasHamzaAfter(text, index)) {
                type = 'tajweed-madd-muttasil';
            }
            else if (hasArabicMadda(text, prevIndex)) {
                type = 'tajweed-madd-munfasil';
                length++;
            }

            else if (text[nextIndex] === ALIF
                && text[index] !== 'و'
                && !hasArabicVowel(text, nextIndex)
            ) { // alif with sukun
                if (causesIltiqaSakinayn(text, index)){
                    type = 'silent-letter';
                    prevIndex++;
                    //length += 2;
                }
            }
            else if (text[index] === ALIF && hasFathataan(text, prevIndex)) { // waw with sukun
                continue
            }
            else if (hasQasr(text, index)) {
                type = 'tajweed-qasr';
                prevIndex++;
            }
            else if (hasArabicVowel(text, nextIndex + 1)) {
                continue;
            }
            else if (text[index] === ALIF && hasSukun(text, nextIndex)) { // alif with sukun
                type = 'silent-letter';
                prevIndex++;
                length--;
            }
            else if (causesIltiqaSakinayn(text, index)) {
                type = 'silent-letter';
                prevIndex++;
                //length += 2;
            }

            if (madd.char === 'و' && (type === 'tajweed-madd-asli' || type === 'tajweed-madd-arid')) {
                let nextCharIndex = index + 1;
                while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
                    nextCharIndex++;
                }
                if (nextCharIndex < text.length && text[nextCharIndex] === ALIF && !hasArabicVowel(text, nextCharIndex)) {
                     length += (nextCharIndex - index);
                }
            }

            rules.push({ index: prevIndex, length: length, type: type });
            return true
        }
    }
    if (isMaddAsliHamzaOnWaw(text, index) && !hasQasr(text, index + 1)) {        
        rules.push({
            index: index,
            length: 2,
            type: 'tajweed-madd-asli'
        });
        return true;
    }

    return false;
}

function isSameWord(text, index1, index2) {
    if (index2 === -1 || index2 >= text.length) return false;
    for (let k = index1 + 1; k < index2; k++) {
        if (isWordBreak(text[k])) {
            return false;
        }
    }
    return true;
}

function detectHurufMuqattaat(text, index) {
    if (
        !hasArabicVowel(text, index) &&
        MUQATTAAT.includes(text[index]) &&
        hasArabicMadda(text, index)
    ) {
        if (isStartOfSpeech(text, index)) {
             rules.push({ index: index, length: 2, type: 'tajweed-madd-lazim' });
             return true;
        }
        
        let prevIndex = getPreviousArabicBaseLetterIndex(text, index);
        if (prevIndex !== -1) {
             const prevChar = text[prevIndex];
             if (MUQATTAAT.includes(prevChar) && !hasArabicVowel(text, prevIndex)) {
                  rules.push({ index: index, length: 2, type: 'tajweed-madd-lazim' });
                  return true;
             }
        }
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

function detectQalqalah(text, index) {
    if (QALQALAH.includes(text[index]) && text[index + 1] === SUKUN) {
        rules.push({ index: index, length: 2, type: 'tajweed-qalqalah' });
    }
}

function detectNunSakinah(text, i) {
    const { isTrigger, triggerLength } = isNunSakinahOrTanween(text, i);
    //console.log(`Is trigger: ${isTrigger}, length: ${triggerLength}`);

    if (!isTrigger) return null;

    let searchIndex = i + triggerLength;

    // For tanween, check if followed by alif maksura (possibly with diacritics in between)
    if (TANWEEN.includes(text[i])) {
        let j = i + triggerLength;
        while (j < text.length && isDiacritic(text[j])) {
            j++;
        }
        if (text[j] === 'ا' || text[j] === 'ى') {
            searchIndex = j + 1;
        }
    }

    let nextLetterIndex = searchIndex;
    while (nextLetterIndex < text.length) {
        const char = text[nextLetterIndex];
        if (isArabicLetter(char)) break;
        if (Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END) return null;
        nextLetterIndex++;
    }
    if (nextLetterIndex >= text.length) return null;

    const nextLetter = text[nextLetterIndex];

    // Check for exceptions before processing idgham
    if (isExceptionToIdgham(text, i, nextLetterIndex)) {
        return null; // No idgham for exception words
    }

    let triggerStartIndex = i;
    if (TANWEEN.includes(text[i])) {
        let k = i - 1;
        while (k >= 0 && isDiacritic(text[k])) {
            k--;
        }
        triggerStartIndex = k;
    }

    const triggerGroupLength = searchIndex - triggerStartIndex;
    const fullLength = (nextLetterIndex - triggerStartIndex) + 1;

    if (YANMOU_LETTERS.includes(nextLetter)) {
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-idgham-bi-ghunna', length: fullLength +1 },
            target: { index: nextLetterIndex, type: 'tajweed-idgham-bi-ghunna', length: 1 },
        };
    }

    if (IDGHAM_BILA_GHUNNA_LETTERS.includes(nextLetter)) {
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-idgham-bila-ghunna', length: fullLength +1 },
            target: { index: nextLetterIndex, type: 'tajweed-idgham-bila-ghunna', length: 1 },
        };
    }

    if (IQLAB_LETTERS.includes(nextLetter)) {
        return { trigger: { index: triggerStartIndex, type: 'tajweed-iqlab', length: fullLength }, target: null };
    }

    if (IKHFA_LETTERS.includes(nextLetter)) {
        return { trigger: { index: triggerStartIndex, type: 'tajweed-ikhfa', length: triggerGroupLength }, target: null };
    }

    return null;
}

function detectSilatHa(text, i) {
    const curr = text[i];
    if (curr !== 'ه') {
        return null;
    }

    // Check if Ha has Fatha
    let checkIndex = i + 1;
    while (checkIndex < text.length && isDiacritic(text[checkIndex])) {
        if (text[checkIndex] === FATHA) return null;
        checkIndex++;
    }

    let nextCharIndex = i + 1;
    while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
        nextCharIndex++;
    }

    // Check if ه is at word end
    if (nextCharIndex < text.length) {
        const charAfterHa = text[nextCharIndex];
        const isWordBoundary = charAfterHa === ' ' || WAQF_CLASSES[charAfterHa] || charAfterHa === AYAH_END || !isArabicLetter(charAfterHa);
        if (!isWordBoundary) {
            return null; // ه is not at word end
        }
    }

    // Check if previous letter has a vowel
    let prevLetterIndex = i - 1;
    let hasVowelOnPrev = false;

    // Skip back over diacritics to find the previous letter
    while (prevLetterIndex >= 0 && isDiacritic(text[prevLetterIndex])) {
        // Check if any diacritic is a vowel
        if (text[prevLetterIndex] === DAMMA || text[prevLetterIndex] === FATHA || text[prevLetterIndex] === KASRA) {
            hasVowelOnPrev = true;
        }
        prevLetterIndex--;
    }

    if (!hasVowelOnPrev) {
        return null; // Previous letter must have a vowel
    }

    let ruleLength = nextCharIndex - i;
    rules.push({ index: i, length: ruleLength, type: 'tajweed-silat-ha' });
    return true;
}

function isNunSakinahOrTanween(text, i) {
    const curr = text[i];

    // Check for noon with sukun (either regular sukun or subscript alef)
    if (curr === NOON && (text[i + 1] === SUKUN || text[i + 1] === '\u0656')) {
        return { isTrigger: true, triggerLength: 2 };
    }

    if (TANWEEN.includes(curr)) { 
        return { isTrigger: true, triggerLength: 1 };
    }

    // Check for noon without explicit vowel
    if (curr === NOON && !isVowel(text[i + 1]) && text[i + 1] !== SHADDA) {
        return { isTrigger: true, triggerLength: 1 };
    }

    return { isTrigger: false, triggerLength: 0 };
}

function detectGhunna(text, i) {
    // Ghunna on Noon/Meem Mushaddadah
    const curr = text[i];
    if (curr === NOON || curr === MEEM) {
        let j = i + 1;
        let foundShadda = false;
        while (j < text.length && isDiacritic(text[j])) {
            if (text[j] === SHADDA) {
                foundShadda = true;
                break;
            }
            j++;
        }
        if (foundShadda) {
            rules.push({ index: i, length: 0, type: 'tajweed-ghunna' });
        }
    }
}

function isMaddAsliHamzaOnWaw(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    const char = text[index];

    // Hamza on Waw
    if (char !== 'ؤ') {
        return false;
    }

    // Look for the vowel on the hamza
    for (let i = index + 1; i < text.length; i++) {
        const diacritic = text[i];

        // Dammah → madd asli
        if (diacritic === '\u064F') { // DAMMA
            return true;
        }

        // Stop if we hit a non-diacritic
        if (diacritic < '\u064B' || diacritic > '\u065F') {
            break;
        }
    }

    return false;
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
    
    let i = index + 1;
    while (i < text.length && isDiacritic(text[i])) {
        if (text[i] === FATHATAN) return true;
        i++;
    }
    return false;
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

function hasHamzaAfter(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }
    
    let i = index + 1;
    while (i < text.length) {
        const char = text[i];
        
        // Skip diacritics
        if (char >= '\u064B' && char <= '\u065F') {
            i++;
            continue;
        }
        
        // Check if it's a hamza (standalone or on carrier)
        return char === 'ء' || char === 'أ' || char === 'إ' || char === 'ؤ' || char === 'ئ' || char === 'ࢨ' || char === 'یٖٔ';
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
        if (isDiacritic(char) || char === '\u0640') {
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
        if (isDiacritic(char) || char === ' ' || char === '\u0640') {
            continue;
        }

        return i; // Found base letter
    }

    return -1;
}

//HELPER FUNCTIONS AND CONSTANTS
const ARABIC_LETTER_REGEX = /[\u0600-\u06FF]/;

function isArabicLetter(char) {
    return (char >= '\u0621' && char <= '\u064A') || char === 'ی'; // hamza → ya
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

function isHamzatWasl(char) {
    return char === ALIF;
}

function startsWithAl(text, index) {
    let i = index;

    // skip spaces
    while (i < text.length && text[i] === ' ') i++;

    return (
        text[i] === ALIF &&
        text[i + 1] === LAM
    );
}

function causesIltiqaSakinayn(text, index) {
    // only relevant for madd letters
    if (text[index] !== 'و' && text[index] !== 'ي' && text[index] !== ALIF) {
        return false;
    }

    // madd letter must be sākin
    if (hasArabicVowel(text, index)) {
        return false;
    }

    let i = index + 1;
    if (isHamzatWasl(text[index + 1])) {
        i++;
    }

    return startsWithAl(text, i) || isHamzatWasl(text[i + 1]);
}

function isVowel(char) {
    return char === FATHA || char === DAMMA || char === KASRA || char === SUKUN;
}

function isVowelWithoutSukun(char) {
    return char === FATHA || char === DAMMA || char === KASRA;
}

function isDiacritic(char) {
    return /[\u064B-\u065F\u0670\u0653]/.test(char);
}

function isExceptionToIdgham(text, noonIndex, yawawIndex) {
    // First, check if the next letter is ي or و
    const nextLetter = text[yawawIndex];
    const isYawaw = nextLetter === 'ي' || nextLetter === 'ی' || nextLetter === 'ى' || nextLetter === 'و';
    if (!isYawaw) {
        return false;
    }

    // Get the full word containing the noon
    let wordStart = noonIndex;
    let wordEnd = noonIndex;

    // Find start of word
    while (wordStart > 0 && !isWordBreak(text[wordStart - 1])) {
        wordStart--;
    }

    // Find end of word
    while (wordEnd < text.length && !isWordBreak(text[wordEnd])) {
        wordEnd++;
    }

    // Extract the word
    const wordWithDiacritics = text.slice(wordStart, wordEnd);

    // Remove all diacritics for comparison
    const word = wordWithDiacritics.replace(/[\u064B-\u065F\u0670\u0653]/g, '');

    //console.log(`Checking exception for word: "${word}" from "${wordWithDiacritics}"`);

    // List of exception words (without diacritics)
    // Now includes both with and without definite article "ال"
    const exceptionWords = [
        'دنيا', 'دنیا', // dunya (without Al)
        'الدنیا', 'الدنيا', // dunya with definite article Al-
        'صنوان', // sinwan
        'قنوان', // qinwan
        'بنيان', 'بنیان' // bunyan
    ];

    const isException = exceptionWords.includes(word);
    //console.log(`Is exception: ${isException}`);

    return isException;
}


const FATHA = '\u064E';
const FATHATAN = '\u064B';
const SHADDA = '\u0651';
const SUKUN = '\u0652';
const QASR = '\u08D1';
const DAMMA = '\u064F';
const KASRA = '\u0650';

const ALIF = '\u0627';
const ALIF_MAKSURA = 'ی';
const SUBSCRIPT_ALIF = '\u0656';
const SUPERSCRIPT_ALIF = '\u0670';
const YA = '\u064A';

const LAM = '\u0644';
const MEEM = '\u0645';
const NOON = '\u0646';

const AYAH_END = '\u06DD'; // ۝

const maddTypes = [
    { char: ALIF, type: 'tajweed-madd-asli', length: 1 },
    { char: 'و', type: 'tajweed-madd-asli', length: 1 },
    { char: SUPERSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 1 },
    { char: SUBSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 2 }
];

const MUQATTAAT = ['ا', 'ل', 'م', 'ك', 'ه', 'ي', 'ع', 'ص', 'ط', 'س', 'ح', 'ق', 'ن'];
const QALQALAH = ['ق', 'ط', 'ب', 'ج', 'د'];

const TANWEEN = ['\u064B', '\u064C', '\u064D']; // Fathatan, Dammatan, Kasratan

const YANMOU_LETTERS = ['ي', 'ی', 'ى', 'ن', 'م', 'و']; // Added Persian Yeh and Alif Maksura
const IDGHAM_BILA_GHUNNA_LETTERS = ['ل', 'ر'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IQLAB_LETTERS = ['ب'];
