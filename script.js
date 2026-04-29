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
    const FONT_SIZE_STEP = 4;
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
    const RULE_CLASS_SET = new Set(RULE_TOGGLE_ITEMS.map((item) => item.className));
    const DEFAULT_ENABLED_RULES = RULE_TOGGLE_ITEMS.reduce((acc, item) => {
        acc[item.className] = true;
        return acc;
    }, {});
    const CORPUS_BASE_URL = 'https://corpus.quran.com';

    // --- Settings ---
    const defaultSettings = {
        language: navigator.language ? navigator.language.substring(0, 2) : 'en',
        currentPage: 0, // Start from page 0
        fontFamily: "'Lateef', serif",
        fontSize: 48,
        tajweedMode: 'colors-abbr', // 'none', 'colors', 'colors-abbr'
        showTranslations: false,
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
    const corpusTranslationCache = {};
    const corpusPageRequests = {};
    const corpusDictionaryCache = {};
    const corpusDictionaryRequests = {};

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function stripHtml(value) {
        const template = document.createElement('template');
        template.innerHTML = value;
        return template.content.textContent.replace(/\s+/g, ' ').trim();
    }

    function decodeHtmlAttribute(value) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = value || '';
        return textarea.value;
    }

    function transliterateBuckwalterRoot(value) {
        const buckwalterMap = {
            "'": "ء", "|": "آ", ">": "أ", "&": "ؤ", "<": "إ", "}": "ئ", "A": "ا",
            "b": "ب", "p": "ة", "t": "ت", "v": "ث", "j": "ج", "H": "ح", "x": "خ",
            "d": "د", "*": "ذ", "r": "ر", "z": "ز", "s": "س", "$": "ش", "S": "ص",
            "D": "ض", "T": "ط", "Z": "ظ", "E": "ع", "g": "غ", "f": "ف", "q": "ق",
            "k": "ك", "l": "ل", "m": "م", "n": "ن", "h": "ه", "w": "و", "Y": "ى",
            "y": "ي"
        };

        return String(value || '')
            .replace(/[aiuoFKN~`\{\}_\^#:\.\[\];,\-+]/g, '')
            .split('')
            .map((char) => buckwalterMap[char] || '')
            .filter(Boolean)
            .join(' ');
    }

    function formatCorpusTooltip(entry) {
        if (!entry) return '';
        if (typeof entry === 'string') return entry;

        const parts = [];
        if (entry.lemma) parts.push(entry.lemma);
        if (entry.translation) parts.push(entry.translation);
        if (entry.root) {
            var root = `${entry.root}`;
            if (entry.bab) root += ` (${entry.bab})`;
            parts.push(root);
        }
        return parts.join('\n');
    }

    function parseCorpusLocation(location) {
        const match = String(location || '').match(/^(\d+):(\d+):(\d+)$/);
        if (!match) return null;
        return {
            surah: Number(match[1]),
            verse: Number(match[2]),
            word: Number(match[3])
        };
    }

    function fetchLemmaForRoot(rootCode) {
        if (!rootCode) return Promise.resolve('');
        if (corpusDictionaryCache[rootCode] !== undefined) return Promise.resolve(corpusDictionaryCache[rootCode]);
        if (corpusDictionaryRequests[rootCode]) return corpusDictionaryRequests[rootCode];

        const url = window.location.protocol === 'http:' || window.location.protocol === 'https:'
            ? `corpus-dictionary?q=${encodeURIComponent(rootCode)}`
            : `${CORPUS_BASE_URL}/qurandictionary.jsp?q=${encodeURIComponent(rootCode)}`;

        corpusDictionaryRequests[rootCode] = fetch(url)
            .then(r => r.ok ? r.text() : '')
            .then(html => {
                if (!html) { corpusDictionaryCache[rootCode] = ''; return ''; }
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const atEls = doc.querySelectorAll('.at');
                // First .at is the spaced root (e.g. "ك ت ب"), second is the lemma
                const lemma = atEls.length > 1 ? atEls[1].textContent.trim() : '';
                corpusDictionaryCache[rootCode] = lemma;
                return lemma;
            })
            .catch(() => { corpusDictionaryCache[rootCode] = ''; return ''; });

        return corpusDictionaryRequests[rootCode];
    }

    function parseCorpusWordEntries(html) {
        const parsedEntries = {};
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const locationElements = doc.querySelectorAll('.location');
        locationElements.forEach((locationElement) => {
            const key = locationElement.textContent.replace(/[()]/g, '').trim();
            const cell = locationElement.closest('td');
            if (!key || !cell) return;

            const cellHtml = cell.innerHTML;
            const translationMatch = cellHtml.match(/<span class="location">[\s\S]*?<\/span><br\s*\/?>[\s\S]*?<br\s*\/?>\s*([\s\S]*?)\s*$/i);
            if (!translationMatch) return;

            const translation = stripHtml(translationMatch[1]);
            if (!translation) return;

            const row = cell.closest('tr');
            const morphologyCell = row ? row.querySelector('.col3') : null;
            const morphologyText = morphologyCell ? stripHtml(morphologyCell.innerHTML) : '';
            const isVerb = morphologyCell ? Boolean(morphologyCell.querySelector('b') && /\bV\b/.test(morphologyCell.querySelector('b').textContent)) : false;
            const formMatch = morphologyText.match(/\(form\s+([IVX]+)\)/i);
            const bab = isVerb ? `Form ${formMatch ? formMatch[1].toUpperCase() : 'I'}` : '';
            const rootMatch = cellHtml.match(/qurandictionary\.jsp\?q=([^"#&]+)[^"]*#\([^"]+\)/i);
            const rootCode = rootMatch ? decodeURIComponent(decodeHtmlAttribute(rootMatch[1])) : '';
            const root = transliterateBuckwalterRoot(rootCode);
            parsedEntries[key] = {
                translation,
                root,
                bab
            };
        });
        return parsedEntries;
    }

    function cacheCorpusEntries(entries) {
        Object.entries(entries).forEach(([key, entry]) => {
            const tooltip = formatCorpusTooltip(entry);
            if (tooltip) {
                corpusTranslationCache[key] = tooltip;
            }
        });
    }

    async function fetchCorpusTranslation(wordKey) {
        if (!wordKey) return '';
        if (corpusTranslationCache[wordKey]) {
            return corpusTranslationCache[wordKey];
        }

        const location = parseCorpusLocation(wordKey);
        if (!location) return '';

        const pageKey = `${location.surah}:${location.verse}`;
        if (!corpusPageRequests[pageKey]) {
            const sameOriginUrl = `corpus-wordbyword?chapter=${location.surah}&verse=${location.verse}`;
            const corpusUrl = `${CORPUS_BASE_URL}/wordbyword.jsp?chapter=${location.surah}&verse=${location.verse}`;
            const url = window.location.protocol === 'http:' || window.location.protocol === 'https:'
                ? sameOriginUrl
                : corpusUrl;

            corpusPageRequests[pageKey] = fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Corpus request failed with ${response.status}`);
                    }
                    return response.text();
                })
                .then((html) => {
                    cacheCorpusEntries(parseCorpusWordEntries(html));
                    return corpusTranslationCache[wordKey] || '';
                })
                .catch((error) => {
                    console.warn('Unable to read Quranic Arabic Corpus translation.', error);
                    return '';
                });
        }

        return corpusPageRequests[pageKey];
    }

    function createWordTooltipHtml(wordHtml, wordKey) {
        const translation = wordKey ? (corpusTranslationCache[wordKey] || '') : '';
        if (!translation && !wordKey) {
            return wordHtml;
        }

        const tooltipText = translation || 'Loading translation...';
        const escapedTranslation = escapeHtml(tooltipText);
        const keyAttribute = wordKey ? ` data-corpus-location="${escapeHtml(wordKey)}"` : '';
        const pendingAttribute = translation ? '' : ' data-corpus-pending="true"';
        return `<span class="quran-word" aria-label="${escapedTranslation}" data-translation="${escapedTranslation}"${keyAttribute}${pendingAttribute}>${wordHtml}</span>`;
    }

    function renderTextWithWordTranslations(text, location = null) {
        const sourceText = String(text || '');
        const processedHtml = settings.tajweedMode === 'none'
            ? sourceText
            : applyTajweed(sourceText, {enabledRules: settings.enabledRules});
        if (!settings.showTranslations) {
            return processedHtml;
        }

        const template = document.createElement('template');
        template.innerHTML = processedHtml;
        const output = [];
        let wordParts = [];
        let wordText = '';
        let wordIndex = location && location.surah && location.verse ? 0 : null;

        function flushWord() {
            if (!wordParts.length) return;
            const wordKey = wordIndex === null ? null : `${location.surah}:${location.verse}:${++wordIndex}`;
            output.push(createWordTooltipHtml(wordParts.join(''), wordKey));
            wordParts = [];
            wordText = '';
        }

        function collectNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent.split(/(\s+)/).forEach((segment) => {
                    if (!segment) return;
                    if (/^\s+$/.test(segment)) {
                        flushWord();
                        output.push(segment);
                    }
                    else {
                        wordParts.push(escapeHtml(segment));
                        wordText += segment;
                    }
                });
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const nodeText = node.textContent || '';
            if (/\s/.test(nodeText)) {
                Array.from(node.childNodes).forEach(collectNode);
                return;
            }

            wordParts.push(node.outerHTML);
            wordText += nodeText;
        }

        Array.from(template.content.childNodes).forEach(collectNode);
        flushWord();
        return output.join('');
    }

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

    // Font Size Slider
    const fontSizeControls = document.createElement('div');
    fontSizeControls.className = 'font-size-controls';

    const fontSizeLabel = document.createElement('label');
    fontSizeLabel.className = 'font-size-label';
    fontSizeLabel.setAttribute('for', 'fontSizeSlider');
    fontSizeLabel.textContent = 'A';

    const fontSizeSlider = document.createElement('input');
    fontSizeSlider.type = 'range';
    fontSizeSlider.id = 'fontSizeSlider';
    fontSizeSlider.className = 'font-size-slider';
    fontSizeSlider.min = FONT_SIZE_MIN;
    fontSizeSlider.max = FONT_SIZE_MAX;
    fontSizeSlider.step = FONT_SIZE_STEP;
    fontSizeSlider.value = Math.round(settings.fontSize);

    fontSizeControls.appendChild(fontSizeLabel);
    fontSizeControls.appendChild(fontSizeSlider);

    // Font Type Dropdown
    const fontSelect = document.createElement('select');
    fontSelect.id = 'fontSelect';
    FONT_OPTIONS.forEach(font => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.name;
        if (font.value === settings.fontFamily) option.selected = true;
        fontSelect.appendChild(option);
    });

    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'reader-settings-button';
    settingsButton.textContent = '⚙️ Settings';
    settingsButton.setAttribute('aria-haspopup', 'dialog');
    settingsButton.setAttribute('aria-expanded', 'false');

    const settingsDialog = document.createElement('div');
    settingsDialog.className = 'reader-settings-dialog';
    settingsDialog.hidden = true;
    settingsDialog.setAttribute('role', 'dialog');
    settingsDialog.setAttribute('aria-modal', 'false');
    settingsDialog.setAttribute('aria-labelledby', 'readerSettingsTitle');
    function buildSettingsDialogHTML(tr) {
        return `
        <div class="reader-settings-panel">
            <div class="reader-settings-header">
                <h2 id="readerSettingsTitle">${tr.settings || '\u2699\ufe0f Settings'}</h2>
                <button type="button" class="dialog-close-button" aria-label="Close">×</button>
            </div>
            <div class="reader-settings-control">
                <label id="fontSelectLabel" for="fontSelect">${tr.settingsFontType || 'Font type'}</label>
                <div id="fontSelectMount"></div>
            </div>
            <fieldset>
                <legend id="tajweedDisplayLegend">${tr.settingsTajweedDisplay || 'Tajweed display'}</legend>
                <label>
                    <input type="checkbox" id="tajweedColorsToggle">
                    ${tr.tajweedColors || 'Colors'}
                </label>
                <label>
                    <input type="checkbox" id="tajweedAbbrToggle">
                    ${tr.settingsAbbreviations || 'Abbreviations'}
                </label>
            </fieldset>
            <fieldset id="wordToolsFieldset" hidden>
                <legend id="wordToolsLegend">${tr.settingsWordTools || 'Word tools'}</legend>
                <label>
                    <input type="checkbox" id="translationToggle">
                    ${tr.settingsShowTranslation || 'Show translation, root and form on hover'}
                </label>
            </fieldset>
        </div>
    `;
    }

    settingsDialog.innerHTML = buildSettingsDialogHTML(t || {});
    document.body.appendChild(settingsDialog);

    const fontSelectMount = settingsDialog.querySelector('#fontSelectMount');
    const tajweedColorsToggle = settingsDialog.querySelector('#tajweedColorsToggle');
    const tajweedAbbrToggle = settingsDialog.querySelector('#tajweedAbbrToggle');
    const wordToolsFieldset = settingsDialog.querySelector('#wordToolsFieldset');
    const translationToggle = settingsDialog.querySelector('#translationToggle');
    const settingsDialogCloseBtn = settingsDialog.querySelector('.dialog-close-button');
    if (fontSelectMount) fontSelectMount.appendChild(fontSelect);

    settingsContainer.appendChild(langSelect);
    settingsContainer.appendChild(fontSizeControls);
    settingsContainer.appendChild(settingsButton);

    // Add to Navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.appendChild(settingsContainer);
    }

    // --- Event Listeners ---
    fontSizeSlider.oninput = () => setFontSize(fontSizeSlider.value);
    fontSizeSlider.onchange = saveSettings;

    fontSelect.onchange = () => {
        settings.fontFamily = fontSelect.value;
        applyDisplaySettings();
        saveSettings();
    };

    function updateSettingsDialogText() {
        if (!t) return;
        const titleEl = settingsDialog.querySelector('#readerSettingsTitle');
        if (titleEl) titleEl.textContent = t.settings || '⚙️ Settings';
        const fontLabel = settingsDialog.querySelector('#fontSelectLabel');
        if (fontLabel) fontLabel.textContent = t.settingsFontType || 'Font type';
        fontSelect.title = t.settingsFontType || 'Font type';
        const tajweedDisplayLegend = settingsDialog.querySelector('#tajweedDisplayLegend');
        if (tajweedDisplayLegend) tajweedDisplayLegend.textContent = t.settingsTajweedDisplay || 'Tajweed display';
        const wordToolsLegend = settingsDialog.querySelector('#wordToolsLegend');
        if (wordToolsLegend) wordToolsLegend.textContent = t.settingsWordTools || 'Word tools';
        const colorsLabel = tajweedColorsToggle && tajweedColorsToggle.closest('label');
        if (colorsLabel) colorsLabel.childNodes[colorsLabel.childNodes.length - 1].textContent = '\n' + (t.tajweedColors || 'Colors') + '\n';
        const abbrLabel = tajweedAbbrToggle && tajweedAbbrToggle.closest('label');
        if (abbrLabel) abbrLabel.childNodes[abbrLabel.childNodes.length - 1].textContent = '\n' + (t.settingsAbbreviations || 'Abbreviations') + '\n';
        const transLabel = translationToggle && translationToggle.closest('label');
        if (transLabel) transLabel.childNodes[transLabel.childNodes.length - 1].textContent = '\n' + (t.settingsShowTranslation || 'Show translation, root and bab on hover') + '\n';
    }

    function syncSettingsDialogControls() {
        fontSelect.value = settings.fontFamily;
        if (!tajweedColorsToggle || !tajweedAbbrToggle || !translationToggle) return;
        tajweedColorsToggle.checked = settings.tajweedMode !== 'none';
        tajweedAbbrToggle.checked = settings.tajweedMode === 'colors-abbr';
        tajweedAbbrToggle.disabled = !tajweedColorsToggle.checked;
        translationToggle.checked = settings.showTranslations !== false;
    }

    function setTajweedModeFromDialog() {
        if (!tajweedColorsToggle.checked) {
            settings.tajweedMode = 'none';
        }
        else {
            settings.tajweedMode = tajweedAbbrToggle.checked ? 'colors-abbr' : 'colors';
        }

        applyDisplaySettings();
        setLegendVisibility();
        loadMushafPage(settings.currentPage);
        syncSettingsDialogControls();
    }

    async function syncWordToolsAvailability() {
        if (!wordToolsFieldset) return;
        let isAvailable = false;

        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            try {
                const response = await fetch('health', {cache: 'no-store'});
                isAvailable = response.ok;
            }
            catch (error) {
                isAvailable = false;
            }

            if (!isAvailable) {
                try {
                    const response = await fetch('corpus-wordbyword', {cache: 'no-store'});
                    isAvailable = response.status === 400;
                }
                catch (error) {
                    isAvailable = false;
                }
            }
        }

        wordToolsFieldset.hidden = !isAvailable;
        if (!isAvailable && settings.showTranslations) {
            settings.showTranslations = false;
            syncSettingsDialogControls();
            loadMushafPage(settings.currentPage);
            saveSettings();
        }
    }

    function positionSettingsDialog() {
        const buttonRect = settingsButton.getBoundingClientRect();
        const gap = 8;
        settingsDialog.hidden = false;
        const dialogRect = settingsDialog.getBoundingClientRect();
        const left = Math.min(
            Math.max(8, buttonRect.right - dialogRect.width),
            window.innerWidth - dialogRect.width - 8
        );
        const top = Math.min(
            buttonRect.bottom + gap,
            window.innerHeight - dialogRect.height - 8
        );
        settingsDialog.style.left = `${left}px`;
        settingsDialog.style.top = `${top}px`;
    }

    function openSettingsDialog() {
        syncSettingsDialogControls();
        positionSettingsDialog();
        settingsButton.setAttribute('aria-expanded', 'true');
    }

    function closeSettingsDialog() {
        settingsDialog.hidden = true;
        settingsButton.setAttribute('aria-expanded', 'false');
    }

    settingsButton.onclick = () => {
        if (settingsDialog.hidden) {
            openSettingsDialog();
        }
        else {
            closeSettingsDialog();
        }
    };

    settingsDialogCloseBtn.onclick = closeSettingsDialog;

    document.addEventListener('click', (event) => {
        if (
            settingsDialog.hidden ||
            settingsDialog.contains(event.target) ||
            settingsButton.contains(event.target)
        ) {
            return;
        }
        closeSettingsDialog();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !settingsDialog.hidden) {
            closeSettingsDialog();
            settingsButton.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (!settingsDialog.hidden) {
            positionSettingsDialog();
        }
    });

    window.addEventListener('scroll', () => {
        if (!settingsDialog.hidden) {
            positionSettingsDialog();
        }
    });

    tajweedColorsToggle.onchange = () => {
        if (!tajweedColorsToggle.checked) {
            tajweedAbbrToggle.checked = false;
        }
        setTajweedModeFromDialog();
    };

    tajweedAbbrToggle.onchange = () => {
        if (tajweedAbbrToggle.checked) {
            tajweedColorsToggle.checked = true;
        }
        setTajweedModeFromDialog();
    };

    translationToggle.onchange = () => {
        settings.showTranslations = translationToggle.checked;
        loadMushafPage(settings.currentPage);
        syncSettingsDialogControls();
        saveSettings();
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

    async function loadCorpusWordElement(wordElement) {
        if (!wordElement || !display.contains(wordElement)) {
            return;
        }
        if (wordElement.getAttribute('data-corpus-pending') !== 'true') {
            return;
        }

        const wordKey = wordElement.getAttribute('data-corpus-location');
        const translation = await fetchCorpusTranslation(wordKey);
        if (!translation) {
            const corpusUrl = `${CORPUS_BASE_URL}/wordmorphology.jsp?location=(${wordKey})`;
            const fallbackText = corpusUrl;
            wordElement.setAttribute('data-translation', fallbackText);
            wordElement.setAttribute('aria-label', fallbackText);
            wordElement.removeAttribute('data-corpus-pending');
            return;
        }

        wordElement.setAttribute('data-translation', translation);
        wordElement.setAttribute('aria-label', translation);
        wordElement.removeAttribute('data-corpus-pending');
    }

    display.addEventListener('mouseover', function (event) {
        loadCorpusWordElement(event.target.closest('.quran-word[data-corpus-pending="true"]'));
    });

    display.addEventListener('focusin', function (event) {
        loadCorpusWordElement(event.target.closest('.quran-word[data-corpus-pending="true"]'));
    });

    display.addEventListener('touchstart', function (event) {
        loadCorpusWordElement(event.target.closest('.quran-word[data-corpus-pending="true"]'));
    }, {passive: true});

    display.addEventListener('click', function (event) {
        loadCorpusWordElement(event.target.closest('.quran-word[data-corpus-pending="true"]'));
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
    let pageRuleTypesCache = {};
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
    const JUZ_START_PAGE_INDICES = [
        0, 21, 41, 61, 81, 101, 121, 141, 161, 181,
        201, 221, 241, 261, 281, 301, 321, 341, 361, 381,
        401, 421, 441, 461, 481, 501, 521, 541, 561, 581
    ];
    const BASMALAH = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحٖیمِ";

    // Create legend element
    const legend = document.createElement('div');
    legend.id = 'tajweed-legend';
    display.insertAdjacentElement('afterend', legend);

    if (typeof quranRawData !== 'undefined') {
        processQuranData();
        updateUIText();
        syncWordToolsAvailability();
    }
    else {
        console.error("Error: quranRawData is not defined.");
        display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
    }

    // Build a page -> verses index for fast lookup while rendering.
    function processQuranData() {
        quranByPage = {};
        pageRuleTypesCache = {};
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
        display.style.fontSize = `${settings.fontSize / 16}rem`;
        display.classList.toggle('show-abbreviations', settings.tajweedMode === 'colors-abbr');
        display.classList.toggle('compact-line-height', settings.tajweedMode !== 'colors-abbr');
        updateFontSizeControls();
    }

    function updateFontSizeControls() {
        const fontSize = Math.round(settings.fontSize);
        fontSizeSlider.value = fontSize;
        fontSizeSlider.setAttribute('aria-label', `Font size ${fontSize}sp`);
    }

    // Show/hide legend based on tajweed mode.
    function setLegendVisibility() {
        if (!legend) return;
        legend.style.display = settings.tajweedMode === 'none' ? 'none' : 'block';
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
    function setFontSize(value) {
        const parsedSize = Number(value);
        if (!Number.isFinite(parsedSize)) return;
        const nextSize = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(parsedSize)));
        if (nextSize === settings.fontSize) return;
        settings.fontSize = nextSize;
        applyDisplaySettings();
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
            fontSizeSlider.title = `${t.decreaseFont} / ${t.increaseFont}`;
            prevBtn.textContent = t.nextPage;
            nextBtn.textContent = t.prevPage;
            if (t.settings) settingsButton.textContent = t.settings;
            updateSettingsDialogText();
        }

        syncSettingsDialogControls();
        populateSurahDropdown();
        populateJuzDropdown();
        populatePageDropdown();

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

    function getJuzNumber(pageIndex) {
        for (let i = JUZ_START_PAGE_INDICES.length - 1; i >= 0; i--) {
            if (pageIndex >= JUZ_START_PAGE_INDICES[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    function findFirstPageOfJuz(juzNumber) {
        return JUZ_START_PAGE_INDICES[juzNumber - 1] || 0;
    }

    function collectRuleTypesFromHtml(html, targetSet) {
        const classRegex = /class="([^"]+)"/g;
        let match;
        while ((match = classRegex.exec(html)) !== null) {
            const classNames = match[1].split(/\s+/);
            classNames.forEach((className) => {
                if (RULE_CLASS_SET.has(className)) {
                    targetSet.add(className);
                }
            });
        }
    }

    function computeRuleTypesForPage(verses) {
        const foundRuleTypes = new Set();
        if (typeof applyTajweed !== 'function') return foundRuleTypes;
        verses.forEach((verse) => {
            const verseText = typeof verse.t === 'string' ? verse.t : '';
            if (!verseText) return;

            const fullRuleHtml = applyTajweed(verseText);
            collectRuleTypesFromHtml(fullRuleHtml, foundRuleTypes);

            if (verse.i === 1 && verse.surah !== 1 && verse.surah !== 9) {
                const basmalahRuleHtml = applyTajweed(BASMALAH);
                collectRuleTypesFromHtml(basmalahRuleHtml, foundRuleTypes);
            }
        });
        return foundRuleTypes;
    }

    function getRuleTypesForPage(pageNum, verses) {
        if (!pageRuleTypesCache[pageNum]) {
            pageRuleTypesCache[pageNum] = computeRuleTypesForPage(verses);
        }
        return pageRuleTypesCache[pageNum];
    }

    // Render the selected page (0-based index).
    function loadMushafPage(pageIndex) {
        display.innerHTML = '';
        const pageNum = pageIndex + 1;
        const verses = quranByPage[pageNum] || [];
        const pageRuleTypes = settings.tajweedMode === 'none'
            ? new Set()
            : getRuleTypesForPage(pageNum, verses);

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

                let text = verse.t;

                if (verse.i === 1 && verse.surah !== 1 && verse.surah !== 9) {
                    const basmalahWithTooltips = renderTextWithWordTranslations(BASMALAH);
                    fullTextHTML += `<div class="basmalah">${basmalahWithTooltips}</div>`;
                }

                const processedText = renderTextWithWordTranslations(text, {
                    surah: verse.surah,
                    verse: verse.i
                });

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
        const juz = getJuzNumber(pageIndex);
        pageInfo.textContent = `${t ? t.page : 'Page'} ${pageIndex} | ${t ? t.juz : 'Juz'} ${juz}`;
        nextBtn.disabled = settings.currentPage === 0;
        prevBtn.disabled = settings.currentPage === totalMushafPages - 1;

        if (verses.length > 0) {
            surahSelect.value = verses[0].surah;
        }
        juzSelect.value = juz;
        pageSelect.value = settings.currentPage;
        updateLegend(pageRuleTypes);
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

    function updateLegend(pageRuleTypes) {
        if (!t) return;
        const legendTitle = t.legendTitle || '';        
        const visibleLegendItems = pageRuleTypes
            ? RULE_TOGGLE_ITEMS.filter((item) => pageRuleTypes.has(item.className))
            : RULE_TOGGLE_ITEMS;
        const ruleLegendItems = visibleLegendItems.map((item) => {
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
        const page = findFirstPageOfJuz(selectedJuz);
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
