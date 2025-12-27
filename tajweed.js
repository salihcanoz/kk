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

const HAMZA_FORMS = ['ء', 'أ', 'إ', 'ؤ', 'ئ'];
const TANWEEN = ['\u064B', '\u064C', '\u064D']; // Fathatan, Dammatan, Kasratan

const YANMOU_LETTERS = ['ي', 'ن', 'م', 'و'];
const IDGHAM_BILA_GHUNNA_LETTERS = ['ل', 'ر'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IQLAB_LETTERS = ['ب'];
const QALQALAH_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
const HURUF_MUQATTAAT = ['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن'];

const WAQF_CLASSES = {
  '\u06D8': 'waqf-lazim',    // Meem
  '\u0615': 'waqf-awla',     // Ta
  '\u06DA': 'waqf-jaiz',     // Jeem
  '\u06D7': 'waqf-awla',     // Qala
  '\u06D6': 'waqf-continue', // Sala
  '\u06DB': 'waqf-muanaqah', // Mu'anaqah
  '\u0619': 'waqf-jaiz'      // Small high dotless head of khah
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

    // Waqf Signs
    const waqfClass = WAQF_CLASSES[curr];
    if (waqfClass) {
      addRule(rules, i, 1, waqfClass);
      continue;
    }

    // Noon Sakinah & Tanween
    const nunSakinahResult = detectNunSakinahRule(text, i);
    if (nunSakinahResult) {
      addRule(rules, nunSakinahResult.trigger.index, nunSakinahResult.trigger.length, nunSakinahResult.trigger.type);
      if (nunSakinahResult.target) {
        addRule(rules, nunSakinahResult.target.index, nunSakinahResult.target.length, nunSakinahResult.target.type);
        if(text[nunSakinahResult.target.index+1] === SHADDA) {
            addRule(rules, nunSakinahResult.target.index+1, 1, nunSakinahResult.target.type);
        }
      }
      continue;
    }

    // Ghunnah (Mushaddad Nun/Meem)
    if ((curr === 'ن' || curr === 'م') && next === SHADDA) {
        addRule(rules, i, 2, 'tajweed-ghunna'); // Mark letter + shadda
        continue;
    }

    // Qalqalah
    if (QALQALAH_LETTERS.includes(curr) && next === SUKUN) {
        addRule(rules, i, 2, 'tajweed-qalqalah'); // Mark letter + sukun
        continue;
    }

    // Madd Rules
    const maddRule = detectMaddRule(text, i, curr, next, prev);
    if (maddRule) {
        addRule(rules, maddRule.index, maddRule.length, `tajweed-${maddRule.type}`);
        if (maddRule.alsoMarkPrev) {
             addRule(rules, i - 1, 1, `tajweed-${maddRule.type}`);
        }
    }
  }
  return rules;
}

// --- Rule-Specific Detectors ---

function detectMaddRule(text, i, curr, next, prev) {
    // Madd Lazim Harfi
    if (HURUF_MUQATTAAT.includes(curr) && next === MADDAH_ABOVE) {
        return { index: i, length: 2, type: 'madd-lazim' };
    }

    // Dagger Alif / Subscript Alif
    if (next === DAGGER_ALIF || next === SUBSCRIPT_ALIF) {
        const charAfter = text[i + 2];
        if (next === SUBSCRIPT_ALIF && (charAfter === 'ي' || charAfter === 'ی' || charAfter === 'ى')) return null;
        if (isFollowedBySilentStart(text, i + 1)) return null;

        let length = 2;
        let hasMaddah = false;
        if (charAfter === MADDAH_ABOVE) {
            length = 3;
            hasMaddah = true;
        }

        let type = 'madd-asli';
        if (isMaddLazim(text, i + 1)) type = 'madd-lazim';
        else if (isMaddArid(text, i + 1)) type = 'madd-arid';
        else if (isMaddMuttasil(text, i + 1)) type = 'madd-muttasil';
        else if (isMaddMunfasil(text, i + 1)) type = 'madd-munfasil';
        else if (hasMaddah) type = 'madd-munfasil';

        return { index: i, length: length, type: type };
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
        if (isFollowedBySilentStart(text, i)) return null;

        if (isMaddLazim(text, i)) return { index: i, length: 1, type: 'madd-lazim' };
        if (isMaddArid(text, i)) return { index: i, length: 1, type: 'madd-arid' };
        if (isMaddMuttasil(text, i)) return { index: i, length: 1, type: 'madd-muttasil' };
        if (isMaddMunfasil(text, i)) return { index: i, length: 1, type: 'madd-munfasil' };
        return { index: i, length: 1, type: 'madd-asli' };
    }

    // Alif Maddah
    if (curr === ALIF_MADDAH) {
        if (isMaddMuttasil(text, i)) return { index: i, length: 1, type: 'madd-muttasil' };
        if (isMaddMunfasil(text, i)) return { index: i, length: 1, type: 'madd-munfasil' };
        return { index: i, length: 1, type: 'madd-asli' };
    }

    return null;
}

function detectNunSakinahRule(text, i) {
    const { isTrigger, triggerLength } = isNunSakinahOrTanween(text, i);
    if (!isTrigger) return null;

    let searchIndex = i + triggerLength;
    // Skip silent Alif/Ya after Tanween
    if (TANWEEN.includes(text[i]) && (text[i+1] === 'ا' || text[i+1] === 'ى')) {
        searchIndex++;
    }

    // Find next actual letter, skipping spaces and diacritics and waqf signs
    let nextLetterIndex = searchIndex;
    while (nextLetterIndex < text.length) {
        const char = text[nextLetterIndex];
        if (isArabicLetter(char)) break;
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
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-ikhfa', length: finalTriggerLength },
            target: null
        };
    }
    if (IQLAB_LETTERS.includes(nextLetter)) {
        return {
            trigger: { index: triggerStartIndex, type: 'tajweed-iqlab', length: finalTriggerLength },
            target: null
        };
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
    output += `<span class="${rule.type}">${text.slice(rule.index, rule.index + rule.length)}</span>`;
    currentIndex = rule.index + rule.length;
  }

  output += text.slice(currentIndex);

  return output;
}


// --- Helper Functions ---

function isArabicLetter(char) {
    // Basic range for Arabic letters, excluding diacritics and symbols
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
    (curr === 'و' && prev === DAMMA) ||
    ((curr === 'ي' || curr === 'ی' || curr === 'ى') && (prev === KASRA || prev === SUBSCRIPT_ALIF))
  );
}

function isMaddLazim(text, i) {
    let j = i + 1;
    if (text[j] === MADDAH_ABOVE) j++;

    while (j < text.length && isDiacritic(text[j]) && text[j] !== SHADDA && text[j] !== SUKUN) { j++; }
    if (j >= text.length) return false;
    if (isWordBreak(text[j])) return false;
    let k = j + 1;
    while (k < text.length && isDiacritic(text[k])) {
        if (text[k] === SHADDA || text[k] === SUKUN) return true;
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

    // Skip spaces
    while (j < text.length && /\s/.test(text[j])) { j++; }

    if (j >= text.length) return false;

    const nextChar = text[j];

    // Check for standard Hamza forms
    if (HAMZA_FORMS.includes(nextChar)) return true;

    // Check for Alif with Vowel (which acts as Hamza)
    if (nextChar === 'ا') {
        if (j + 1 < text.length && isVowel(text[j+1])) {
            return true;
        }
    }

    // Check for Alif Maddah (which is Hamza + Alif)
    if (nextChar === ALIF_MADDAH) return true;

    return false;
}

function isFollowedBySilentStart(text, index) {
    let j = index + 1;
    if (text[j] === MADDAH_ABOVE) j++;

    while (j < text.length && /\s/.test(text[j])) { j++; }
    if (j >= text.length) return false;
    const nextChar = text[j];
    if (nextChar === '\u0671') return true;
    if (nextChar === '\u0627') {
        // It is silent start if Alif is NOT followed by a vowel or hamza sign
        // If it has a vowel, it's a Hamza (Munfasil). If not, it's silent (Wasl).
        return !(j + 1 < text.length && (isVowel(text[j+1]) || HAMZA_FORMS.includes(text[j+1])));
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
