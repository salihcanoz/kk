document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM references for faster access and cleaner code.
    const juzSelect = document.getElementById('juzSelect');
    const surahSelect = document.getElementById('surahSelect');
    const pageSelect = document.getElementById('pageSelect');
    const display = document.getElementById('quran-display');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const appTitle = document.getElementById('appTitle');

    // --- Constants ---
    const FONT_SIZE_MIN = 30;
    const FONT_SIZE_MAX = 150;
    const RTL_LANGS = new Set(['ar', 'fa', 'ur', 'he']);
    const LANG_OPTIONS = [
        {code: 'tr', name: '\u{1F1F9}\u{1F1F7} Türkçe'},
        {code: 'nl', name: '\u{1F1F3}\u{1F1F1} Nederlands'},
        {code: 'en', name: '\u{1F1EC}\u{1F1E7} English'},
        {code: 'de', name: '\u{1F1E9}\u{1F1EA} Deutsch'},
        {code: 'fr', name: '\u{1F1EB}\u{1F1F7} Français'},
        {code: 'es', name: '\u{1F1EA}\u{1F1F8} Español'},
        {code: 'bs', name: '\u{1F1E7}\u{1F1E6} Bosanski'},
        {code: 'el', name: '\u{1F1EC}\u{1F1F7} Ελληνικά'},
        {code: 'bg', name: '\u{1F1E7}\u{1F1EC} Български'},
        {code: 'sq', name: '\u{1F1E6}\u{1F1F1} Shqip'},
        {code: 'ru', name: '\u{1F1F7}\u{1F1FA} Русский'}
    ];
    const FONT_OPTIONS = [
        {name: 'Lateef', value: "'Lateef', serif"},
        {name: 'Noto Naskh', value: "'Noto Naskh Arabic', serif"},
        {name: 'Scheherazade', value: "'Scheherazade New', serif"}
    ];
    const TAJWEED_MODES = [
        {value: 'none', key: 'tajweedNone', default: 'No tajweed'},
        {value: 'colors', key: 'tajweedColors', default: 'Colors'},
        {value: 'colors-abbr', key: 'tajweedColorsAndAbbr', default: 'Colors and Abbrevations'}
    ];
    const RULE_TOGGLE_ITEMS = [        
        {className: 'tajweed-madd-asli', legendClass: 'legend-madd-asli', labelKey: 'maddAsli', defaultLabel: 'Madd Asli'},
        {className: 'tajweed-madd-muttasil', legendClass: 'legend-madd-muttasil', labelKey: 'maddMuttasil', defaultLabel: 'Madd Muttasil'},
        {className: 'tajweed-madd-munfasil', legendClass: 'legend-madd-munfasil', labelKey: 'maddMunfasil', defaultLabel: 'Madd Munfasil'},
        {className: 'tajweed-madd-arid', legendClass: 'legend-madd-arid', labelKey: 'maddArid', defaultLabel: "Madd 'Arid"},
        {className: 'tajweed-madd-liin', legendClass: 'legend-madd-liin', labelKey: 'maddLiin', defaultLabel: 'Madd Liin'},
        {className: 'tajweed-med', legendClass: 'legend-med', labelKey: 'med', defaultLabel: 'Med'},
        {className: 'tajweed-silat-ha', legendClass: 'legend-silat-ha', labelKey: 'silatHa', defaultLabel: 'Silat Ha'},        
        {className: 'tajweed-iqlab', legendClass: 'legend-iqlab', labelKey: 'iqlab', defaultLabel: 'Iqlab'},
        {className: 'tajweed-idgham-bi-ghunna', legendClass: 'legend-idgham-ghunna', labelKey: 'idghamGhunna', defaultLabel: 'Idgham bi Ghunna'},
        {className: 'tajweed-idgham-bila-ghunna', legendClass: 'legend-idgham-bila', labelKey: 'idghamBila', defaultLabel: 'Idgham bila Ghunna'},
        {className: 'tajweed-idgham-mutakaribain', legendClass: 'legend-idgham-mutakaribain', labelKey: 'idghamMutakaribain', defaultLabel: 'Idgham Mutakaribain'},
        {className: 'tajweed-idgham-mithlain', legendClass: 'legend-idgham-mithlain', labelKey: 'idghamMithlain', defaultLabel: 'Idgham Mithlain'},
        {className: 'tajweed-ikhfa', legendClass: 'legend-ikhfa', labelKey: 'ikhfa', defaultLabel: 'Ikhfa'},
        {className: 'tajweed-qalqalah', legendClass: 'legend-qalqalah', labelKey: 'qalqalah', defaultLabel: 'Qalqalah'},
        {className: 'tajweed-ghunna', legendClass: 'legend-ghunna', labelKey: 'ghunna', defaultLabel: 'Ghunna'},
        {className: 'tajweed-qasr', legendClass: 'legend-qasr', labelKey: 'qasr', defaultLabel: 'Qasr'}
    ];
    const DEFAULT_ENABLED_RULES = RULE_TOGGLE_ITEMS.reduce((acc, item) => {
        acc[item.className] = true;
        return acc;
    }, {});

    // --- Settings ---
    const defaultSettings = {
        language: navigator.language ? navigator.language.substring(0, 2) : 'en',
        currentPage: 0, // Start from page 0
        fontFamily: "'Lateef', serif",
        fontSize: 48,
        tajweedMode: 'colors-abbr', // 'none', 'colors', 'colors-abbr'
        enabledRules: {...DEFAULT_ENABLED_RULES}
    };

    let settings = {...defaultSettings};

    // Persist user preferences to localStorage.
    function saveSettings() {
        localStorage.setItem('quranReaderSettings', JSON.stringify(settings));
    }

    // Restore saved preferences if they exist.
    function loadSettings() {
        const savedSettings = localStorage.getItem('quranReaderSettings');
        if (savedSettings) {
            settings = {...settings, ...JSON.parse(savedSettings)};
        }
    }

    function normalizeEnabledRules(enabledRules) {
        const normalized = {...DEFAULT_ENABLED_RULES};
        if (enabledRules && typeof enabledRules === 'object') {
            RULE_TOGGLE_ITEMS.forEach((item) => {
                if (enabledRules[item.className] === false) {
                    normalized[item.className] = false;
                }
            });
        }
        return normalized;
    }

    // --- Initialization ---
    loadSettings();
    settings.enabledRules = normalizeEnabledRules(settings.enabledRules);

    // Use the translations object from tr.js if available, otherwise fallback to English.
    function getTranslationsForLanguage(lang) {
        if (typeof translations === 'undefined') return {};
        return translations[lang] || translations.en || {};
    }

    let t = getTranslationsForLanguage(settings.language);

    // Load fonts from Google Fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Lateef:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap';
    document.head.appendChild(fontLink);

    // --- UI Controls (navbar) ---
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';

    // Language Dropdown
    const langSelect = document.createElement('select');
    LANG_OPTIONS.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        if (lang.code === settings.language) option.selected = true;
        langSelect.appendChild(option);
    });

    // Font Size Buttons
    const decreaseFontBtn = document.createElement('button');
    decreaseFontBtn.textContent = 'A-';

    const increaseFontBtn = document.createElement('button');
    increaseFontBtn.textContent = 'A+';

    // Font Type Dropdown
    const fontSelect = document.createElement('select');
    FONT_OPTIONS.forEach(font => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.name;
        if (font.value === settings.fontFamily) option.selected = true;
        fontSelect.appendChild(option);
    });

    // Tajweed Display Mode Dropdown
    const tajweedSelect = document.createElement('select');
    tajweedSelect.id = 'tajweedMode';
    TAJWEED_MODES.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode.value;
        option.textContent = (t && t[mode.key]) ? t[mode.key] : mode.default;
        if (mode.value === settings.tajweedMode) option.selected = true;
        tajweedSelect.appendChild(option);
    });

    settingsContainer.appendChild(langSelect);
    settingsContainer.appendChild(decreaseFontBtn);
    settingsContainer.appendChild(fontSelect);
    settingsContainer.appendChild(increaseFontBtn);
    settingsContainer.appendChild(tajweedSelect);

    // Add to Navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.appendChild(settingsContainer);
    }

    // --- Event Listeners ---
    decreaseFontBtn.onclick = () => adjustFontSize(0.8);
    increaseFontBtn.onclick = () => adjustFontSize(1.2);

    fontSelect.onchange = () => {
        settings.fontFamily = fontSelect.value;
        applyDisplaySettings();
        saveSettings();
    };

    tajweedSelect.onchange = () => {
        settings.tajweedMode = tajweedSelect.value;
        applyDisplaySettings();
        setLegendVisibility();
        loadMushafPage(settings.currentPage);
    };

    langSelect.onchange = () => setLanguage(langSelect.value);

    // --- Swipe Gestures for Mobile ---
    let touchStartX = 0;
    let touchEndX = 0;

    display.addEventListener('touchstart', function (event) {
        touchStartX = event.changedTouches[0].screenX;
    }, false);

    display.addEventListener('touchend', function (event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    // Tap/click any word to highlight its whole verse.
    display.addEventListener('click', function (event) {
        const verseElement = event.target.closest('.verse-block');
        if (!verseElement || !display.contains(verseElement)) {
            return;
        }

        const currentSelected = display.querySelector('.verse-block.is-selected');
        if (currentSelected && currentSelected !== verseElement) {
            currentSelected.classList.remove('is-selected');
        }

        verseElement.classList.toggle('is-selected');
    });

    function handleSwipe() {
        const swipeThreshold = 150; // Minimum distance for a swipe
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swiped left (RTL: Previous Page)
            goToPage(settings.currentPage - 1);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swiped right (RTL: Next Page)
            goToPage(settings.currentPage + 1);
        }
    }

    // --- Keyboard Navigation ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            // Left arrow key (RTL: Next Page)
            goToPage(settings.currentPage + 1);
        }
        else if (event.key === 'ArrowRight') {
            // Right arrow key (RTL: Previous Page)
            goToPage(settings.currentPage - 1);
        }
    });

    // --- Quran Data & Logic ---
    let quranByPage = {};
    // Fallback Surah Names if translations are missing
    const defaultSurahNames = {
        "1": "الفاتحة", "2": "البقرة", "3": "آل عمران", "4": "النساء", "5": "المائدة",
        "6": "الأنعام", "7": "الأعراف", "8": "الأنفال", "9": "التوبة", "10": "يونس",
        "11": "هود", "12": "يوسف", "13": "الرعد", "14": "ابراهيم", "15": "الحجر",
        "16": "النحل", "17": "الإسراء", "18": "الكهف", "19": "مريم", "20": "طه",
        "21": "الأنبياء", "22": "الحج", "23": "المؤمنون", "24": "النور", "25": "الفرقان",
        "26": "الشعراء", "27": "النمل", "28": "القصص", "29": "العنكبوت", "30": "الروم",
        "31": "لقمان", "32": "السجدة", "33": "الأحزاب", "34": "سبإ", "35": "فاطر",
        "36": "يس", "37": "الصافات", "38": "ص", "39": "الزمر", "40": "غافر",
        "41": "فصلت", "42": "الشورى", "43": "الزخرف", "44": "الدخان", "45": "الجاثية",
        "46": "الأحقاف", "47": "محمد", "48": "الفتح", "49": "الحجرات", "50": "ق",
        "51": "الذاريات", "52": "الطور", "53": "النجم", "54": "القمر", "55": "الرحمن",
        "56": "الواقعة", "57": "الحديد", "58": "المجادلة", "59": "الحشر", "60": "الممتحنة",
        "61": "الصف", "62": "الجمعة", "63": "المنافقون", "64": "التغابن", "65": "الطلاق",
        "66": "التحريم", "67": "الملك", "68": "القلم", "69": "الحاقة", "70": "المعارج",
        "71": "نوح", "72": "الجن", "73": "المزمل", "74": "المدثر", "75": "القيامة",
        "76": "الانسان", "77": "المرسلات", "78": "النبإ", "79": "النازعات", "80": "عبس",
        "81": "التكوير", "82": "الإنفطار", "83": "المطففين", "84": "الإنشقاق", "85": "البروج",
        "86": "الطارق", "87": "الأعلى", "88": "الغاشية", "89": "الفجر", "90": "البلد",
        "91": "الشمس", "92": "الليل", "93": "الضحى", "94": "الشرح", "95": "التين",
        "96": "العلق", "97": "القدر", "98": "البينة", "99": "الزلزلة", "100": "العاديات",
        "101": "القارعة", "102": "التكاثر", "103": "العصر", "104": "الهمزة", "105": "الفيل",
        "106": "قريش", "107": "الماعون", "108": "الكوثر", "109": "الكافرون", "110": "النصر",
        "111": "المسد", "112": "الإخلاص", "113": "الفلق", "114": "الناس"
    };

    const totalMushafPages = 605;

    // Create legend element
    const legend = document.createElement('div');
    legend.id = 'tajweed-legend';
    display.insertAdjacentElement('afterend', legend);

    if (typeof quranRawData !== 'undefined') {
        processQuranData();
        updateUIText();
    }
    else {
        console.error("Error: quranRawData is not defined.");
        display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
    }

    // Build a page -> verses index for fast lookup while rendering.
    function processQuranData() {
        quranByPage = {};
        if (!quranRawData || !quranRawData.surahs) return;

        quranRawData.surahs.forEach(surah => {
            surah.verses.forEach(verse => {
                const page = verse.pg;
                if (!quranByPage[page]) {
                    quranByPage[page] = [];
                }
                quranByPage[page].push({
                    surah: surah.i,
                    surahName: surah.tr,
                    ...verse
                });
            });
        });
    }

    // Keep font and tajweed display settings in sync with the UI.
    function applyDisplaySettings() {
        display.style.fontFamily = settings.fontFamily;
        display.style.fontSize = `${settings.fontSize}px`;
        display.classList.toggle('show-abbreviations', settings.tajweedMode === 'colors-abbr');
    }

    // Show/hide legend based on tajweed mode.
    function setLegendVisibility() {
        if (!legend) return;
        legend.style.display = settings.tajweedMode === 'none' ? 'none' : 'block';
    }

    // Refresh tajweed dropdown labels when language changes.
    function updateTajweedSelectLabels() {
        if (!tajweedSelect) return;
        TAJWEED_MODES.forEach(mode => {
            const option = Array.from(tajweedSelect.options).find((item) => item.value === mode.value);
            if (option) {
                option.textContent = (t && t[mode.key]) ? t[mode.key] : mode.default;
            }
        });
    }

    // Update CSS variables used for abbreviation overlays.
    function updateAbbreviationVariables() {
        if (!t) return;
        document.documentElement.style.setProperty('--abbr-ghunna', `"${t.abbrGhunna || 'Gh'}"`);
        document.documentElement.style.setProperty('--abbr-madd-muttasil', `"${t.abbrMaddMuttasil || 'MM'}"`);
        document.documentElement.style.setProperty('--abbr-madd-munfasil', `"${t.abbrMaddMunfasil || 'Mn'}"`);
        document.documentElement.style.setProperty('--abbr-madd-arid', `"${t.abbrMaddArid || 'A'}"`);
        document.documentElement.style.setProperty('--abbr-madd-liin', `"${t.abbrMaddLiin || 'ML'}"`);
        document.documentElement.style.setProperty('--abbr-silat-ha', `"${t.abbrSilatHa || 'S'}"`);
        document.documentElement.style.setProperty('--abbr-madd-lazim', `"${t.abbrMaddLazim || 'Lz'}"`);
        document.documentElement.style.setProperty('--abbr-madd-asli', `"${t.abbrMaddAsli || 'MA'}"`);
        document.documentElement.style.setProperty('--abbr-qalqalah', `"${t.abbrQalqalah || 'Q'}"`);
        document.documentElement.style.setProperty('--abbr-iqlab', `"${t.abbrIqlab || 'Iq'}"`);
        document.documentElement.style.setProperty('--abbr-idgham-ghunna', `"${t.abbrIdghamGhunna || 'IdG'}"`);
        document.documentElement.style.setProperty('--abbr-idgham-bila', `"${t.abbrIdghamBila || 'IdB'}"`);
        document.documentElement.style.setProperty('--abbr-idgham-mutakaribain', `"${t.abbrIdghamMutakaribain || 'IdM'}"`);
        document.documentElement.style.setProperty('--abbr-idgham-mithlain', `"${t.abbrIdghamMithlain || 'Idm'}"`);
        document.documentElement.style.setProperty('--abbr-ikhfa', `"${t.abbrIkhfa || 'Ik'}"`);
        document.documentElement.style.setProperty('--abbr-qasr', `"${t.abbrQasr || 'Qsr'}"`);
        document.documentElement.style.setProperty('--abbr-med', `"${t.abbrMed || 'Med'}"`);
        document.documentElement.style.setProperty('--abbr-tashiil', `"${t.abbrTashiil || 'Tashiil'}"`);
        document.documentElement.style.setProperty('--abbr-sakta', `"${t.abbrSakta || 'Sakta'}"`);
        document.documentElement.style.setProperty('--abbr-ishmam', `"${t.abbrIshmam || 'Ishmam'}"`);
    }

    // Change font size while respecting min/max limits.
    function adjustFontSize(multiplier) {
        const nextSize = settings.fontSize * multiplier;
        if (nextSize < FONT_SIZE_MIN || nextSize > FONT_SIZE_MAX) return;
        settings.fontSize = nextSize;
        applyDisplaySettings();
        saveSettings();
    }

    // Update UI language and refresh the UI text.
    function setLanguage(lang) {
        settings.language = lang;
        t = getTranslationsForLanguage(lang);
        saveSettings();
        updateUIText();
    }

    // Centralized page navigation with bounds checking.
    function goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalMushafPages) return;
        loadMushafPage(pageIndex);
    }

    // Keep <html lang/dir> accurate for accessibility.
    function updateDocumentLanguage() {
        const lang = settings.language || 'en';
        document.documentElement.lang = lang;
        document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    }

    // Apply translations and re-render UI text/labels.
    function updateUIText() {
        updateDocumentLanguage();
        applyDisplaySettings();
        setLegendVisibility();

        // Update translatable text
        if (t) {
            if (t.title) {
                document.title = t.title;
                if (appTitle) appTitle.textContent = t.title;
            }
            decreaseFontBtn.title = t.decreaseFont;
            increaseFontBtn.title = t.increaseFont;
            prevBtn.textContent = t.nextPage;
            nextBtn.textContent = t.prevPage;
        }

        updateTajweedSelectLabels();
        populateSurahDropdown();
        populateJuzDropdown();
        populatePageDropdown();

        updateLegend();
        loadMushafPage(settings.currentPage);
        updateAbbreviationVariables();
    }

    function populateSurahDropdown() {
        const currentSurah = surahSelect.value;
        surahSelect.innerHTML = '';
        for (let i = 1; i <= 114; i++) {
            const option = document.createElement('option');
            option.value = i;
            // Use translated name if available, otherwise default
            const name = (t && t.surahNames && t.surahNames[i]) ? t.surahNames[i] : defaultSurahNames[i];
            option.textContent = `${i} ${name}`;
            surahSelect.appendChild(option);
        }
        if (currentSurah) {
            surahSelect.value = currentSurah;
        }
    }

    function populateJuzDropdown() {
        const currentJuz = juzSelect.value;
        juzSelect.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${t ? t.juz : 'Juz'} ${i}`;
            juzSelect.appendChild(option);
        }
        juzSelect.value = currentJuz;
    }

    function populatePageDropdown() {
        const currentPage = pageSelect.value;
        pageSelect.innerHTML = '';
        for (let i = 0; i < totalMushafPages; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${t ? t.page : 'Page'} ${i}`;
            pageSelect.appendChild(option);
        }
        pageSelect.value = currentPage;
    }

    function getJuzNumber(page) {
        if (page <= 20) return 1;
        if (page > 600) return 30;
        return Math.floor((page - 1) / 20) + 1;
    }

    // Render the selected page (0-based index).
    function loadMushafPage(pageIndex) {
        display.innerHTML = '';
        const pageNum = pageIndex + 1;
        const verses = quranByPage[pageNum] || [];

        const contentDiv = document.createElement('div');
        contentDiv.className = 'quran-content';
        contentDiv.setAttribute('lang', 'ur');
        let fullTextHTML = '';

        if (verses.length > 0) {
            let currentSurah = -1;
            verses.forEach(verse => {
                if (verse.surah !== currentSurah) {
                    if (verse.i === 1) {
                        const surahName = (t && t.surahNames && t.surahNames[verse.surah]) ? t.surahNames[verse.surah] : defaultSurahNames[verse.surah];
                        fullTextHTML += `<div class="surah-header">(${verse.surah}) ${surahName}</div>`;
                    }
                    currentSurah = verse.surah;
                }

                let text = verse.t.normalize("NFC");
                const BASMALAH = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحٖیمِ";

                if (verse.i === 1 && verse.surah !== 1 && verse.surah !== 9) {
                    let coloredBasmalah = BASMALAH;
                    if (settings.tajweedMode !== 'none') {
                        coloredBasmalah = applyTajweed(BASMALAH, {enabledRules: settings.enabledRules});
                    }
                    fullTextHTML += `<div class="basmalah">${coloredBasmalah}</div>`;
                }

                let processedText = text;
                if (settings.tajweedMode !== 'none') {
                    processedText = applyTajweed(text, {enabledRules: settings.enabledRules});
                }

                const verseClasses = ['verse-block'];
                if (text.includes('۩')) {
                    verseClasses.push('sajdah-verse');
                }
                fullTextHTML += `<span class="${verseClasses.join(' ')}">${processedText} <span class="verse-number">${verse.i}</span></span> `;
            });
        }
        else {
            fullTextHTML = '<p class="no-verses">No verses found for this page.</p>';
        }

        contentDiv.innerHTML = fullTextHTML;
        display.appendChild(contentDiv);

        settings.currentPage = pageIndex;
        const juz = getJuzNumber(pageNum);
        pageInfo.textContent = `${t ? t.page : 'Page'} ${pageIndex} | ${t ? t.juz : 'Juz'} ${juz}`;
        nextBtn.disabled = settings.currentPage === 0;
        prevBtn.disabled = settings.currentPage === totalMushafPages - 1;

        if (verses.length > 0) {
            surahSelect.value = verses[0].surah;
        }
        juzSelect.value = juz;
        pageSelect.value = settings.currentPage;
        window.scrollTo(0, 0);
        saveSettings();
    }

    function findFirstPageOfSurah(surahId) {
        if (typeof quranRawData === 'undefined') return 0;
        const surah = quranRawData.surahs.find(s => s.i === surahId);
        if (surah && surah.verses.length > 0) {
            return surah.verses[0].pg - 1; // Return 0-based index
        }
        return 0;
    }

    function updateLegend() {
        if (!t) return;
        const legendTitle = t.legendTitle || '';        
        const ruleLegendItems = RULE_TOGGLE_ITEMS.map((item) => {
            const checked = settings.enabledRules[item.className] !== false;
            const label = t[item.labelKey] || item.defaultLabel;
            return `<li class="legend-item legend-item--toggle ${item.legendClass}">
                <input type="checkbox" class="legend-rule-toggle ${item.legendClass}" data-rule-type="${item.className}" ${checked ? 'checked' : ''}>
                <div>${label}</div>
            </li>`;
        }).join('');        

        legend.innerHTML = `
        <h6 class="legend-title">${legendTitle}</h6>
        <ul class="legend-list">
            ${ruleLegendItems}
        </ul>        
    `;

        const checkboxes = legend.querySelectorAll('.legend-rule-toggle');
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', (event) => {
                const input = event.target;
                const ruleType = input.getAttribute('data-rule-type');
                if (!ruleType) return;
                settings.enabledRules[ruleType] = input.checked;
                saveSettings();
                loadMushafPage(settings.currentPage);
            });
        });
    }

    juzSelect.addEventListener('change', (e) => {
        const selectedJuz = parseInt(e.target.value);
        const page = (selectedJuz === 1) ? 0 : (selectedJuz - 1) * 20 + 1;
        goToPage(page);
    });

    pageSelect.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        goToPage(page);
    });

    surahSelect.addEventListener('change', (e) => {
        const selectedSurahId = parseInt(e.target.value);
        const page = findFirstPageOfSurah(selectedSurahId);
        goToPage(page);
    });

    prevBtn.addEventListener('click', () => {
        goToPage(settings.currentPage + 1);
    });

    nextBtn.addEventListener('click', () => {
        goToPage(settings.currentPage - 1);
    });
});
