let rules = [];

// Small helper to keep rule creation consistent.
function addRule(index, length, type) {
    rules.push({index, length, type});
}

function addRuleObject(rule) {
    if (rule) {
        rules.push(rule);
    }
}

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

    if (text.length === 0) {
        return [];
    }

    rules = [];

    // Detection order is important; the first matching rule may skip the rest.
    for (let i = 0; i < text.length; i++) {
        let found = detectHurufMuqattaat(text, i);
        if (found) {
            continue;
        }

        found = detectSilentAlifLam(text, i);
        if (found) {
            continue;
        }

        found = detectSilentAlifLamInAllah(text, i);
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
            addRuleObject(nunRule.trigger);
            addRuleObject(nunRule.target);
        }

        found = detectIdghamMithlain(text, i);
        if (found) {
            continue;
        }

        detectGhunna(text, i);

        detectSilatHa(text, i);

        detectQasr(text, i);

        detectMed(text, i);

        detectTashiil(text, i);

        detectSakta(text, i);

        detectIshmam(text, i);

        detectWaqf(text, i);
    }
}

function buildHtmlFromRules(text) {
    // Sort by index and skip overlapping ranges.
    rules.sort((a, b) => a.index - b.index);

    let output = '';
    let currentIndex = 0;

    for (const rule of rules) {
        if (rule.index < currentIndex) {
            continue;
        }

        output += text.slice(currentIndex, rule.index);
        output += `<span class="${rule.type}">${text.slice(rule.index, rule.index + rule.length)}</span>`;
        currentIndex = rule.index + rule.length;
    }

    output += text.slice(currentIndex);
    return output.trimEnd();
}

function detectSilentAlifLam(text, i) {
    if (text[i] !== ALIF || text[i + 1] !== LAM) {
        return false;
    }

    if (!isLinkedAlifLamStart(text, i)) {
        return false;
    }
    // If the lam carries a vowel/tanween, this is not the definite article.
    if (hasHarakat(text, i + 1)) {
        return false;
    }

    let nextCharIndex = i + 2;
    while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
        nextCharIndex++;
    }

    if (nextCharIndex >= text.length || !isArabicLetter(text[nextCharIndex])) {
        return false;
    }

    if (hasShadda(text, nextCharIndex)) {
        if (isStartOfSpeech(text, i)) {
            addRule(i + 1, 1, 'silent-letter');
        }
        else {
            addRule(i, 2, 'silent-letter');
        }
        return true;
    }

    if (!isStartOfSpeech(text, i)) {
        addRule(i, 1, 'silent-letter');
        return true;
    }
    return false;
}

function isPrefixedAlifLamStart(text, index) {
    if (!isAlifLamAfterPrefix(text, index)) {
        return false;
    }

    const prevIndex = getPreviousBaseLetterIndex(text, index);
    if (prevIndex === -1) {
        return false;
    }

    return hasVowelWithoutSukun(text, prevIndex);
}

function isLinkedAlifLamStart(text, index) {
    return isWordStart(text, index) || isAlifLamAfterPrefix(text, index) || isAlifLamAfterDhu(text, index);
}

function isAlifLamAfterDhu(text, index) {
    const prevWord = getWordBeforeIndex(text, index);
    if (!prevWord) return false;
    return normalizeArabicWord(prevWord) === 'ذو';
}

function normalizeArabicWord(word) {
    return word
        .replace(/[\u064B-\u065F\u0670\u0653\u0656]/g, '')
        .replace(/\u0640/g, '')
        .replace(/ی/g, 'ي')
        .replace(/ى/g, 'ي')
        .trim();
}

function isAlifLamAfterPrefix(text, index) {
    const prevIndex = getPreviousBaseLetterIndex(text, index);
    if (prevIndex === -1) return false;

    const prev = text[prevIndex];
    if (!ALIF_LAM_PREFIXES.includes(prev)) return false;

    return isWordStart(text, prevIndex);
}

function isHamzatWaslAlifLam(text, index) {
    if (text[index] !== ALIF || text[index + 1] !== LAM) {
        return false;
    }

    if (hasHamzaAfter(text, index)) {
        return false;
    }
    if (hasHarakat(text, index + 1)) {
        return false;
    }

    return isLinkedAlifLamStart(text, index);
}

function detectSilentAlifLamInAllah(text, i) {
    if (text[i] !== ALIF || text[i + 1] !== LAM || text[i + 2] !== LAM) {
        return false;
    }
    
    if (hasShadda(text, i + 2)) {
        addRule(i, 2, 'silent-letter');
        return true;
    }
    
    return false;
}

function detectSilentHamzatWasl(text, i) {
    if (text[i] !== ALIF) {
        return false;
    }

    if (text[i + 1] === LAM) {
        return false; // Handled by detectSilentAlifLam
    }

    if (!isWordStart(text, i)) {
        return false;
    }

    if (isStartOfSpeech(text, i)){
        return false;
    }

    if (hasHarakat(text, i)) {
        return false;
    }

    // Check for Superscript Alif or Madda
    let j = i + 1;
    while (j < text.length && isDiacritic(text[j])) {
        if (text[j] === SUPERSCRIPT_ALIF || text[j] === MADDA) return false;
        j++;
    }

    addRule(i, 1, 'silent-letter');
    return true;
}

function isStartOfSpeech(text, index) {
    if (index === 0) {
        return true;
    }

    for (let i = index - 1; i >= 0; i--) {
        const char = text[i];
        if (char === ' ') {
            continue;
        }

        return Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END;
    }
    return true;
}

function detectIdghamMutakaribain(text, i) {
    // Lam (ل) followed by Ra (ر), or Qaf (ق) followed by Kaf (ك)
    if (detectIdghamPair(text, i, LAM, 'ر')) return true;
    if (detectIdghamPair(text, i, 'ق', 'ك')) return true;
    return false;
}

function detectIdghamPair(text, index, currentChar, nextChar) {
    if (text[index] !== currentChar) return false;

    if (hasSukun(text, index) || !hasVowel(text, index)) {
        const nextIndex = getNextBaseLetterIndex(text, index + 1);
        if (nextIndex !== -1 && text[nextIndex] === nextChar) {
            const len = hasSukun(text, index) ? 2 : 1;
            addRule(index, len, 'tajweed-idgham-mutakaribain');
            return true;
        }
    }

    return false;
}

function detectMadds(text, index) {
    // Hamza above/below followed by alif (e.g., سَیِّــَٔاتُ)
    if ((text[index] === HAMZA_ABOVE || text[index] === HAMZA_BELOW) &&
        text[index + 1] === ALIF &&
        !hasVowel(text, index + 1)
    ) {
        if (hasTanweenBefore(text, index)) {
            return true;
        }
        if (hasMarkAfter(text, index + 1, SMALL_HIGH_NOON)) {
            return true;
        }
        let start = index;
        let length = 2;
        let carrier = index - 1;
        while (carrier >= 0 && isDiacritic(text[carrier])) {
            carrier--;
        }
        if (carrier >= 0 && !isWordBreak(text[carrier])) {
            start = carrier;
            length = (index + 2) - start;
        }
        else {
            const prev = text[index - 1];
            if (prev && (isVowelWithoutSukun(prev) || TANWEEN.includes(prev))) {
                start = index - 1;
                length = 3;
            }
        }
        addRule(start, length, 'tajweed-madd-asli');
        return true;
    }
    // Alif followed by small high noon (tanween sign) should not be marked as madd.
    if (text[index] === ALIF && hasMarkAfter(text, index, SMALL_HIGH_NOON)) {
        return true;
    }
    // If a word-ending alif meets a following plain hamzat wasl, don't mark madd.
    if (text[index] === ALIF &&
        !hasVowel(text, index) &&
        isWordEndAfter(text, index) &&
        nextWordStartsWithPlainHamzatWasl(text, index)
    ) {
        return true;
    }
    // Check for silent alif maksura due to iltiqaa as-sakinain first
    if ((text[index] === ALIF_MAKSURA || text[index] === ALIF_MAKSURA2) && !hasVowel(text, index)) {
        if (causesIltiqaSakinayn(text, index)) {
            addRule(index, 1, 'silent-letter');
            return true;
        }
    }

    // Check for silent alif after waw (including implicit sukun on waw)
    if (text[index] === ALIF && !hasVowel(text, index)) {
        let prevIndex = getPreviousBaseLetterIndex(text, index);
        if (prevIndex !== -1 && text[prevIndex] === WAW && (hasSukun(text, prevIndex) || !hasVowel(text, prevIndex)) && isWordEndAfter(text, index)) {
            addRule(index, 1, 'silent-letter');
            return true;
        }
    }

    for (const madd of maddTypes) {
        if (text[index - 1] && !isWordBreak(text[index - 1]) && text[index] === madd.char && !hasVowel(text, index)) {

            if (madd.char === ALIF) {
                if (isHamzatWaslAlifLam(text, index)) {
                    continue;
                }
                let prevIndex = getPreviousBaseLetterIndex(text, index);
                if (prevIndex !== -1 && text[prevIndex] === 'و' && !hasVowel(text, prevIndex)) {
                    continue;
                }
                if (text[index + 1] === SUPERSCRIPT_ALIF) {
                   continue;
                }                              
            }
            else if (madd.char === WAW) {
                let prevIndex = getPreviousBaseLetterIndex(text, index);
                if (
                    isWawJamaah(text, index) &&
                    !hasMadda(text, index) &&
                    !hasMadda(text, prevIndex) &&
                    nextWordStartsWithHamzatWasl(text, index)
                ) {
                    continue;
                }
                if (text[prevIndex + 1] !== DAMMA || text[prevIndex] === '\u0624') {
                    continue;
                }
            }

            let prevIndex = getPreviousBaseLetterIndex(text, index);
            if (hasSukun(text, prevIndex)) {
                continue;
            }

            // If a madd letter meets iltiqa as-sakinayn, don't apply madd.
            if (madd.char === WAW && causesIltiqaSakinayn(text, index)) {
                addRule(index, 1, 'silent-letter');
                return true;
            }

            let length = index - prevIndex + madd.length;
            let type = madd.type;
            let nextIndex = getNextBaseLetterIndex(text, index + madd.length);
            const immediateNextIndex = nextIndex;


            if ((madd.char === SUPERSCRIPT_ALIF || madd.char === SUBSCRIPT_ALIF) && nextIndex !== -1) {
                const nextChar = text[nextIndex];
                if (nextChar === ALIF || nextChar === ALIF_MAKSURA2 || nextChar === ALIF_MAKSURA || nextChar === YA || nextChar === 'و' || nextChar === '\u063D' || nextChar === '\u06D2') {
                    let isHamza = false;
                    let hasVowel = false;
                    let j = nextIndex + 1;
                    while (j < text.length && isDiacritic(text[j])) {
                        if (text[j] === HAMZA_ABOVE || text[j] === HAMZA_BELOW) {
                            isHamza = true;
                        }
                        if (text[j] >= '\u064B' && text[j] <= '\u0652') {
                            hasVowel = true;
                        }
                        j++;
                    }
                    if (!isHamza && !hasVowel) {
                        nextIndex = getNextBaseLetterIndex(text, nextIndex + 1);
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

            const shadda = hasShadda(text, nextIndex);

            if (nextIndex === -1) {
                type = 'tajweed-madd-asli';
            }
            else if (shadda) {
                if (hasMadda(text, index) || hasMadda(text, prevIndex)) {
                    type = 'tajweed-madd-lazim';
                }
                else if (madd.char === ALIF) {
                    addRule(index, 1, 'silent-letter');
                    return true;
                }
                else {
                    continue;
                }
            }
            else if (isSameWord(text, index, nextIndex) && isAtStop(text, checkStopIndex)) {
                if (hasFathataan(text, nextIndex) && text[nextIndex] !== 'ة') {
                    // Not Arid
                }
                else {
                    type = 'tajweed-madd-arid';
                }
            }
            else if (hasMadda(text, index)) {
                if (!isSameWord(text, index, nextIndex)) {
                    type = 'tajweed-madd-munfasil';
                    length++;
                    if (text[index+2] === ALIF_MAKSURA2) {
                        length++;
                    }
                }
                else {
                    type = 'tajweed-madd-muttasil';
                    length++;
                }
            }
            else if (hasMadda(text, prevIndex) && hasHamzaAfter(text, index)) {
                type = 'tajweed-madd-muttasil';
            }
            else if (hasMadda(text, prevIndex)) {
                type = 'tajweed-madd-munfasil';
                if (text[index + 1] === ALIF && !hasVowel(text, index + 1)) {
                    length++;
                }
            }
            else if (text[nextIndex] === ALIF
                && text[index] !== 'و'
                && !hasVowel(text, nextIndex)
            ) { // alif with sukun
                if (causesIltiqaSakinayn(text, index)) {
                    type = 'silent-letter';
                    prevIndex++;
                    //length += 2;
                }
            }
            else if (text[index] === ALIF &&
                (hasFathataan(text, prevIndex) || (text[index -1] === SHADDA ? text[index - 2] !== FATHA : text[index -1] !== FATHA))) { // waw with sukun
                continue
            }
            else if (hasQasr(text, index)) {
                continue;
            }
            else if (text[index] === ALIF && hasSukun(text, nextIndex)) { // alif with sukun
                type = 'silent-letter';
                prevIndex++;
                length--;
            }
            else if (causesIltiqaSakinayn(text, index)) {
                if (text[index] === ALIF || text[index] === ALIF_MAKSURA || text[index] === ALIF_MAKSURA2) {
                    type = 'silent-letter';
                    prevIndex++;
                    //length += 2;
                }
            }

            if (madd.char === 'و' && (type === 'tajweed-madd-asli' || type === 'tajweed-madd-arid')) {
                let nextCharIndex = index + 1;
                while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
                    nextCharIndex++;
                }
                if (nextCharIndex < text.length
                    && text[nextCharIndex] === ALIF
                    && !hasVowel(text, nextCharIndex)
                    && !isHamzatWaslAlifLam(text, nextCharIndex)
                ) {
                    length += (nextCharIndex - index);
                }
            }

            //lam-alif fix
            if (madd.char === ALIF && text[index-2] === LAM) {
                if (type === 'tajweed-madd-asli' && text[index + 1] === ' ') {
                    length++;
                }
                else if (type === 'tajweed-madd-arid') {
                    length++;
                }
            }

            if (madd.char === SUPERSCRIPT_ALIF
                && type === 'tajweed-madd-asli'
                && immediateNextIndex !== -1
                && isSameWord(text, index, immediateNextIndex)
                && (text[immediateNextIndex] === YA || text[immediateNextIndex] === ALIF_MAKSURA || text[immediateNextIndex] === ALIF_MAKSURA2)) {
                let end = immediateNextIndex + 1;
                while (end < text.length && isDiacritic(text[end])) {
                    end++;
                }
                length = end - prevIndex;
            }
            if (type === 'tajweed-madd-arid') {
                let candidate = nextIndex;
                if (candidate !== -1 && isWordBreak(text[candidate])) {
                    candidate = getPreviousBaseLetterIndex(text, candidate);
                }
                if (candidate !== -1
                    && candidate > prevIndex
                    && (text[candidate] === ALIF_MAKSURA || text[candidate] === ALIF_MAKSURA2)) {
                    let end = candidate + 1;
                    while (end < text.length && isDiacritic(text[end])) {
                        end++;
                    }
                    length = end - prevIndex;
                }
            }
            if (madd.char === SUBSCRIPT_ALIF) {
                let hamzaIndex = -1;
                for (let j = index + 1; j < text.length && !isWordBreak(text[j]); j++) {
                    if (text[j] === HAMZA_ABOVE || text[j] === HAMZA_BELOW) {
                        hamzaIndex = j;
                        break;
                    }
                    if (!isDiacritic(text[j]) && text[j] !== '\u0640') {
                        break;
                    }
                }
                if (hamzaIndex !== -1) {
                    const yaIndex = getNextBaseLetterIndex(text, hamzaIndex + 1);
                    if (yaIndex !== -1
                        && isSameWord(text, index, yaIndex)
                        && (text[yaIndex] === YA || text[yaIndex] === ALIF_MAKSURA || text[yaIndex] === ALIF_MAKSURA2)) {
                        let end = yaIndex + 1;
                        while (end < text.length && isDiacritic(text[end])) {
                            end++;
                        }
                        let startIndex = hamzaIndex;
                        // Prefer the last tatweel before the hamza to keep the hamza visible without pulling in the base letter.
                        let lastTatweel = -1;
                        for (let j = hamzaIndex - 1; j >= 0 && !isWordBreak(text[j]); j--) {
                            if (text[j] === '\u0640') {
                                lastTatweel = j;
                            }
                            if (!isDiacritic(text[j]) && text[j] !== '\u0640') {
                                break;
                            }
                        }
                        if (lastTatweel !== -1) {
                            startIndex = lastTatweel;
                        }
                        else {
                            // Fall back to the nearest base letter so the hamza has a carrier.
                            const carrier = getPreviousBaseLetterIndex(text, hamzaIndex);
                            if (carrier !== -1) {
                                startIndex = carrier;
                            }
                        }
                        prevIndex = startIndex;
                        length = end - prevIndex;
                    }
                }
            }

            addRule(prevIndex, length, type);
            return true
        }
    }

    if (isMaddAsliHamzaOnWaw(text, index)
        && !hasQasr(text, index + 1)
        && (text[index+2] !== ALIF )) {
        addRule(index, 2, 'tajweed-madd-asli');
        return true;
    }

    // Check for Madd Munfasil on Ha with Madda (e.g., مَعَهُٓ اَخَاهُ)
    if (text[index] === 'ه' && hasMadda(text, index)) {
        let nextIndex = getNextBaseLetterIndex(text, index + 1);
        if (nextIndex !== -1 && !isSameWord(text, index, nextIndex)) {
             // Calculate length including diacritics
             let j = index + 1;
             while (j < text.length && isDiacritic(text[j])) {
                 j++;
             }
             let len = j - index;
             
             addRule(index, len, 'tajweed-madd-munfasil');
             return true;
        }
    }

    return false;
}

function hasTanweenBefore(text, index) {
    let i = index - 1;
    while (i >= 0 && !isWordBreak(text[i])) {
        const ch = text[i];
        if (TANWEEN.includes(ch)) {
            return true;
        }
        if (isDiacritic(ch) || ch === '\u0640') {
            i--;
            continue;
        }
        break;
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
        !hasVowel(text, index) &&
        MUQATTAAT.includes(text[index]) &&
        hasMadda(text, index)
    ) {
        if (isStartOfSpeech(text, index)) {
            addRule(index, 2, 'tajweed-madd-lazim');
            return true;
        }

        let prevIndex = getPreviousBaseLetterIndex(text, index);
        if (prevIndex !== -1) {
            const prevChar = text[prevIndex];
            if (MUQATTAAT.includes(prevChar) && !hasVowel(text, prevIndex)) {
                addRule(index, 2, 'tajweed-madd-lazim');
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
    if (!((curr === 'و' || curr === 'ي' || curr === 'ی' || curr === 'ى')
        && (prev === FATHA || (prev === SHADDA && prevPrev === FATHA))
        && next === SUKUN)) {
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
        let length = 4;
        if (prev === SHADDA) {
            beginIndex--;
            length++;
        }

        addRule(beginIndex, length, 'tajweed-madd-liin');
    }

    return found;
}

function detectQalqalah(text, index) {
    if (QALQALAH.includes(text[index]) && text[index + 1] === SUKUN) {
        addRule(index, 2, 'tajweed-qalqalah');
    }
}

function detectNunSakinah(text, i) {
    const {isTrigger, triggerLength} = isNunSakinahOrTanween(text, i);

    if (!isTrigger) {
        return null;
    }

    let searchIndex = i + triggerLength;

    // For tanween, check if followed by alif maksura (possibly with diacritics/hamza in between)
    if (TANWEEN.includes(text[i])) {
        let j = i + triggerLength;
        while (j < text.length && (isDiacritic(text[j]) || text[j] === 'ء' || text[j] === 'ٔ' || text[j] === 'ٕ')) {
            j++;
        }
        if (text[j] === 'ا' || text[j] === 'ى') {
            searchIndex = j + 1;
        }
    }

    let nextLetterIndex = searchIndex;
    while (nextLetterIndex < text.length) {
        const char = text[nextLetterIndex];
        if (isArabicLetter(char)) {
            break;
        }
        if (Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END) {
            return null;
        }
        nextLetterIndex++;
    }

    if (nextLetterIndex >= text.length) {
        return null;
    }

    const nextLetter = text[nextLetterIndex];

    // Check for exceptions before processing idgham
    if (isExceptionToIdgham(text, i, nextLetterIndex)) {
        return null; // No idgham for exception words
    }

    let triggerStartIndex = i;
    let qasrIndex = -1;
    if (TANWEEN.includes(text[i])) {
        let k = i - 1;
        while (k >= 0 && isDiacritic(text[k])) {
            k--;
        }
        triggerStartIndex = k;
        if (hasMarkAfter(text, i, QASR)) {
            triggerStartIndex = i;
        }
        for (let j = i + 1; j < text.length && isDiacritic(text[j]); j++) {
            if (text[j] === QASR) {
                qasrIndex = j;
                break;
            }
        }
    }

    let triggerGroupLength = searchIndex - triggerStartIndex;
    let fullLength = (nextLetterIndex - triggerStartIndex);
    if (qasrIndex !== -1 && qasrIndex > triggerStartIndex && qasrIndex < nextLetterIndex) {
        fullLength = qasrIndex - triggerStartIndex;
    }

    if (YANMOU_LETTERS.includes(nextLetter) && (hasVowel(text, i) || hasTanween(text, i-1))) {
        return {
            trigger: {index: triggerStartIndex, type: 'tajweed-idgham-bi-ghunna', length: fullLength},
            target: null
        };
    }

    if (IDGHAM_BILA_GHUNNA_LETTERS.includes(nextLetter)) {
        return {
            trigger: {index: triggerStartIndex, type: 'tajweed-idgham-bila-ghunna', length: fullLength},
            target: null,
        };
    }

    if (IQLAB_LETTERS.includes(nextLetter)) {
        return {trigger: {index: triggerStartIndex, type: 'tajweed-iqlab', length: fullLength}, target: null};
    }

    if (IKHFA_LETTERS.includes(nextLetter)) {
        if (hasShadda(text, i)) {
            triggerGroupLength++;
        }
        return {trigger: {index: triggerStartIndex, type: 'tajweed-ikhfa', length: triggerGroupLength}, target: null};
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
        if (text[checkIndex] === FATHA) {
            return null;
        }
        checkIndex++;
    }

    let nextCharIndex = i + 1;
    while (nextCharIndex < text.length && isDiacritic(text[nextCharIndex])) {
        nextCharIndex++;
    }

    // Include Small Waw or Small Ya
    if (nextCharIndex < text.length && (text[nextCharIndex] === '\u06E5' || text[nextCharIndex] === '\u06E6')) {
        nextCharIndex++;
    }

    // Check if ه is at the word end
    if (nextCharIndex < text.length) {
        const charAfterHa = text[nextCharIndex];
        const isWordBoundary = charAfterHa === ' ' || WAQF_CLASSES[charAfterHa] || charAfterHa === AYAH_END || !isArabicLetter(charAfterHa);
        if (!isWordBoundary) {
            return null; // ه is not at word end
        }
    }

    // Check if the previous letter has a vowel
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

    // Check if the next letter is Sakin or Hamzat Wasl
    let j = nextCharIndex;
    while (j < text.length && text[j] === ' ') {
        j++;
    }

    if (j < text.length) {
        const nextChar = text[j];
        if (nextChar === ALIF || nextChar === '\u0671') { // Alif or Alif Wasla
            return null;
        }

        if (isArabicLetter(nextChar)) {
            if (hasShadda(text, j) || !hasHarakat(text, j)) {
                return null;
            }
        }
    }

    let ruleLength = nextCharIndex - i;
    addRule(i, ruleLength, 'tajweed-silat-ha');
    return true;
}

function detectQasr(text, i) {
    if (text[i] === QASR) {
        addRule(i, 1, 'hidden-char');
        let prevIndex = getPreviousBaseLetterIndex(text, i);
        if (prevIndex !== -1) {
            let end = prevIndex + 1;
            while (end < i && isDiacritic(text[end]) && !TANWEEN.includes(text[end])) {
                end++;
            }
            let length = end - prevIndex;
            addRule(prevIndex, length, 'tajweed-qasr');
            if (text[i+1] === ALIF && !hasVowel(text, i+1) ) {
                addRule(i + 1, 1, 'silent-letter');
            }
        }
    }
}

function detectMed(text, i) {
    if (text[i] === MED) {
        addRule(i, 1, 'hidden-char');
        let prevIndex = getPreviousBaseLetterIndex(text, i);
        if (prevIndex !== -1) {
            addRule(prevIndex, i - prevIndex, 'tajweed-med');
        }
    }
}

function detectTashiil(text, i) {
    if (text[i] === TASHIIL) {
        addRule(i, 1, 'hidden-char');
        const prevIndex = getPreviousBaseLetterIndex(text, i);
        if (prevIndex !== -1) {
            addRule(prevIndex, i - prevIndex, 'tajweed-tashiil');
        }
    }
}

function detectSakta(text, i) {
    if (text[i] === SAKTA) {
        addRule(i, 1, 'hidden-char');
        const prevIndex = getPreviousBaseLetterIndex(text, i);
        if (prevIndex !== -1) {
            addRule(prevIndex, i - prevIndex, 'tajweed-sakta');
        }
    }
}

function detectIshmam(text, i) {
    if (text[i] === ISHMAM) {
        addRule(i, 1, 'hidden-char');
        const prevIndex = getPreviousBaseLetterIndex(text, i);
        if (prevIndex !== -1) {
            addRule(prevIndex, i - prevIndex, 'tajweed-ishmam');
        }
    }
}

function detectWaqf(text, i) {
    const char = text[i];
    if (WAQF_CLASSES[char]) {
        addRule(i, 1, WAQF_CLASSES[char]);
    }
}

function isNunSakinahOrTanween(text, i) {
    const curr = text[i];

    // Check for noon with sukun (either regular sukun or subscript alef)
    if (curr === NOON && (text[i + 1] === SUKUN || text[i + 1] === '\u0656')) {
        return {isTrigger: true, triggerLength: 2};
    }

    if (TANWEEN.includes(curr)) {
        return {isTrigger: true, triggerLength: 1};
    }

    // Check for noon without an explicit vowel
    if (curr === NOON && !isVowel(text[i + 1]) && text[i + 1] !== SHADDA) {
        return {isTrigger: true, triggerLength: 1};
    }

    return {isTrigger: false, triggerLength: 0};
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
            addRule(i, 0, 'tajweed-ghunna');
        }
    }
}

function detectIdghamMithlain(text, i) {
    const curr = text[i];
    if (curr !== MEEM) return false;

    if (hasVowel(text, i) && !hasSukun(text, i)) {
        return false;
    }

    if (hasShadda(text, i)) {
        return false;
    }

    let nextIndex = getNextBaseLetterIndex(text, i + 1);
    if (nextIndex === -1) {
        return false;
    }

    if (text[nextIndex] === MEEM) {
        addRule(i, 2, 'tajweed-idgham-mithlain');
        return true;
    }

    return false;
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
    if (j >= text.length) {
        return true; // End of text is a stop
    }
    const charAtBreak = text[j];
    return Object.keys(WAQF_CLASSES).includes(charAtBreak) || charAtBreak === AYAH_END;
}

function hasVowel(text, index) {
    for (let i = index + 1; i < text.length; i++) {
        const c = text[i];
        if (c >= '\u064B' && c <= '\u0652') {
            return true;
        }
        if (c < '\u064B' || c > '\u065F') {
            break;
        }
    }
    return false;
}

function hasVowelWithoutSukun(text, index) {
    for (let i = index + 1; i < text.length; i++) {
        const c = text[i];
        if (!isDiacritic(c)) {
            break;
        }
        if (c === FATHA || c === DAMMA || c === KASRA || c === FATHATAAN || c === DAMMATAAN || c === KASRATAAN) {
            return true;
        }
    }
    return false;
}

function hasSukun(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }
    return text[index + 1] === SUKUN;
}

function hasHarakat(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    let i = index + 1;
    while (i < text.length && isDiacritic(text[i])) {
        const c = text[i];
        if (c === FATHA || c === DAMMA || c === KASRA || TANWEEN.includes(c) || c === SUBSCRIPT_ALIF || c === SUPERSCRIPT_ALIF) {
            return true;
        }
        i++;
    }
    return false;
}

// Shared scan for a specific diacritic after a base letter.
function hasMarkAfter(text, index, mark) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }

    let i = index + 1;
    while (i < text.length && isDiacritic(text[i])) {
        if (text[i] === mark) {
            return true;
        }
        i++;
    }
    return false;
}

// Scan only the basic Arabic diacritic range (064B-065F).
function hasMarkInBasicRange(text, index, mark) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    for (let i = index + 1; i < text.length; i++) {
        const char = text[i];
        if (char < '\u064B' || char > '\u065F') {
            break;
        }
        if (char === mark) {
            return true;
        }
    }
    return false;
}

function hasFathataan(text, index) {
    return hasMarkAfter(text, index, FATHATAAN);
}

function hasKasrataan(text, index) {
    return hasMarkAfter(text, index, KASRATAAN);
}

function hasDammataan(text, index) {
    return hasMarkAfter(text, index, DAMMATAAN);
}

function hasTanween(text, index) {
    return hasFathataan(text, index) || hasKasrataan(text, index) || hasDammataan(text, index);
}

function hasQasr(text, index) {
    if (!text || index < 0 || index >= text.length - 1) {
        return false;
    }

    return text[index + 1] === QASR || text[index - 1] === QASR;
}

function hasShadda(text, index) {
    return hasMarkInBasicRange(text, index, SHADDA);
}

function hasMadda(text, index) {
    return hasMarkInBasicRange(text, index, MADDA);
}

function hasHamzaAfter(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    let i = index + 1;
    while (i < text.length) {
        const char = text[i];

        if (char === HAMZA_ABOVE || char === HAMZA_BELOW) {
            return true;
        }

        // Skip diacritics
        if ((char >= '\u064B' && char <= '\u065F') || char === ALIF_MAKSURA ) {
            i++;
            continue;
        }

        // Check if it's a hamza (standalone or on carrier)
        return char === 'ء' || char === 'أ' || char === 'إ' || char === 'ؤ' || char === 'ئ' || char === 'ࢨ' || char === 'یٖٔ';
    }

    return false;
}

function getPreviousBaseLetterIndex(text, index) {
    if (!text || index <= 0 || index > text.length) {
        return -1;
    }

    for (let i = index - 1; i >= 0; i--) {
        const char = text[i];

        // Skip Arabic combining marks (harakat, shadda, madda, etc.)
        if (isDiacritic(char) || char === '\u0640') {
            continue;
        }

        return i; // Found the base letter
    }

    return -1;
}

function getNextBaseLetterIndex(text, index) {
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

        return i; // Found the base letter
    }

    return -1;
}

// --- Helper Functions ---

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
    '\u06D9': 'waqf-continue', // Small high lam-alif
    '\u0617': 'waqf-continue', // Small high zay
    '\u08D5': 'waqf-continue', // Small high sad
    '\u08D6': 'waqf-awla',     // Small high ain
    '\u08D7': 'waqf-continue', // Small high qaf
    '\u08DE': 'waqf-awla',     // qif
    
};

function isWordBreak(char) {
    return /\s/.test(char) || Object.keys(WAQF_CLASSES).includes(char) || char === AYAH_END;
}

function getWordBeforeIndex(text, index) {
    if (!text || index <= 0) return '';
    let end = index - 1;
    while (end >= 0 && isDiacritic(text[end])) {
        end--;
    }
    if (end < 0) return '';

    let start = end;
    while (start >= 0 && !isWordBreak(text[start])) {
        start--;
    }
    return text.slice(start + 1, end + 1);
}

function isWordEndAfter(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    let i = index + 1;
    while (i < text.length && isDiacritic(text[i])) {
        i++;
    }

    if (i >= text.length) {
        return true;
    }

    return isWordBreak(text[i]);
}

function isWawJamaah(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }

    if (text[index] !== WAW) {
        return false;
    }

    const prevIndex = getPreviousBaseLetterIndex(text, index);
    if (prevIndex === -1 || !hasVowelWithoutSukun(text, prevIndex)) {
        return false;
    }

    const nextIndex = getNextBaseLetterIndex(text, index + 1);
    if (nextIndex === -1 || text[nextIndex] !== ALIF) {
        return false;
    }

    if (hasVowel(text, nextIndex)) {
        return false;
    }

    return isWordEndAfter(text, nextIndex);
}

function nextWordStartsWithHamzatWasl(text, wawIndex) {
    const alifIndex = getNextBaseLetterIndex(text, wawIndex + 1);
    if (alifIndex === -1 || text[alifIndex] !== ALIF) {
        return false;
    }

    let i = alifIndex + 1;
    while (i < text.length && isDiacritic(text[i])) {
        i++;
    }

    // Must be at word boundary after the alif of waw jamaah
    if (i < text.length && !isWordBreak(text[i])) {
        return false;
    }

    let j = i;
    while (j < text.length && isWordBreak(text[j])) {
        j++;
    }

    if (j >= text.length) {
        return false;
    }

    if (text[j] === ALIF) {
        return true;
    }

    return startsWithAl(text, j);
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
        if (isDiacritic(prev) || prev === '\u0640') {
            continue;
        }

        // Word starts after any word break (spaces, waqf signs, ayah end, etc.)
        if (isWordBreak(prev)) {
            return true;
        }

        // Otherwise it's inside a word
        return false;
    }

    // Reached start of string → start of word
    return true;
}

function isHamzatWasl(char) {
    return char === '\u0671'; // Alif Wasla
}

function isHamzatWaslAt(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }
    if (text[index] === '\u0671') {
        return true;
    }
    return isHamzatWaslAlifLam(text, index);
}

function isPlainHamzatWaslAt(text, index) {
    if (!text || index < 0 || index >= text.length) {
        return false;
    }
    if (text[index] !== ALIF) {
        return false;
    }
    if (!isWordStart(text, index)) {
        return false;
    }
    if (hasHarakat(text, index)) {
        return false;
    }
    if (hasHamzaAfter(text, index)) {
        return false;
    }
    return true;
}

function nextWordStartsWithPlainHamzatWasl(text, index) {
    let i = index + 1;
    while (i < text.length && isDiacritic(text[i])) {
        i++;
    }
    while (i < text.length && isWordBreak(text[i])) {
        i++;
    }
    if (i >= text.length) {
        return false;
    }
    const nextBase = getNextBaseLetterIndex(text, i + 1);
    if (nextBase !== -1 && text[nextBase] === LAM) {
        return false;
    }
    return isPlainHamzatWaslAt(text, i);
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
    // only relevant for madd letters and alif maksura
    if (text[index] !== 'و' && text[index] !== 'ي' && text[index] !== ALIF && text[index] !== ALIF_MAKSURA && text[index] !== ALIF_MAKSURA2) {
        return false;
    }

    // madd letter must be sākin
    if (hasVowel(text, index)) {
        return false;
    }

    let i = index + 1;
    if (isHamzatWaslAt(text, index + 1)) {
        if (startsWithAl(text, index + 1)) {
            return true;
        }
        i++;
    }

    return startsWithAl(text, i) || isHamzatWaslAt(text, i + 1);
}

function isVowel(char) {
    return char === FATHA || char === DAMMA || char === KASRA || char === SUKUN;
}

function isVowelWithoutSukun(char) {
    return char === FATHA || char === DAMMA || char === KASRA;
}

function isDiacritic(char) {
    return /[\u064B-\u0653\u0656-\u065F\u0670\u08D1\u08D9]/.test(char);
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

    // List of exception words (without diacritics)
    // Now includes both with and without the definite article "ال"
    const exceptionWords = [
        'دنيا', 'دنیا', // dunya (without Al)
        'الدنیا', 'الدنيا', // dunya with definite article Al-
        'صنوان', // sinwan
        'قنوان', // qinwan
        'بنيان', 'بنیان' // bunyan
    ];

    const isException = exceptionWords.includes(word);
    return isException;
}

// --- Constants ---

const FATHA = '\u064E';
const FATHATAAN = '\u064B';
const DAMMATAAN = '\u064C';
const KASRATAAN = '\u064D';

const SHADDA = '\u0651';
const SUKUN = '\u0652';
const QASR = '\u08D1';
const MED = '\u08D2';
const SAKTA = '\u06DC';
const ISHMAM = '\u06EB';
const TASHIIL = '\u06EC';
const SMALL_HIGH_NOON = '\u08D9';

const DAMMA = '\u064F';
const KASRA = '\u0650';

const ALIF = '\u0627';
const ALIF_MAKSURA = 'ی';
const ALIF_MAKSURA2 = '\u0649';
const SUBSCRIPT_ALIF = '\u0656';
const SUPERSCRIPT_ALIF = '\u0670';
const YA = '\u064A';
const WAW = 'و';
const ALIF_LAM_PREFIXES = [WAW, 'ف', 'ب', 'ك', 'ل', 'س', 'ک'];

const LAM = '\u0644';
const MEEM = '\u0645';
const NOON = '\u0646';

const MADDA = '\u0653';
const HAMZA_ABOVE = '\u0654';
const HAMZA_BELOW = '\u0655';

const AYAH_END = '\u06DD'; // ۝

const maddTypes = [
    {char: ALIF, type: 'tajweed-madd-asli', length: 1},
    {char: 'و', type: 'tajweed-madd-asli', length: 1},
    {char: SUPERSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 1},
    {char: SUBSCRIPT_ALIF, type: 'tajweed-madd-asli', length: 2}
];

const MUQATTAAT = ['ا', 'ل', 'م', 'ك', 'ه', 'ي', 'ع', 'ص', 'ط', 'س', 'ح', 'ق', 'ن', 'ی'];
const QALQALAH = ['ق', 'ط', 'ب', 'ج', 'د'];

const TANWEEN = ['\u064B', '\u064C', '\u064D']; // Fathatan, Dammatan, Kasratan

const YANMOU_LETTERS = ['ی', 'ي', 'ن', 'م', 'و'];
const IDGHAM_BILA_GHUNNA_LETTERS = ['ل', 'ر'];
const IKHFA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
const IQLAB_LETTERS = ['ب'];
