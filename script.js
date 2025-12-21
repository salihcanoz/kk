document.addEventListener('DOMContentLoaded', () => {
    const juzSelect = document.getElementById('juzSelect');
    const surahSelect = document.getElementById('surahSelect');
    const pageSelect = document.getElementById('pageSelect');
    const display = document.getElementById('quran-display');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    // Load fonts from Google Fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lateef:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap';
    document.head.appendChild(fontLink);

    display.style.fontFamily = "'Scheherazade New', serif";
    display.style.fontSize = '28px';
    display.style.lineHeight = '2.5';
    display.style.letterSpacing = '0.02em';
    display.style.textRendering = 'optimizeLegibility';
    display.style.fontFeatureSettings = '"cv20" 1, "ss05" 1';

    // --- Font Controls ---
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';

    // Font Size Buttons
    const decreaseFontBtn = document.createElement('button');
    decreaseFontBtn.textContent = 'A-';
    decreaseFontBtn.title = 'Decrease Font Size';

    const increaseFontBtn = document.createElement('button');
    increaseFontBtn.textContent = 'A+';
    increaseFontBtn.title = 'Increase Font Size';

    // Font Type Dropdown
    const fontSelect = document.createElement('select');
    const fonts = [
        { name: 'Scheherazade New', value: "'Scheherazade New', serif" },
        { name: 'Amiri', value: "'Amiri', serif" },
        { name: 'Noto Naskh Arabic', value: "'Noto Naskh Arabic', serif" },
        { name: 'Lateef (Ottoman Style)', value: "'Lateef', serif" },
        { name: 'Hafiz Osman', value: "'Hafiz Osman', 'Scheherazade New', serif" },
        { name: 'Ahmed Husrev', value: "'Ahmed Husrev', 'Scheherazade New', serif" }
    ];
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.name;
        fontSelect.appendChild(option);
    });

    // Abbreviation Toggle Checkbox
    const abbrContainer = document.createElement('div');
    abbrContainer.style.display = 'flex';
    abbrContainer.style.alignItems = 'center';
    abbrContainer.style.marginLeft = '10px';

    const abbrCheckbox = document.createElement('input');
    abbrCheckbox.type = 'checkbox';
    abbrCheckbox.id = 'toggleAbbreviations';
    abbrCheckbox.checked = false; // Default to hidden

    const abbrLabel = document.createElement('label');
    abbrLabel.htmlFor = 'toggleAbbreviations';
    abbrLabel.textContent = 'Show Rules';
    abbrLabel.style.marginLeft = '5px';
    abbrLabel.style.cursor = 'pointer';

    settingsContainer.appendChild(decreaseFontBtn);
    settingsContainer.appendChild(fontSelect);
    settingsContainer.appendChild(increaseFontBtn);
    abbrContainer.appendChild(abbrCheckbox);
    abbrContainer.appendChild(abbrLabel);
    settingsContainer.appendChild(abbrContainer);

    // Add to Navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.appendChild(settingsContainer);
    }

    // Event Listeners for Font Controls
    let currentFontSize = 28;
    decreaseFontBtn.onclick = () => { if (currentFontSize > 16) { currentFontSize -= 2; display.style.fontSize = currentFontSize + 'px'; } };
    increaseFontBtn.onclick = () => { if (currentFontSize < 60) { currentFontSize += 2; display.style.fontSize = currentFontSize + 'px'; } };
    fontSelect.onchange = () => { display.style.fontFamily = fontSelect.value; };

    abbrCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            display.classList.add('show-abbreviations');
        } else {
            display.classList.remove('show-abbreviations');
        }
    });
    // ---------------------

    let quranData = {};
    const surahNames = {
        "1": "الفاتحة",
        "2": "البقرة",
        "3": "آل عمران",
        "4": "النساء",
        "5": "المائدة",
        "6": "الأنعام",
        "7": "الأعراف",
        "8": "الأنفال",
        "9": "التوبة",
        "10": "يونس",
        "11": "هود",
        "12": "يوسف",
        "13": "الرعد",
        "14": "ابراهيم",
        "15": "الحجر",
        "16": "النحل",
        "17": "الإسراء",
        "18": "الكهف",
        "19": "مريم",
        "20": "طه",
        "21": "الأنبياء",
        "22": "الحج",
        "23": "المؤمنون",
        "24": "النور",
        "25": "الفرقان",
        "26": "الشعراء",
        "27": "النمل",
        "28": "القصص",
        "29": "العنكبوت",
        "30": "الروم",
        "31": "لقمان",
        "32": "السجدة",
        "33": "الأحزاب",
        "34": "سبإ",
        "35": "فاطر",
        "36": "يس",
        "37": "الصافات",
        "38": "ص",
        "39": "الزمر",
        "40": "غافر",
        "41": "فصلت",
        "42": "الشورى",
        "43": "الزخرف",
        "44": "الدخان",
        "45": "الجاثية",
        "46": "الأحقاف",
        "47": "محمد",
        "48": "الفتح",
        "49": "الحجرات",
        "50": "ق",
        "51": "الذاريات",
        "52": "الطور",
        "53": "النجم",
        "54": "القمر",
        "55": "الرحمن",
        "56": "الواقعة",
        "57": "الحديد",
        "58": "المجادلة",
        "59": "الحشر",
        "60": "الممتحنة",
        "61": "الصف",
        "62": "الجمعة",
        "63": "المنافقون",
        "64": "التغابن",
        "65": "الطلاق",
        "66": "التحريم",
        "67": "الملك",
        "68": "القلم",
        "69": "الحاقة",
        "70": "المعارج",
        "71": "نوح",
        "72": "الجن",
        "73": "المزمل",
        "74": "المدثر",
        "75": "القيامة",
        "76": "الانسان",
        "77": "المرسلات",
        "78": "النبإ",
        "79": "النازعات",
        "80": "عبس",
        "81": "التكوير",
        "82": "الإنفطار",
        "83": "المطففين",
        "84": "الإنشقاق",
        "85": "البروج",
        "86": "الطارق",
        "87": "الأعلى",
        "88": "الغاشية",
        "89": "الفجر",
        "90": "البلد",
        "91": "الشمس",
        "92": "الليل",
        "93": "الضحى",
        "94": "الشرح",
        "95": "التين",
        "96": "العلق",
        "97": "القدر",
        "98": "البينة",
        "99": "الزلزلة",
        "100": "العاديات",
        "101": "القارعة",
        "102": "التكاثر",
        "103": "العصر",
        "104": "الهمزة",
        "105": "الفيل",
        "106": "قريش",
        "107": "الماعون",
        "108": "الكوثر",
        "109": "الكافرون",
        "110": "النصر",
        "111": "المسد",
        "112": "الإخلاص",
        "113": "الفلق",
        "114": "الناس"
    };
    let currentMushafPage = 1;
    const totalMushafPages = 604;

    if (typeof quranRawData !== 'undefined') {
        parseJSON(quranRawData);
        populateDropdown();
        populateJuzDropdown();
        populatePageDropdown();
        loadMushafPage(currentMushafPage);
    } else {
        console.error("Error: quranRawData is not defined.");
        display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
    }

    function parseJSON(data) {
        if (!data || !data.q) return;
        data.q.forEach(verse => {
            // Handle keys with or without backticks
            const surah = verse['`sura`'] || verse['sura'];
            const aya = verse['`aya`'] || verse['aya'];
            const text = verse['`text`'] || verse['text'];

            if (surah) {
                if (!quranData[surah]) {
                    quranData[surah] = {};
                }
                quranData[surah][aya] = { aya: parseInt(aya), text: text };
            }
        });
    }

    function populateDropdown() {
        surahSelect.innerHTML = '';
        for (let i = 1; i <= 114; i++) {
            const option = document.createElement('option');
            option.value = i;
            const name = surahNames[i] || `Surah ${i}`;
            option.textContent = `${i}. ${name}`;
            surahSelect.appendChild(option);
        }
    }

    function populateJuzDropdown() {
        juzSelect.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Juz ${i}`;
            juzSelect.appendChild(option);
        }
    }

    function populatePageDropdown() {
        pageSelect.innerHTML = '';
        for (let i = 1; i <= totalMushafPages; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Page ${i}`;
            pageSelect.appendChild(option);
        }
    }

    function applyTajweed(text) {
        let html = text;

        // --- Waqf & Sajdah Signs (Turkish Style) ---
        // Replace Quranic encoding with common symbols/letters and wrap them.
        html = html.replace(/(۩)/g, '<span class="sajdah-sign" title="Sajdah (Prostration)">$1</span>');
        html = html.replace(/(ۘ)/g, '<span class="waqf-sign waqf-stop" title="Waqf Lazim (Mandatory Stop)">م</span>');
        html = html.replace(/(ۚ)/g, '<span class="waqf-sign" title="Waqf Ja\'iz (Permissible Stop)">ج</span>');
        html = html.replace(/(ۖ)/g, '<span class="waqf-sign waqf-continue" title="Al-Wasl Awla (Continuing is Better)">صلى</span>');
        html = html.replace(/(ۗ)/g, '<span class="waqf-sign waqf-stop" title="Waqf Awla (Stopping is Better)">قلى</span>');
        html = html.replace(/(ۛ)/g, '<span class="waqf-sign" title="Mu\'anaqah (Stop at one of two places)">∴</span>');

        // --- Madd Rules (Long - 4/5 counts) ---
        // 1. Madd Muttasil (Connected): Alif/Waw/Ya followed by Hamza in the same word.
        html = html.replace(/(?<=َ)(ا)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');
        html = html.replace(/(?<=ُ)(و)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');
        html = html.replace(/(?<=ِ)(ي)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');

        // 2. Madd Munfasil (Separated): Alif/Waw/Ya at end of word followed by Hamza at start of next.
        // Matches the madd letter and wraps it. The following Hamza is preserved outside the span.
        html = html.replace(/(?<=َ)([اى])(\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2');
        html = html.replace(/(?<=ُ)(و)(ا?\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2'); // Handles optional silent Alif after Waw
        html = html.replace(/(?<=ِ)(ي)(\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2');

        // 3. Madd Liin (Soft): Waw or Ya with Sukun preceded by Fatha.
        html = html.replace(/(?<=َ)([وي]ْ)/g, '<span class="tajweed-madd-liin">$1</span>');

        // 4. Madd Silah (Connecting Elongation) for Thamiir 'Ha' (ه)
        // Conditions: Ha has Damma/Kasra, Previous letter has vowel, Next letter has vowel (not Sukun/Alif).

        // Exception: Surah Al-Furqan 25:69 (fihi muhana) - Silah applies despite previous Ya Sukun.
        html = html.replace(/(فِيهِ)(\s+مُهَانًا)/g, '<span class="tajweed-madd-silah">$1</span>$2');

        // Silah Kubra (Long): Followed by Hamza. Treated as Madd (Red).
        html = html.replace(/(?<=[\u064E\u064F\u0650])(ه[\u064F\u0650])(?=\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>');
        // Silah Sughra (Short): Followed by non-Hamza, non-Sukun, non-Alif (Wasla).
        html = html.replace(/(?<=[\u064E\u064F\u0650])(ه[\u064F\u0650])(?=\s+[^\u0627\u0671\u0652أإآء])/g, '<span class="tajweed-madd-silah">$1</span>');

        // Use lookbehind to apply Madd Asli without breaking grapheme clusters.
        html = html.replace(/(?<=َ)ا/g, '<span class="tajweed-madd-asli">ا</span>');
        html = html.replace(/(?<=ُ)و/g, '<span class="tajweed-madd-asli">و</span>');
        html = html.replace(/(?<=ِ)ي/g, '<span class="tajweed-madd-asli">ي</span>');

        // Now apply other rules
        html = html.replace(/([ٰ~])/g, '<span class="tajweed-madd">$1</span>');
        html = html.replace(/([قطبجد]ْ)/g, '<span class="tajweed-qalqalah">$1</span>');
        html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*ب)/g, '<span class="tajweed-iqlab">$1</span>');
        html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*[ينمو])(ّ)?/g, '<span class="tajweed-idgham-bi-ghunna">$1</span>'); // Idgham with Ghunna, hides shaddah
        html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*[لر])(ّ)?/g, '<span class="tajweed-idgham-bila-ghunna">$1</span>'); // Idgham without Ghunna, hides shaddah
        html = html.replace(/([نًٌٍ]ْ?(?:[اى])?)(\s*[تثجدذزسشصضطظفقك])/g, '<span class="tajweed-ikhfa">$1</span>$2');
        html = html.replace(/([نم]ّ)/g, '<span class="tajweed-ghunna">$1</span>');
        return html;
    }

    function fixDiacritics(text) {
        let fixedText = text;

        // Rule 0: Remove Shaddah from the first letter of the verse.
        // This handles cases where the verse starts with a shaddah due to Idgham with the previous verse.
        fixedText = fixedText.replace(/^([^\s])ّ/, '$1');

        // Rule 1: Replace Fatha with Dagger Alif in Allah (اللَّه -> اللّٰه) to show the Madd.
        // This is done first to prevent the generic 'Al-' rule from incorrectly vowelizing 'Allah'.
        fixedText = fixedText.replace(/اللَّه/g, 'اللّٰه');
        fixedText = fixedText.replace(/لِلَّهِ/g, 'لِلّٰهِ');

        // Rule 2: Add Fatha to the definite article 'Al-' (ال) only if it's at the very beginning of the verse.
        fixedText = fixedText.replace(/^ال/, 'اَل');

        // Rule 3: A dictionary for common words starting with Hamzatul Wasl.
        const waslReplacements = {
            // Kasra
            'اهْدِنَا': 'اِهْدِنَا', 'اسْتَغْفِرْ': 'اِسْتَغْفِرْ', 'اضْرِب': 'اِضْرِب',
            'اقْرَأْ': 'اِقْرَأْ', 'ارْجِعُوا': 'اِرْجِعُوا', 'اكْشِفْ': 'اِكْشِفْ',
            'اسْم': 'اِسْم', 'ابْن': 'اِبْن', 'ابْنَة': 'اِبْنَة',
            'امْرَأَة': 'اِمْرَأَة', 'اثْنَيْنِ': 'اِثْنَيْنِ', 'اثْنَتَيْنِ': 'اِثْنَتَيْنِ',
            'اسْتَكْبَرَ': 'اِسْتَكْبَرَ', 'اسْتَطَاعُوا': 'اِسْتَطَاعُوا', 'اسْتَجَابُوا': 'اِسْتَجَابُوا',
            'اطْمَأَنَّ': 'اِطْمَأَنَّ', 'اهْبِطُوا': 'اِهْبِطُوا', 'اتَّقُوا': 'اِتَّقُوا',
            'اصْبِرُوا': 'اِصْبِرُوا', 'اسْتَعِينُوا': 'اِسْتَعِينُوا', 'انطَلَقُوا': 'اِنطَلَقُوا',
            'انتَصِرْ': 'اِنتَصِرْ', 'اتَّبِعْ': 'اِتَّبِعْ', 'افْتَرَاهُ': 'اِفْتَرَاهُ',

            // Damma
            'ادْخُلُوا': 'اُدْخُلُوا', 'اخْرُجُوا': 'اُخْرُجُوا', 'انظُرُوا': 'اُنظُرُوا',
            'انظُرْ': 'اُنظُرْ', 'انْظُرْ': 'اُنْظُرْ',
            'ارْكُضْ': 'اُرْكُضْ', 'ادْعُ': 'اُدْعُ', 'اعْبُدُوا': 'اُعْبُدُوا',
            'اذْكُرُوا': 'اُذْكُرُوا', 'اقْتُلُوا': 'اُقْتُلُوا', 'انصُرْنَا': 'اُنصُرْنَا'
        };

        // Apply Rule 3 only if the verse starts with one of these words.
        for (const [word, replacement] of Object.entries(waslReplacements)) {
            const regex = new RegExp('^' + word);
            if (regex.test(fixedText)) {
                fixedText = fixedText.replace(regex, replacement);
                // A verse can only start with one, so we can break after the first match.
                break;
            }
        }

        // Rule 4: Handle Idgham of two identical letters (Mutamathilain)
        // Adds a sukun to the first and removes the shaddah from the second.
        // Example: رَبِحَت تِّجَارَتُهُمْ -> رَبِحَتْ تِجَارَتُهُمْ
        const idghamLetters = 'بتثجحخدذرزسشصضطظفقكلمنوهيعغ';
        const idghamRegex = new RegExp(`([${idghamLetters}])(\\s+)(\\1)ّ`, 'g');
        fixedText = fixedText.replace(idghamRegex, '$1ْ$2$3');

        // Rule 5: Add Sukun to Noon (ن) if it has no vowel (harakah). This helps with Ikhfa readability.
        fixedText = fixedText.replace(/ن(?![ًٌٍَُِّْٰ])/g, 'نْ');

        return fixedText;
    }

    function getJuzNumber(page) {
        if (page <= 21) return 1;
        if (page > 601) return 30;
        return Math.floor((page - 2) / 20) + 1;
    }

    function loadMushafPage(page) {
        display.innerHTML = '';

        if (typeof quranPageData === 'undefined') {
            display.innerHTML = '<p style="text-align:center; color: red;">Error: Page data not loaded. Ensure page-data.js is included.</p>';
            return;
        }

        const pageIndex = page - 1;

        if (pageIndex < 0 || pageIndex >= quranPageData.length) {
            display.innerHTML = '<p style="text-align:center;">Page not found.</p>';
            return;
        }

        const pageVersesRanges = quranPageData[pageIndex];
        const [start, end] = pageVersesRanges;
        const startSurah = start[0];
        const startAya = start[1];
        const endSurah = end[0];
        const endAya = end[1];

        const contentDiv = document.createElement('div');
        contentDiv.className = 'quran-content';
        let fullTextHTML = '';

        for (let s = startSurah; s <= endSurah; s++) {
            if (!quranData[s]) continue;

            const ayahsInSurah = Object.keys(quranData[s]).map(Number);
            const maxAyaInSurah = Math.max(...ayahsInSurah);

            let currentSurahStartAya = (s === startSurah) ? startAya : 1;
            let currentSurahEndAya = (s === endSurah) ? endAya : maxAyaInSurah;

            if (currentSurahStartAya === 1 && s > 1) {
                fullTextHTML += `<div class="surah-header"><h3>${s}. ${surahNames[s]}</h3></div>`;
            }

            for (let a = currentSurahStartAya; a <= currentSurahEndAya; a++) {
                const verse = quranData[s][a];
                if (verse) {
                    let text = verse.text;
                    const BASMALAH = "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ";

                    if (a === 1 && text.startsWith(BASMALAH)) {
                        if (s === 1) {
                            const textWithDiacritics = fixDiacritics(text);
                            const coloredText = applyTajweed(textWithDiacritics);
                            fullTextHTML += `<div class="basmalah" style="text-align: center; margin-bottom: 10px; width: 100%;">${coloredText} <span class="verse-number">${verse.aya}</span></div>`;
                            continue;
                        }
                        fullTextHTML += `<div class="basmalah" style="text-align: center; margin-bottom: 10px; width: 100%;">${BASMALAH}</div>`;
                        text = text.substring(BASMALAH.length).trim();
                    }

                    const textWithDiacritics = fixDiacritics(text);
                    const coloredText = applyTajweed(textWithDiacritics);
                    fullTextHTML += `${coloredText} <span class="verse-number">${verse.aya}</span> `;
                }
            }
        }

        if (!fullTextHTML) {
            fullTextHTML = '<p style="text-align:center;">No verses found for this page.</p>';
        }

        contentDiv.innerHTML = fullTextHTML;
        display.appendChild(contentDiv);

        currentMushafPage = page;
        const juz = getJuzNumber(currentMushafPage);
        pageInfo.textContent = `Page ${currentMushafPage} of ${totalMushafPages} | Juz ${juz}`;
        prevBtn.disabled = currentMushafPage === 1;
        nextBtn.disabled = currentMushafPage === totalMushafPages;

        surahSelect.value = startSurah;
        juzSelect.value = juz;
        pageSelect.value = currentMushafPage;
    }

    function findFirstPageOfSurah(surahId) {
        for (let i = 0; i < quranPageData.length; i++) {
            const [start, end] = quranPageData[i];
            const startSurah = start[0];
            if (surahId === startSurah) {
                return i + 1;
            }
        }
        return 1; // Default to page 1 if not found
    }

    juzSelect.addEventListener('change', (e) => {
        const selectedJuz = parseInt(e.target.value);
        const page = (selectedJuz === 1) ? 1 : (selectedJuz - 1) * 20 + 2;
        loadMushafPage(page);
    });

    pageSelect.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        loadMushafPage(page);
    });

    surahSelect.addEventListener('change', (e) => {
        const selectedSurahId = parseInt(e.target.value);
        const page = findFirstPageOfSurah(selectedSurahId);
        loadMushafPage(page);
    });

    prevBtn.addEventListener('click', () => {
        if (currentMushafPage > 1) {
            loadMushafPage(currentMushafPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentMushafPage < totalMushafPages) {
            loadMushafPage(currentMushafPage + 1);
        }
    });

    // Create and append the legend
    const legend = document.createElement('div');
    legend.id = 'tajweed-legend';
    legend.style.marginTop = '20px';
    legend.style.padding = '15px';
    legend.style.border = '1px solid #ddd';
    legend.style.borderRadius = '8px';
    legend.style.backgroundColor = '#f9f9f9';
    legend.innerHTML = `
        <h4 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">Tajweed Legend</h4>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FF70A6; margin-right: 5px;">■</span> <div>Ghunna: Nasalization</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #A64AC9; margin-right: 5px;">■</span> <div>Madd: Long Elongation (4-5)</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #F39C12; margin-right: 5px;">■</span> <div>Madd Liin: Soft Elongation</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #9932CC; margin-right: 5px;">■</span> <div>Madd Silah: Connecting Elongation</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #7F00FF; margin-right: 5px;">■</span> <div>Madd Asli: Natural Elongation (2)</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #4682B4; margin-right: 5px;">■</span> <div>Qalqalah: Echoing Sound</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FFA500; margin-right: 5px;">■</span> <div>Iqlab: Flipping</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #00BFFF; margin-right: 5px;">■</span> <div>Idgham bi Ghunna</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #5DADE2; margin-right: 5px;">■</span> <div>Idgham bila Ghunna</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #20B2AA; margin-right: 5px;">■</span> <div>Ikhfa: Hiding</div></li>
        </ul>
        <h4 style="margin-top: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">Pause & Prostration Marks</h4>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">۩</span> <div>Sajdah: Prostration</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">م</span> <div>Lazim: Mandatory Stop</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">ج</span> <div>Ja'iz: Permissible Stop</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #27ae60; font-weight: bold; margin-right: 5px;">صلى</span> <div>Al-Wasl Awla: Better to Continue</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">قلى</span> <div>Waqf Awla: Better to Stop</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">∴</span> <div>Mu'anaqah: Stop at one spot</div></li>
        </ul>
    `;
    display.insertAdjacentElement('afterend', legend);
});
