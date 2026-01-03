// --- Constants ---
const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';
const SHADDA = '\u0651';
const SUKUN = '\u0652';
const ALIF_MADDAH = '\u0622';
const DAGGER_ALIF = '\u0670';
const SUBSCRIPT_ALIF = '\u0656';
const MADDAH_ABOVE = '\u0653';
const AYAH_END = '\u06DD'; // ۝
const HAMZAT_WASL = '\u0671';
const ALIF = '\u0627';

const HAMZA_FORMS = ['ء', 'أ', 'إ', 'ؤ', 'ئ'];
const TANWEEN = ['\u064B', '\u064C', '\u064D']; // Fathatan, Dammatan, Kasratan

const YANMOU_LETTERS = ['ي', 'ن', 'م', 'و'];
const IDGHAM_BILA_GHUNNA_LETTERS = ['ل', 'ر'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IQLAB_LETTERS = ['ب'];
const QALQALAH_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
const HURUF_MUQATTAAT = ['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن'];
const SUN_LETTERS = ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'];


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

// --- Main Tajweed Function ---
function applyTajweed(text) {
    const rules = detectAllRules(text);
    return buildHtmlFromRules(text, rules);
}

// --- Rule Detection Engine ---
function detectAllRules(text) {
    const rules = [];
    for (let i = 0; i < text.length; i++) {
        if (alreadyMarked(rules, i)) continue;

        const curr = text[i];
        const next = text[i + 1] || '';
        const prev = text[i - 1] || '';

        // Priority 1: Waqf Signs
        const waqfClass = WAQF_CLASSES[curr];
        if (waqfClass) {
            addRule(rules, i, 1, waqfClass);
            continue;
        }

        // Priority 2: Iltiqa as-Sakinain (meeting of two silent letters)
        if (isMaddLetter(curr, prev) && !isDiacritic(next) && isFollowedBySilentStart(text, i)) {
            addRule(rules, i, 1, 'silent-letter');
            continue;
        }

        // Priority 3: Other Tajweed Rules
        if (curr === 'و' && next === '\u08d1') {
            addRule(rules, i, 1, 'tajweed-qasr');
            addRule(rules, i + 1, 1, 'hidden-char');
            continue;
        }

        if (curr === '\u08d1') {
            addRule(rules, i, 1, 'hidden-char');
            continue;
        }

        if (QALQALAH_LETTERS.includes(curr) && next === SUKUN) {
            addRule(rules, i, 2, 'tajweed-qalqalah');
            continue;
        }

        const maddRule = detectMaddRule(text, i, curr, next, prev);
        if (maddRule) {
            addRule(rules, maddRule.index, maddRule.length, `tajweed-${maddRule.type}`);
            if (alreadyMarked(rules, i)) continue;
        }

        // Ghunna on Noon/Meem Mushaddadah
        if (curr === 'ن' || curr === 'م') {
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
                let diff = text[i+3] === ALIF ? 3 : text[i+3] === MADDAH_ABOVE ? 1 :0;
                addRule(rules, i-diff, j - i + diff +1, 'tajweed-ghunna');
                continue;
            }
        }

        const nunSakinahResult = detectNunSakinahRule(text, i);
        if (nunSakinahResult) {
            addRule(rules, nunSakinahResult.trigger.index, nunSakinahResult.trigger.length, nunSakinahResult.trigger.type);
            if (nunSakinahResult.target) {
                //addRule(rules, nunSakinahResult.target.index, nunSakinahResult.target.length, nunSakinahResult.target.type);
            }
            continue;
        }

        // Silent letters need to be detected before madd rules to avoid incorrect madd detection
        const silentLetterRule = detectSilentLetter(text, i);
        if (silentLetterRule) {
            addRule(rules, silentLetterRule.index, silentLetterRule.length, 'silent-letter');
            i = silentLetterRule.index + silentLetterRule.length - 1;
            continue;
        }
    }
    return rules;
}

// --- Rule-Specific Detectors ---

function detectSilentLetter(text, i) {
    const curr = text[i];
    const prev = text[i - 1] || '';

    // Case 1: Silent alif after tanween fathah
    if (curr === 'ا' && prev === TANWEEN[0]) {
        return { index: i, length: 1 };
    }

    // Case 2: Silent alif after plural wauw
    if (curr === 'ا') {
        if (prev === 'و' && text[i-2] === DAMMA) return { index: i, length: 1 };
        if (prev === MADDAH_ABOVE && text[i-2] === 'و' && text[i-3] === DAMMA) return { index: i, length: 1 };
    }

    // Case 3: Definite Article "ال"
    if (curr === 'ا' || curr === HAMZAT_WASL) {
        const isConnected = i > 0;
        if (isConnected) {
            let lamIndex = i + 1;
            if (text[lamIndex] === FATHA) lamIndex++; // Skip Fatha on Alif if present

            if (text[lamIndex] === 'ل') {
                // Handle special case for words like الَّذِينَ where the laam has a shadda
                if (text[lamIndex + 1] === SHADDA) {
                    if (isVowel(prev) || prev === ' ') {
                        return { index: i, length: 1 }; // Only alif is silent
                    }
                    return null;
                }

                let afterLamIndex = lamIndex + 1;
                let shaddaOnLam = false;
                while (afterLamIndex < text.length && !isArabicLetter(text[afterLamIndex])) {
                    if (text[afterLamIndex] === SHADDA) shaddaOnLam = true;
                    afterLamIndex++;
                }

                if (afterLamIndex < text.length) {
                    const afterLamChar = text[afterLamIndex];
                    let shaddaOnNext = false;
                    if (!shaddaOnLam) {
                        let k = afterLamIndex + 1;
                        while (k < text.length && isDiacritic(text[k])) {
                            if (text[k] === SHADDA) {
                                shaddaOnNext = true;
                                break;
                            }
                            k++;
                        }
                    }

                    const isShamsi = SUN_LETTERS.includes(afterLamChar) && shaddaOnNext;

                    if (shaddaOnLam) {
                        if (isVowel(prev) || prev === ' ') {
                            return { index: i, length: 1 };
                        }
                        return null;
                    }

                    if (isShamsi) {
                        return { index: i, length: lamIndex - i + 1 }; // Both alif and lam silent
                    } else if (isVowel(prev) || prev === ' ') {
                        return { index: i, length: 1 }; // Only alif silent (Qamari)
                    }
                }
            }
        }
    }

    // Case 4: Lam Shamsi at the beginning of text
    if (i === 0 && (curr === 'ا' || curr === HAMZAT_WASL)) {
        let lamIndex = i + 1;
        if (text[lamIndex] === FATHA) lamIndex++; // Skip Fatha on Alif

        if (text[lamIndex] === 'ل') {
            let afterLamIndex = lamIndex + 1;
            let shaddaOnLam = false;
            while (afterLamIndex < text.length && !isArabicLetter(text[afterLamIndex])) {
                if (text[afterLamIndex] === SHADDA) shaddaOnLam = true;
                afterLamIndex++;
            }
            if (afterLamIndex >= text.length) return null;

            const afterLamChar = text[afterLamIndex];
            let shaddaOnNext = false;
            if (!shaddaOnLam) {
                let k = afterLamIndex + 1;
                while (k < text.length && isDiacritic(text[k])) {
                    if (text[k] === SHADDA) {
                        shaddaOnNext = true;
                        break;
                    }
                    k++;
                }
            }

            if (SUN_LETTERS.includes(afterLamChar) && shaddaOnNext) {
                return { index: lamIndex, length: 1 }; // Only lam silent
            }
        }
    }

    // Case 5: Hamzat Wasl after Fa or Waw (e.g., فَاتَّقُوا)
    if (curr === 'ا' && prev === FATHA) {
        const prevChar = text[i-2];
        if (prevChar === 'ف' || prevChar === 'و') {
            // Check if next letter has shadda (indicating assimilation or Form VIII verb)
            let nextCharIndex = i + 1;
            while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
                if (text[nextCharIndex] === SHADDA) {
                    return { index: i, length: 1 };
                }
                nextCharIndex++;
            }
            // Also check the character after the next character (for shadda on the letter after Alif)
            if (nextCharIndex < text.length) {
                let k = nextCharIndex + 1;
                while (k < text.length && isDiacritic(text[k])) {
                    if (text[k] === SHADDA) {
                        return { index: i, length: 1 };
                    }
                    k++;
                }
            }
        }
    }

    return null;
}


function detectMaddRule(text, i, curr, next, prev) {
    // Madd Lazim Harfi
    if (HURUF_MUQATTAAT.includes(curr) && next === MADDAH_ABOVE) {
        return { index: i, length: 2, type: 'madd-lazim' };
    }

    // Dagger Alif / Subscript Alif
    let lookaheadIndex = i + 1;
    if (text[lookaheadIndex] === SHADDA) lookaheadIndex++;
    if (text[lookaheadIndex] === FATHA) lookaheadIndex++;

    if (text[lookaheadIndex] === DAGGER_ALIF || text[lookaheadIndex] === SUBSCRIPT_ALIF) {
        const daggerType = text[lookaheadIndex];
        if (daggerType === SUBSCRIPT_ALIF && (text[lookaheadIndex + 1] === 'ي' || text[lookaheadIndex + 1] === 'ی' || text[lookaheadIndex + 1] === 'ى')) return null;

        let length = (lookaheadIndex - i) + 1;
        let hasMaddah = false;
        if (text[lookaheadIndex + 1] === MADDAH_ABOVE) {
            length++;
            hasMaddah = true;
        }

        let type = 'madd-asli';
        if (isMaddLazim(text, lookaheadIndex)) type = 'madd-lazim';
        else if (isMaddArid(text, lookaheadIndex)) type = 'madd-arid';
        else if (isMaddMuttasil(text, lookaheadIndex)) type = 'madd-muttasil';
        else if (isMaddMunfasil(text, lookaheadIndex)) type = 'madd-munfasil';
        else if (hasMaddah) type = 'madd-munfasil';

        return { index: i, length: length, type: type };
    }

    // Madd al-Leen
    if (isMaddLeen(text, i, curr, prev, next)) {
        return { index: i-2, length: 4, type: 'madd-liin' };
    }

    // Standard Madd Letters
    if (isMaddLetter(curr, prev)) {
        if (next === MADDAH_ABOVE) {
            if (isMaddLazim(text, i)) return { index: i, length: 2, type: 'madd-lazim' };
            if (isMaddMuttasil(text, i)) return { index: i, length: 2, type: 'madd-muttasil' };
            if (isMaddMunfasil(text, i)) return { index: i, length: 2, type: 'madd-munfasil' };
            return { index: i, length: 2, type: 'madd-munfasil' };
        }

        if (isDiacritic(next)) return null;

        if (isMaddLazim(text, i)) return { index: i-4, length: 4, type: 'madd-lazim' };
        if (isMaddArid(text, i)) return { index: i-3, length: 4, type: 'madd-arid' };
        if (isMaddMuttasil(text, i)) return { index: i-3, length: 4, type: 'madd-muttasil' };
        if (isMaddMunfasil(text, i)) return { index: (text[i-2] === SHADDA ? i-1 : i-3), length: (text[i-2] === SHADDA ? 2 : 4), type: 'madd-munfasil' };

        let length = 3;
        if (prev === SHADDA) {
            i --;
            length++;
        }
        return { index: i-2, length: length, type: 'madd-asli' };
    }

    // Alif Maddah
    if (curr === ALIF_MADDAH) {
        if (isMaddLazim(text, i)) return { index: i, length: 1, type: 'madd-lazim' };
        if (isMaddMuttasil(text, i)) return { index: i, length: 1, type: 'madd-muttasil' };
        if (isMaddMunfasil(text, i)) return { index: i, length: 1, type: 'madd-munfasil' };
        return { index: i-2, length: 3, type: 'madd-asli' };
    }

    return null;
}

function detectNunSakinahRule(text, i) {
    const { isTrigger, triggerLength } = isNunSakinahOrTanween(text, i);
    if (!isTrigger) return null;

    let searchIndex = i + triggerLength;
    if (TANWEEN.includes(text[i]) && (text[i+1] === 'ا' || text[i+1] === 'ى')) {
        searchIndex++;
    }

    let nextLetterIndex = searchIndex;
    while (nextLetterIndex < text.length) {
        const char = text[nextLetterIndex];
        if (isArabicLetter(char)) break;
        if (Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END) return null; // Stop at waqf/ayah end
        nextLetterIndex++;
    }
    if (nextLetterIndex >= text.length) return null;

    const nextLetter = text[nextLetterIndex];
    const triggerStartIndex = TANWEEN.includes(text[i]) ? i - 1 : i;
    const finalTriggerLength = searchIndex - triggerStartIndex;

    if (YANMOU_LETTERS.includes(nextLetter)) {
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-idgham-bi-ghunna', length: finalTriggerLength },
            target: { index: nextLetterIndex, type: 'tajweed-idgham-bi-ghunna', length: 1 },
        };
    }
    if (IDGHAM_BILA_GHUNNA_LETTERS.includes(nextLetter)) {
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-idgham-bila-ghunna', length: finalTriggerLength },
            target: { index: nextLetterIndex, type: 'tajweed-idgham-bila-ghunna', length: 1 },
        };
    }
    if (IKHFA_LETTERS.includes(nextLetter)) {
        return { trigger: { index: triggerStartIndex, type: 'tajweed-ikhfa', length: finalTriggerLength }, target: null };
    }
    if (IQLAB_LETTERS.includes(nextLetter)) {
        return { trigger: { index: triggerStartIndex, type: 'tajweed-iqlab', length: finalTriggerLength }, target: null };
    }
    return null;
}


// --- HTML Builder ---
function buildHtmlFromRules(text, rules) {
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


// --- Helper Functions ---

function isArabicLetter(char) {
    return /[\u0621-\u064A]/.test(char);
}

function isNunSakinahOrTanween(text, i) {
    const curr = text[i];
    if (curr === 'ن' && text[i+1] === SUKUN) return { isTrigger: true, triggerLength: 2 };
    if (TANWEEN.includes(curr)) return { isTrigger: true, triggerLength: 1 };
    if (curr === 'ن' && !isVowel(text[i+1]) && text[i+1] !== SHADDA) return { isTrigger: true, triggerLength: 1 };
    return { isTrigger: false, triggerLength: 0 };
}

function isVowel(char) {
    return char === FATHA || char === DAMMA || char === KASRA;
}

function isMaddLetter(curr, prev) {
    return (
        (curr === 'ا' && (prev === FATHA || prev === SHADDA || prev === MADDAH_ABOVE)) ||
        (curr === 'و' && (prev === DAMMA || prev === MADDAH_ABOVE)) ||
        ((curr === 'ي' || curr === 'ی' || curr === 'ى') && (prev === KASRA || prev === SUBSCRIPT_ALIF || prev === MADDAH_ABOVE))
    );
}

function isMaddLeen(text, i, curr, prev, next) {
    if (!((curr === 'و' || curr === 'ي' || curr === 'ی' || curr === 'ى') && prev === FATHA && next === SUKUN)) {
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
    return letterCount === 1 && isAtStop(text, j);
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

function isMaddLazim(text, i) {
    let j = i + 1;

    // Skip optional maddah mark immediately after the madd letter
    if (text[j] === MADDAH_ABOVE) j++;

    // Find the next Arabic letter (skip harakat/marks)
    while (j < text.length && !isArabicLetter(text[j])) {
        if (text[j] === ' ' || isWordBreak(text[j])) return false;
        j++;
    }
    if (j >= text.length) return false;

    // Now inspect the diacritics on that next letter
    let k = j + 1;
    while (k < text.length && isDiacritic(text[k])) {
        if ((text[k] === SUKUN || text[k] === SHADDA) && text[k-1] !== FATHA) {
            return true;
        }
        k++;
    }

    return false;
}

function isMaddArid(text, i) {
    let j = i + 1;
    if (text[j] === MADDAH_ABOVE) j++;

    if (j >= text.length) return false;
    const nextChar = text[j];
    if (HAMZA_FORMS.includes(nextChar) || isDiacritic(nextChar) || isWordBreak(nextChar)) return false;
    j++;
    while (j < text.length && isDiacritic(text[j])) { j++; }
    if (j >= text.length) return true;
    const charAtBreak = text[j];
    if (Object.keys(WAQF_CLASSES).includes(charAtBreak) || charAtBreak === AYAH_END) return true;
    if (/\s/.test(charAtBreak)) {
        let k = j + 1;
        while (k < text.length && /\s/.test(text[k])) { k++; }
        if (k >= text.length) return true;
        const charAfterSpace = text[k];
        return Object.keys(WAQF_CLASSES).includes(charAfterSpace) || charAfterSpace === AYAH_END;
    }
    return false;
}

function isMaddMuttasil(text, i) {
    let j = i + 1;
    if (text[j] === MADDAH_ABOVE) j++;
    const nextChar = text[j];
    return HAMZA_FORMS.includes(nextChar);
}

function isMaddMunfasil(text, i) {
    let j = i + 1;
    if (text[j] === MADDAH_ABOVE) j++;

    // Skip silent Alif after Waw
    if (text[i] === 'و' && text[j] === 'ا') {
        j++;
    }

    while (j < text.length && /\s/.test(text[j])) { j++; }

    if (j >= text.length) return false;

    const nextChar = text[j];
    if (HAMZA_FORMS.includes(nextChar)) return true;
    if (nextChar === 'ا' && (j + 1 < text.length && isVowel(text[j+1]))) return true;
    if (nextChar === ALIF_MADDAH) return true;

    return false;
}

function isFollowedBySilentStart(text, index) {
    let j = index + 1;

    // Skip the silent alif after plural wauw if present
    if (text[index] === 'و' && text[j] === 'ا') {
        j++;
    }

    while (j < text.length && (text[j] === ' ' || isDiacritic(text[j]))) {
        j++;
    }
    if (j >= text.length) return false;

    const nextChar = text[j];
    if (nextChar === HAMZAT_WASL) return true;
    if (nextChar === 'ا' && text[j+1] === 'ل') {
        return true;
    }
    return false;
}

function isDiacritic(char) {
    return /[\u064B-\u065F\u0670\u0653]/.test(char);
}

function isWordBreak(char) {
    return /\s/.test(char) || Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END;
}

function addRule(rules, index, length, type) {
    if (!alreadyMarked(rules, index)) {
        rules.push({ index, length, type });
    }
}

function alreadyMarked(rules, index) {
    return rules.some(r => index >= r.index && index < r.index + r.length);
}

