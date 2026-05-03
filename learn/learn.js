(function () {
    const STORAGE_KEY = "quranWordLearner.v1";
    const DB_NAME = "quranWordLearner";
    const DB_VERSION = 1;
    const CORPUS_BASE_URL = "https://corpus.quran.com";
    const TOTAL_PAGES = 605;
    const MAX_PAGE_INDEX = TOTAL_PAGES - 1;
    const PREFIXES = ["و", "ف", "ب", "ك", "ل", "س"];
    const PRONOUN_SUFFIXES = ["كما", "هما", "كم", "كن", "نا", "ها", "هم", "هن", "ك", "ه", "ي"];

    const pageSelect = document.getElementById("pageSelect");
    const statusFilter = document.getElementById("statusFilter");
    const languageSelect = document.getElementById("languageSelect");
    const skipLearningWords = document.getElementById("skipLearningWords");
    const resetAllBtn = document.getElementById("resetAllBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    const quranPage = document.getElementById("quranPage");
    const pageKnownPercent = document.getElementById("pageKnownPercent");
    const overallKnownPercent = document.getElementById("overallKnownPercent");
    const learningCount = document.getElementById("learningCount");
    const overallWordCount = document.getElementById("overallWordCount");
    const uniqueKnownCount = document.getElementById("uniqueKnownCount");
    const selectedWordTitle = document.getElementById("studyTitle");
    const selectedMeta = document.getElementById("selectedMeta");
    const wordDetails = document.getElementById("wordDetails");
    const markedWords = document.getElementById("markedWords");
    const exportBtn = document.getElementById("exportBtn");
    const exportLearningBtn = document.getElementById("exportLearningBtn");
    const storageStatus = document.getElementById("storageStatus");
    const statusButtons = Array.from(document.querySelectorAll(".status-actions button"));

    let state = {
        currentPage: 0,
        language: "en",
        skipLearningWords: false,
        marks: {}
    };
    const translations = {
        en: {
            appTitle: "Quran Word Learner",
            backToReader: "Back to reader",
            learningControls: "Learning controls",
            language: "Language",
            page: "Page",
            filterWords: "Filter words",
            allWords: "All words",
            newWords: "New words",
            new: "New",
            learning: "Learning",
            known: "Known",
            skipLearning: "Skip learning",
            resetProgress: "Reset",
            confirmResetProgress: "Reset all known and learning marks?",
            progressReset: "Progress reset.",
            previous: "Previous",
            next: "Next",
            selectWordToBegin: "Select a word to begin.",
            progress: "Progress",
            pageKnown: "page known",
            overallKnown: "overall known",
            learningWords: "learning words",
            knownWordsOverallWords: "known words / overall words",
            knownUniqueWords: "known unique words",
            selectedWord: "Selected word",
            noWordSelected: "No word selected",
            clickAnyQuranWord: "Click any Quran word to mark it.",
            wordStatus: "Word status",
            wordDetailsAvailable: "Word details will appear here when available.",
            progressSavesLocally: "Progress saves locally in this browser.",
            progressSavedBrowser: "Progress saved locally with browser storage.",
            progressSavedDatabase: "Progress saved in the local database.",
            progressLoadedDatabase: "Progress loaded from the local database.",
            markedOnThisPage: "Marked on this page",
            exportLearning: "Export learning",
            export: "Export",
            preparingWordStatuses: "Preparing word statuses...",
            noVersesFound: "No verses found.",
            noPageData: "No page data available.",
            noMarkedWords: "No marked words on this page yet.",
            loadingWordDetails: "Loading word details...",
            noOnlineDetail: "No online detail found yet. Your mark is still saved locally.",
            quranDataMissing: "Quran data could not be loaded.",
            key: "key",
            totalOccurrences: "{count} total occurrence{plural}",
            examples: "Examples",
            none: "none",
            csvWord: "word",
            csvKey: "key",
            csvOccurrences: "occurrences",
            csvExamples: "examples"
        },
        tr: {
            appTitle: "Kuran Kelime Öğrenici",
            backToReader: "Okuyucuya dön",
            learningControls: "Öğrenme kontrolleri",
            language: "Dil",
            page: "Sayfa",
            filterWords: "Kelimeleri filtrele",
            allWords: "Tüm kelimeler",
            newWords: "Yeni kelimeler",
            new: "Yeni",
            learning: "Öğreniliyor",
            known: "Biliniyor",
            skipLearning: "Öğrenilenleri atla",
            resetProgress: "Sıfırla",
            confirmResetProgress: "Tüm bilinen ve öğrenilen işaretler sıfırlansın mı?",
            progressReset: "İlerleme sıfırlandı.",
            previous: "Önceki",
            next: "Sonraki",
            selectWordToBegin: "Başlamak için bir kelime seç.",
            progress: "İlerleme",
            pageKnown: "sayfada bilinen",
            overallKnown: "genel bilinen",
            learningWords: "öğrenilen kelimeler",
            knownWordsOverallWords: "bilinen kelimeler / toplam kelimeler",
            knownUniqueWords: "bilinen benzersiz kelimeler",
            selectedWord: "Seçili kelime",
            noWordSelected: "Kelime seçilmedi",
            clickAnyQuranWord: "İşaretlemek için herhangi bir Kuran kelimesine tıkla.",
            wordStatus: "Kelime durumu",
            wordDetailsAvailable: "Kelime ayrıntıları uygun olduğunda burada görünür.",
            progressSavesLocally: "İlerleme bu tarayıcıda yerel olarak kaydedilir.",
            progressSavedBrowser: "İlerleme tarayıcı depolamasına yerel olarak kaydedildi.",
            progressSavedDatabase: "İlerleme yerel veritabanına kaydedildi.",
            progressLoadedDatabase: "İlerleme yerel veritabanından yüklendi.",
            markedOnThisPage: "Bu sayfada işaretlenenler",
            exportLearning: "Öğrenilenleri dışa aktar",
            export: "Dışa aktar",
            preparingWordStatuses: "Kelime durumları hazırlanıyor...",
            noVersesFound: "Ayet bulunamadı.",
            noPageData: "Sayfa verisi yok.",
            noMarkedWords: "Bu sayfada henüz işaretli kelime yok.",
            loadingWordDetails: "Kelime ayrıntıları yükleniyor...",
            noOnlineDetail: "Henüz çevrim içi ayrıntı bulunamadı. İşaretin yine de yerel olarak kaydedildi.",
            quranDataMissing: "Kuran verisi yüklenemedi.",
            key: "anahtar",
            totalOccurrences: "{count} toplam kullanım",
            examples: "Örnekler",
            none: "yok",
            csvWord: "kelime",
            csvKey: "anahtar",
            csvOccurrences: "kullanım sayısı",
            csvExamples: "örnekler"
        },
        nl: {
            appTitle: "Koran Woorden Leren",
            backToReader: "Terug naar lezer",
            learningControls: "Leerbediening",
            language: "Taal",
            page: "Pagina",
            filterWords: "Woorden filteren",
            allWords: "Alle woorden",
            newWords: "Nieuwe woorden",
            new: "Nieuw",
            learning: "Aan het leren",
            known: "Bekend",
            skipLearning: "Leerwoorden overslaan",
            resetProgress: "Resetten",
            confirmResetProgress: "Alle bekende en leer-markeringen resetten?",
            progressReset: "Voortgang gereset.",
            previous: "Vorige",
            next: "Volgende",
            selectWordToBegin: "Selecteer een woord om te beginnen.",
            progress: "Voortgang",
            pageKnown: "pagina bekend",
            overallKnown: "totaal bekend",
            learningWords: "leerwoorden",
            knownWordsOverallWords: "bekende woorden / totaal woorden",
            knownUniqueWords: "bekende unieke woorden",
            selectedWord: "Geselecteerd woord",
            noWordSelected: "Geen woord geselecteerd",
            clickAnyQuranWord: "Klik op een Koranwoord om het te markeren.",
            wordStatus: "Woordstatus",
            wordDetailsAvailable: "Woorddetails verschijnen hier wanneer ze beschikbaar zijn.",
            progressSavesLocally: "Voortgang wordt lokaal in deze browser opgeslagen.",
            progressSavedBrowser: "Voortgang lokaal opgeslagen met browseropslag.",
            progressSavedDatabase: "Voortgang opgeslagen in de lokale database.",
            progressLoadedDatabase: "Voortgang geladen uit de lokale database.",
            markedOnThisPage: "Gemarkeerd op deze pagina",
            exportLearning: "Leerwoorden exporteren",
            export: "Exporteren",
            preparingWordStatuses: "Woordstatussen voorbereiden...",
            noVersesFound: "Geen verzen gevonden.",
            noPageData: "Geen paginagegevens beschikbaar.",
            noMarkedWords: "Nog geen gemarkeerde woorden op deze pagina.",
            loadingWordDetails: "Woorddetails laden...",
            noOnlineDetail: "Nog geen online details gevonden. Je markering is lokaal opgeslagen.",
            quranDataMissing: "Korangegevens konden niet worden geladen.",
            key: "sleutel",
            totalOccurrences: "{count} totale keer gebruikt",
            examples: "Voorbeelden",
            none: "geen",
            csvWord: "woord",
            csvKey: "sleutel",
            csvOccurrences: "aantal keer",
            csvExamples: "voorbeelden"
        }
    };
    let quranByPage = {};
    let allWords = [];
    let selectedWord = null;
    const corpusCache = {};
    const corpusRequests = {};
    const corpusDictionaryCache = {};
    const corpusDictionaryRequests = {};
    const morphologyKeyByLocation = {};
    const morphologyPageRequests = {};
    let dbPromise = null;
    let isProcessingPage = false;
    let pageNavigationToken = 0;

    function setStorageStatus(message) {
        if (storageStatus) {
            storageStatus.textContent = message;
        }
    }

    function getLanguage() {
        return translations[state.language] ? state.language : "en";
    }

    function t(key, replacements = {}) {
        const text = (translations[getLanguage()] && translations[getLanguage()][key]) || translations.en[key] || key;
        return Object.entries(replacements).reduce((result, [name, value]) => {
            return result.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
        }, text);
    }

    function applyLanguage() {
        document.documentElement.lang = getLanguage();
        document.title = t("appTitle");
        if (languageSelect) {
            languageSelect.value = getLanguage();
        }
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });
        document.querySelectorAll("[data-i18n-title]").forEach((element) => {
            element.setAttribute("title", t(element.dataset.i18nTitle));
        });
        document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
            element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
        });
    }

    function openProgressDatabase() {
        if (!("indexedDB" in window)) {
            return Promise.resolve(null);
        }
        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains("settings")) {
                    db.createObjectStore("settings", {keyPath: "key"});
                }
                if (!db.objectStoreNames.contains("marks")) {
                    db.createObjectStore("marks", {keyPath: "word"});
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
        });

        return dbPromise;
    }

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function transactionDone(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    function readLegacyState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return {
                currentPage: normalizeStoredPageIndex(saved.currentPage, saved.pageIndexBase),
                language: translations[saved.language] ? saved.language : "en",
                skipLearningWords: Boolean(saved.skipLearningWords),
                marks: saved.marks && typeof saved.marks === "object" ? saved.marks : {}
            };
        }
        catch (error) {
            return {currentPage: 0, language: "en", skipLearningWords: false, marks: {}};
        }
    }

    function normalizeStoredPageIndex(value, pageIndexBase) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return 0;
        const pageIndex = pageIndexBase === 0 ? parsed : parsed - 1;
        return Math.min(MAX_PAGE_INDEX, Math.max(0, Math.round(pageIndex)));
    }

    function saveLegacyState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({...state, pageIndexBase: 0}));
    }

    async function loadState() {
        const db = await openProgressDatabase();
        if (!db) {
            state = readLegacyState();
            setStorageStatus(t("progressSavedBrowser"));
            return;
        }

        try {
            const transaction = db.transaction(["settings", "marks"], "readonly");
            const done = transactionDone(transaction);
            const settingsStore = transaction.objectStore("settings");
            const marksStore = transaction.objectStore("marks");
            const currentPageRecord = await requestToPromise(settingsStore.get("currentPage"));
            const pageIndexBaseRecord = await requestToPromise(settingsStore.get("pageIndexBase"));
            const languageRecord = await requestToPromise(settingsStore.get("language"));
            const skipLearningWordsRecord = await requestToPromise(settingsStore.get("skipLearningWords"));
            const markRecords = await requestToPromise(marksStore.getAll());
            await done;

            state = {
                currentPage: currentPageRecord ? normalizeStoredPageIndex(currentPageRecord.value, pageIndexBaseRecord ? pageIndexBaseRecord.value : undefined) : 0,
                language: languageRecord && translations[languageRecord.value] ? languageRecord.value : "en",
                skipLearningWords: Boolean(skipLearningWordsRecord && skipLearningWordsRecord.value),
                marks: markRecords.reduce((marks, record) => {
                    if (record.word && record.status) {
                        marks[record.word] = record.status;
                    }
                    return marks;
                }, {})
            };

            if (currentPageRecord && (!pageIndexBaseRecord || pageIndexBaseRecord.value !== 0)) {
                await saveState();
            }

            if (!markRecords.length && !currentPageRecord) {
                const legacyState = readLegacyState();
                if (Object.keys(legacyState.marks).length || legacyState.currentPage !== 0) {
                    state = legacyState;
                    await saveState();
                }
            }
            setStorageStatus(t("progressLoadedDatabase"));
        }
        catch (error) {
            state = readLegacyState();
            setStorageStatus(t("progressSavedBrowser"));
        }
    }

    async function saveState() {
        const db = await openProgressDatabase();
        if (!db) {
            saveLegacyState();
            setStorageStatus(t("progressSavedBrowser"));
            return;
        }

        try {
            const transaction = db.transaction(["settings", "marks"], "readwrite");
            const done = transactionDone(transaction);
            const settingsStore = transaction.objectStore("settings");
            const marksStore = transaction.objectStore("marks");

            settingsStore.put({key: "currentPage", value: state.currentPage});
            settingsStore.put({key: "pageIndexBase", value: 0});
            settingsStore.put({key: "language", value: getLanguage()});
            settingsStore.put({key: "skipLearningWords", value: Boolean(state.skipLearningWords)});
            marksStore.clear();
            Object.entries(state.marks).forEach(([word, status]) => {
                marksStore.put({
                    word,
                    status,
                    updatedAt: new Date().toISOString()
                });
            });

            await done;
            setStorageStatus(t("progressSavedDatabase"));
        }
        catch (error) {
            saveLegacyState();
            setStorageStatus(t("progressSavedBrowser"));
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function stripHtml(value) {
        const template = document.createElement("template");
        template.innerHTML = value;
        return template.content.textContent.replace(/\s+/g, " ").trim();
    }

    function decodeHtmlAttribute(value) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = value || "";
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

        return String(value || "")
            .replace(/[aiuoFKN~`\{\}_\^#:\.\[\];,\-+]/g, "")
            .split("")
            .map((char) => buckwalterMap[char] || "")
            .filter(Boolean)
            .join("");
    }

    function stripWaqfSigns(value) {
        return String(value || "").replace(/[ۖۗۘۙۚۛۜ۝۞ۣؕ۟۠ۢۤۥۦۧۨ۩]/g, "");
    }

    function normalizeArabicWord(value) {
        return stripWaqfSigns(value)
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
            .replace(/[ـ]/g, "")
            .replace(/[إأٱآا]/g, "ا")
            .replace(/[ىيی]/g, "ي")
            .replace(/[ؤ]/g, "و")
            .replace(/[ئ]/g, "ي")
            .replace(/[ة]/g, "ه")
            .replace(/[^\u0600-\u06FF]/g, "")
            .trim();
    }

    function getLearningKey(display) {
        const cleanDisplay = stripWaqfSigns(display);
        const fullKey = normalizeArabicWord(cleanDisplay);
        let key = fullKey;
        const prefixes = [];
        const articles = [];
        const suffixes = [];
        let remainingDisplay = cleanDisplay;

        if (shouldStripInterrogativePrefix(key, remainingDisplay)) {
            prefixes.push("ا");
            key = key.slice(1);
            remainingDisplay = remainingDisplay.slice(1).replace(/^[\u064B-\u065F\u0670]+/, "");
        }

        const prefix = PREFIXES.find((candidate) => key.startsWith(candidate) && remainingDisplay.startsWith(candidate));
        if (prefix && remainingDisplay.startsWith(prefix)) {
            const afterPrefix = remainingDisplay.slice(prefix.length);
            const nextKey = key.slice(prefix.length);
            if (shouldStripPrefix(prefix, afterPrefix) && nextKey.length >= 2) {
                prefixes.push(prefix);
                key = nextKey;
                remainingDisplay = afterPrefix.replace(/^[\u064B-\u065F\u0670]+/, "");
            }
        }

        const normalizedRemaining = normalizeArabicWord(remainingDisplay);
        if (key.startsWith("ال") && normalizedRemaining.startsWith("ال") && key.length > 3) {
            articles.push("ال");
            key = key.slice(2);
            remainingDisplay = remainingDisplay.replace(/^ا[\u064B-\u065F\u0670]*ل[\u064B-\u065F\u0670]*/, "");
        }

        const suffix = PRONOUN_SUFFIXES.find((candidate) => key.endsWith(candidate));
        if (suffix) {
            const nextKey = key.slice(0, -suffix.length);
            if (
                nextKey.length >= 2 &&
                normalizeArabicWord(remainingDisplay).endsWith(suffix) &&
                shouldStripPronounSuffix(suffix, remainingDisplay)
            ) {
                suffixes.push(suffix);
                key = nextKey;
            }
        }

        return {
            key,
            fullKey,
            prefixes,
            articles,
            suffixes
        };
    }

    function getCorpusKey(location, fallbackKey) {
        return morphologyKeyByLocation[location] || fallbackKey;
    }

    function getWordKey(word) {
        return word.isStandalonePrefix ? word.key : getCorpusKey(getCorpusLocation(word), word.key);
    }

    function shouldStripPronounSuffix(candidate, remainingDisplay) {
        if (candidate === "ك") {
            return /(?:[\u064F\u064E]\u0651?كَ|[یويو]ْكَ)$/.test(remainingDisplay);
        }
        if (candidate === "ه") {
            return /ه[ُِ]$/.test(remainingDisplay);
        }
        if (candidate === "ي") {
            return /[ِ]ی$|[ِ]ي$/.test(remainingDisplay);
        }
        return true;
    }

    function shouldStripInterrogativePrefix(key, remainingDisplay) {
        if (!key.startsWith("ا") || !/^[اأإآٱ]\u064E/.test(remainingDisplay)) {
            return false;
        }

        const afterInterrogative = remainingDisplay.slice(1).replace(/^[\u064B-\u065F\u0670]+/, "");
        return PREFIXES.some((prefix) => {
            if (!key.slice(1).startsWith(prefix) || !afterInterrogative.startsWith(prefix)) {
                return false;
            }
            const afterPrefix = afterInterrogative.slice(prefix.length);
            return shouldStripPrefix(prefix, afterPrefix);
        });
    }

    function shouldStripPrefix(candidate, afterPrefix) {
        if (candidate === "ك") {
            return /^\u064E/.test(afterPrefix);
        }
        return /^[\u064B-\u065F\u0670]/.test(afterPrefix);
    }

    function splitWords(text) {
        return String(text || "")
            .split(/\s+/)
            .map((word) => word.trim())
            .filter(Boolean);
    }

    function renderNonWordToken(display) {
        return `<span class="non-word-token">${escapeHtml(display)}</span> `;
    }

    function isStandaloneCorpusPrefix(display) {
        const cleanDisplay = stripWaqfSigns(display);
        const normalized = normalizeArabicWord(cleanDisplay);
        return (
            normalized === "و" ||
            normalized === "ف" ||
            normalized === "يا" ||
            normalized === "ويا" ||
            normalized === "فيا"
        );
    }

    function getCorpusWordSpan(display) {
        const cleanDisplay = stripWaqfSigns(display);
        const normalized = normalizeArabicWord(cleanDisplay);
        if (isStandaloneCorpusPrefix(display)) {
            return 0;
        }
        if (normalized.startsWith("ذوال") && normalized.length > 4) {
            return 2;
        }
        return 1;
    }

    function buildVerseWordRecords(verse, surah, pageIndex) {
        let corpusWordIndex = 1;
        return splitWords(verse.t).map((display, index) => {
            const normalized = getLearningKey(display);
            const isStandalonePrefix = isStandaloneCorpusPrefix(display);
            const corpusWordSpan = getCorpusWordSpan(display);
            const wordRecord = {
                key: normalized.key,
                fullKey: normalized.fullKey,
                prefixes: normalized.prefixes,
                articles: normalized.articles,
                suffixes: normalized.suffixes,
                display,
                page: pageIndex,
                surah: surah.i,
                ayah: verse.i,
                word: index + 1,
                corpusWord: corpusWordIndex,
                isStandalonePrefix
            };

            corpusWordIndex += corpusWordSpan;

            return wordRecord;
        });
    }

    function buildIndexes() {
        quranByPage = {};
        allWords = [];

        quranRawData.surahs.forEach((surah) => {
            surah.verses.forEach((verse) => {
                const pageIndex = Number(verse.pg) - 1;
                if (!quranByPage[pageIndex]) {
                    quranByPage[pageIndex] = [];
                }

                const enrichedVerse = {
                    surah: surah.i,
                    surahName: surah.tr,
                    ayah: verse.i,
                    text: verse.t,
                    page: pageIndex
                };
                quranByPage[pageIndex].push(enrichedVerse);

                buildVerseWordRecords(verse, surah, pageIndex)
                    .filter((word) => word.key)
                    .forEach((word) => allWords.push(word));
            });
        });
    }

    async function migrateAttachedPrefixMarks() {
        let changed = false;
        allWords.forEach((word) => {
            const legacyKeys = [word.fullKey];
            if (word.prefixes && word.prefixes.length) {
                legacyKeys.push(word.fullKey.slice(word.prefixes.join("").length));
            }
            if (word.articles && word.articles.length) {
                const withoutPrefix = word.prefixes && word.prefixes.length
                    ? word.fullKey.slice(word.prefixes.join("").length)
                    : word.fullKey;
                legacyKeys.push(withoutPrefix);
                legacyKeys.push(word.key.startsWith("ال") ? word.key : `ال${word.key}`);
            }

            legacyKeys.forEach((legacyKey) => {
                if (legacyKey && legacyKey !== word.key && state.marks[legacyKey] && !state.marks[word.key]) {
                    state.marks[word.key] = state.marks[legacyKey];
                    changed = true;
                }
            });
        });

        if (changed) {
            await saveState();
        }
    }

    function getUniqueKeys(words) {
        return Array.from(new Set(words.map((word) => getWordKey(word)).filter(Boolean)));
    }

    function formatCount(value) {
        return new Intl.NumberFormat("en-US").format(value);
    }

    function formatOccurrenceText(count) {
        return t("totalOccurrences", {
            count: formatCount(count),
            plural: count === 1 ? "" : "s"
        });
    }

    function getStatus(key) {
        return state.marks[key] || "new";
    }

    function shouldSelectAsNextStudyWord(word) {
        const status = getStatus(getWordKey(word));
        return status !== "known" && (!state.skipLearningWords || status !== "learning");
    }

    function getWordLocation(word) {
        return `${word.surah}:${word.ayah}:${word.word}`;
    }

    function getCorpusLocation(word) {
        return `${word.surah}:${word.ayah}:${word.corpusWord || word.word}`;
    }

    function getLocationIndex(location) {
        if (!location) return -1;
        return allWords.findIndex((word) => getWordLocation(word) === location);
    }

    async function findNextStudyWord(fromLocation) {
        if (!allWords.length) return null;
        const startIndex = getLocationIndex(fromLocation);
        const searchStart = startIndex >= 0 ? startIndex + 1 : 0;
        let preparedPage = null;

        for (let index = searchStart; index < allWords.length; index += 1) {
            if (allWords[index].page !== preparedPage) {
                preparedPage = allWords[index].page;
                await loadPageMorphology(preparedPage);
            }
            if (shouldSelectAsNextStudyWord(allWords[index])) {
                return allWords[index];
            }
        }

        return null;
    }

    function selectWordRecord(word) {
        if (!word) {
            selectedWord = null;
            return;
        }

        selectedWord = {
            key: getWordKey(word),
            display: word.display,
            location: getWordLocation(word),
            corpusLocation: getCorpusLocation(word)
        };
        state.currentPage = word.page;
    }

    async function setStatus(key, status, options = {}) {
        if (!key) return;
        const currentLocation = selectedWord ? selectedWord.location : "";

        if (status === "new") {
            delete state.marks[key];
        }
        else {
            state.marks[key] = status;
        }

        const shouldAdvance = options.advanceToNextStudyWord && (status === "known" || status === "learning");
        if (shouldAdvance) {
            statusFilter.value = "all";
            isProcessingPage = true;
        }

        renderCurrentPage();
        try {
            await saveState();

            if (shouldAdvance) {
                const nextWord = await findNextStudyWord(currentLocation);
                selectWordRecord(nextWord);
                await saveState();
            }
        }
        finally {
            if (shouldAdvance) {
                isProcessingPage = false;
            }
        }

        renderCurrentPage();

        if (shouldAdvance && selectedWord && selectedWord.corpusLocation) {
            loadWordDetails(selectedWord.corpusLocation);
        }
    }

    function getCurrentPageWords() {
        return allWords.filter((word) => word.page === state.currentPage);
    }

    function countOccurrences(key) {
        return allWords.filter((word) => getWordKey(word) === key).length;
    }

    function getExamples(key) {
        const seen = new Set();
        return allWords
            .filter((word) => getWordKey(word) === key)
            .filter((word) => {
                const ref = `${word.surah}:${word.ayah}`;
                if (seen.has(ref)) return false;
                seen.add(ref);
                return true;
            })
            .slice(0, 5)
            .map((word) => `${word.surah}:${word.ayah}`)
            .join(", ");
    }

    function populatePageSelect() {
        const selectedPage = pageSelect.value;
        pageSelect.innerHTML = "";
        for (let page = 0; page < TOTAL_PAGES; page += 1) {
            const option = document.createElement("option");
            option.value = String(page);
            option.textContent = `${t("page")} ${page}`;
            pageSelect.appendChild(option);
        }
        if (selectedPage) {
            pageSelect.value = selectedPage;
        }
    }

    function renderCurrentPage(options = {}) {
        const shouldLoadMorphology = options.loadMorphology !== false;
        state.currentPage = Math.min(MAX_PAGE_INDEX, Math.max(0, Number(state.currentPage) || 0));
        pageSelect.value = String(state.currentPage);
        skipLearningWords.checked = Boolean(state.skipLearningWords);
        pageSelect.disabled = isProcessingPage;
        statusFilter.disabled = isProcessingPage;
        skipLearningWords.disabled = isProcessingPage;
        resetAllBtn.disabled = isProcessingPage;
        prevBtn.disabled = isProcessingPage || state.currentPage <= 0;
        nextBtn.disabled = isProcessingPage || state.currentPage >= MAX_PAGE_INDEX;
        quranPage.classList.toggle("is-processing", isProcessingPage);
        quranPage.setAttribute("aria-busy", isProcessingPage ? "true" : "false");

        const verses = quranByPage[state.currentPage] || [];
        const surahNames = Array.from(new Set(verses.map((verse) => verse.surahName))).join(" / ");
        pageTitle.textContent = `${t("page")} ${state.currentPage}`;
        pageSubtitle.textContent = isProcessingPage ? t("preparingWordStatuses") : (surahNames ? surahNames : t("noVersesFound"));

        const filter = statusFilter.value;
        let html = "";
        let lastSurah = null;
        verses.forEach((verse) => {
            if (verse.surah !== lastSurah) {
                html += `<span class="surah-break">${escapeHtml(verse.surah)}. ${escapeHtml(verse.surahName)}</span>`;
                lastSurah = verse.surah;
            }

            html += `<span class="verse-block" data-ref="${verse.surah}:${verse.ayah}">`;
            buildVerseWordRecords({
                t: verse.text,
                i: verse.ayah
            }, {
                i: verse.surah
            }, state.currentPage).forEach((wordRecord) => {
                const normalized = wordRecord;
                const location = getWordLocation(wordRecord);
                const corpusLocation = getCorpusLocation(wordRecord);
                const display = wordRecord.display;
                const key = getWordKey(wordRecord);
                if (!key) {
                    html += renderNonWordToken(display);
                    return;
                }
                const status = getStatus(key);
                const hidden = filter !== "all" && status !== filter ? " is-hidden" : "";
                const selected = selectedWord && selectedWord.key === key ? " is-selected" : "";
                const disabled = isProcessingPage ? " disabled" : "";
                html += `<button class="word-token status-${status}${hidden}${selected}" type="button" data-key="${escapeHtml(key)}" data-full-key="${escapeHtml(normalized.fullKey)}" data-display="${escapeHtml(display)}" data-location="${escapeHtml(location)}" data-corpus-location="${escapeHtml(corpusLocation)}"${disabled}>${escapeHtml(display)}</button> `;
            });
            html += `<span class="verse-number">${escapeHtml(verse.ayah)}</span> </span>`;
        });

        quranPage.innerHTML = html || `<p class="empty-state">${escapeHtml(t("noPageData"))}</p>`;
        renderProgress();
        renderMarkedWords();
        renderSelectedWord();
        if (shouldLoadMorphology) {
            loadPageMorphology(state.currentPage);
        }
    }

    function renderProgress() {
        const pageUniqueKeys = getUniqueKeys(getCurrentPageWords());
        const allUniqueKeys = getUniqueKeys(allWords);
        const pageKnown = pageUniqueKeys.filter((key) => getStatus(key) === "known").length;
        const overallKnown = allUniqueKeys.filter((key) => getStatus(key) === "known").length;
        const knownWordOccurrences = allWords.filter((word) => getStatus(getWordKey(word)) === "known").length;
        const learning = allUniqueKeys.filter((key) => getStatus(key) === "learning").length;

        pageKnownPercent.textContent = pageUniqueKeys.length ? `${Math.round((pageKnown / pageUniqueKeys.length) * 100)}%` : "0%";
        overallKnownPercent.textContent = allWords.length ? `${Math.round((knownWordOccurrences / allWords.length) * 100)}%` : "0%";
        learningCount.textContent = formatCount(learning);
        overallWordCount.textContent = `${formatCount(knownWordOccurrences)}/${formatCount(allWords.length)}`;
        uniqueKnownCount.textContent = `${formatCount(overallKnown)}/${formatCount(allUniqueKeys.length)}`;
    }

    function renderMarkedWords() {
        const pageUniqueKeys = getUniqueKeys(getCurrentPageWords());
        const marked = pageUniqueKeys
            .filter((key) => getStatus(key) !== "new")
            .sort((a, b) => getStatus(a).localeCompare(getStatus(b)));

        if (!marked.length) {
            markedWords.innerHTML = `<p class="empty-state">${escapeHtml(t("noMarkedWords"))}</p>`;
            return;
        }

        markedWords.innerHTML = marked.map((key) => {
            const sample = allWords.find((word) => getWordKey(word) === key);
            const status = getStatus(key);
            return `
                <button type="button" class="marked-word" data-key="${escapeHtml(key)}" data-display="${escapeHtml(sample ? sample.display : key)}">
                    <strong>${escapeHtml(sample ? sample.display : key)}</strong>
                    <span>${escapeHtml(formatOccurrenceText(countOccurrences(key)))}</span>
                    <em class="status-pill status-${status}">${escapeHtml(t(status))}</em>
                </button>
            `;
        }).join("");
    }

    function renderSelectedWord() {
        statusButtons.forEach((button) => {
            button.disabled = isProcessingPage || !selectedWord;
            button.setAttribute("aria-pressed", selectedWord && getStatus(selectedWord.key) === button.dataset.status ? "true" : "false");
        });

        if (!selectedWord) {
            selectedWordTitle.textContent = t("noWordSelected");
            selectedMeta.textContent = t("clickAnyQuranWord");
            wordDetails.textContent = t("wordDetailsAvailable");
            return;
        }

        selectedWordTitle.textContent = selectedWord.display;
        selectedMeta.textContent = `${selectedWord.location} · ${t("key")}: ${selectedWord.key} · ${formatOccurrenceText(countOccurrences(selectedWord.key))} · ${t("examples")}: ${getExamples(selectedWord.key) || t("none")}`;
    }

    function selectWordFromElement(element) {
        const key = element.getAttribute("data-key");
        const display = element.getAttribute("data-display");
        const location = element.getAttribute("data-location");
        const corpusLocation = element.getAttribute("data-corpus-location") || location;
        selectedWord = {key, display, location, corpusLocation};
        renderCurrentPage();
        loadWordDetails(corpusLocation);
    }

    function parseCorpusEntries(html) {
        const parsedEntries = {};
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll(".location").forEach((locationElement) => {
            const key = locationElement.textContent.replace(/[()]/g, "").trim();
            const cell = locationElement.closest("td");
            if (!key || !cell) return;

            const cellHtml = cell.innerHTML;
            const translationMatch = cellHtml.match(/<span class="location">[\s\S]*?<\/span><br\s*\/?>[\s\S]*?<br\s*\/?>\s*([\s\S]*?)\s*$/i);
            const translation = translationMatch ? stripHtml(translationMatch[1]) : "";
            const row = cell.closest("tr");
            const morphologyCell = row ? row.querySelector(".col3") : null;
            const morphology = morphologyCell ? stripHtml(morphologyCell.innerHTML) : "";
            const rootMatch = cellHtml.match(/qurandictionary\.jsp\?q=([^"#&]+)[^"]*#\([^"]+\)/i);
            const rootCode = rootMatch ? decodeURIComponent(decodeHtmlAttribute(rootMatch[1])) : "";
            const root = transliterateBuckwalterRoot(rootCode);
            parsedEntries[key] = {
                details: [translation, morphology].filter(Boolean).join("\n"),
                root,
                rootCode
            };
        });
        return parsedEntries;
    }

    async function fetchLemmaForRoot(rootCode) {
        if (!rootCode) return "";
        if (corpusDictionaryCache[rootCode] !== undefined) return corpusDictionaryCache[rootCode];
        if (corpusDictionaryRequests[rootCode]) return corpusDictionaryRequests[rootCode];

        const url = window.location.protocol === "http:" || window.location.protocol === "https:"
            ? `corpus-dictionary?q=${encodeURIComponent(rootCode)}`
            : `${CORPUS_BASE_URL}/qurandictionary.jsp?q=${encodeURIComponent(rootCode)}`;

        corpusDictionaryRequests[rootCode] = fetch(url)
            .then((response) => response.ok ? response.text() : "")
            .then((html) => {
                if (!html) {
                    corpusDictionaryCache[rootCode] = "";
                    return "";
                }
                const doc = new DOMParser().parseFromString(html, "text/html");
                const atEls = doc.querySelectorAll(".at");
                const lemma = atEls.length > 1 ? atEls[1].textContent.trim() : "";
                corpusDictionaryCache[rootCode] = lemma;
                return lemma;
            })
            .catch(() => {
                corpusDictionaryCache[rootCode] = "";
                return "";
            });

        return corpusDictionaryRequests[rootCode];
    }

    async function applyCorpusMorphologyEntries(entries) {
        let changed = false;
        await Promise.all(Object.entries(entries).map(async ([location, entry]) => {
            const lemma = await fetchLemmaForRoot(entry.rootCode);
            const morphologyKey = normalizeArabicWord(lemma || entry.root);
            if (!morphologyKey) return;

            const word = allWords.find((candidate) => getCorpusLocation(candidate) === location && !candidate.isStandalonePrefix);
            const legacyKeys = word ? [word.key, word.fullKey].filter(Boolean) : [];
            legacyKeys.forEach((legacyKey) => {
                if (legacyKey !== morphologyKey && state.marks[legacyKey] && !state.marks[morphologyKey]) {
                    state.marks[morphologyKey] = state.marks[legacyKey];
                }
            });

            if (morphologyKeyByLocation[location] !== morphologyKey) {
                morphologyKeyByLocation[location] = morphologyKey;
                changed = true;
            }

            if (selectedWord && selectedWord.corpusLocation === location && selectedWord.location !== location && selectedWord.key !== morphologyKey) {
                selectedWord.key = morphologyKey;
            }
        }));

        if (changed) {
            await saveState();
        }

        return changed;
    }

    async function fetchCorpusLocation(location) {
        if (corpusCache[location]) return corpusCache[location].details || "";
        const parts = String(location || "").split(":").map(Number);
        if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return "";

        const pageKey = `${parts[0]}:${parts[1]}`;
        if (!corpusRequests[pageKey]) {
            const sameOriginUrl = `corpus-wordbyword?chapter=${parts[0]}&verse=${parts[1]}`;
            const directUrl = `${CORPUS_BASE_URL}/wordbyword.jsp?chapter=${parts[0]}&verse=${parts[1]}`;
            const url = window.location.protocol === "http:" || window.location.protocol === "https:" ? sameOriginUrl : directUrl;
            corpusRequests[pageKey] = fetch(url)
                .then((response) => response.ok ? response.text() : "")
                .then((html) => {
                    const entries = parseCorpusEntries(html);
                    Object.assign(corpusCache, entries);
                    return entries;
                })
                .catch(() => ({}));
        }

        const entries = await corpusRequests[pageKey];
        await applyCorpusMorphologyEntries(entries);
        return entries[location] ? entries[location].details : "";
    }

    async function loadPageMorphology(page) {
        if (morphologyPageRequests[page]) return morphologyPageRequests[page];

        const verses = quranByPage[page] || [];
        morphologyPageRequests[page] = Promise.all(verses.map((verse) => {
            const pageKey = `${verse.surah}:${verse.ayah}`;
            if (!corpusRequests[pageKey]) {
                const sameOriginUrl = `corpus-wordbyword?chapter=${verse.surah}&verse=${verse.ayah}`;
                const directUrl = `${CORPUS_BASE_URL}/wordbyword.jsp?chapter=${verse.surah}&verse=${verse.ayah}`;
                const url = window.location.protocol === "http:" || window.location.protocol === "https:" ? sameOriginUrl : directUrl;
                corpusRequests[pageKey] = fetch(url)
                    .then((response) => response.ok ? response.text() : "")
                    .then((html) => {
                        const entries = parseCorpusEntries(html);
                        Object.assign(corpusCache, entries);
                        return entries;
                    })
                    .catch(() => ({}));
            }
            return corpusRequests[pageKey].then(applyCorpusMorphologyEntries);
        }))
            .then((results) => {
                if (results.some(Boolean) && page === state.currentPage) {
                    renderCurrentPage({loadMorphology: false});
                }
            });

        return morphologyPageRequests[page];
    }

    async function goToPage(page) {
        if (isProcessingPage) return;
        const nextPage = Math.min(MAX_PAGE_INDEX, Math.max(0, Number(page) || 0));
        const token = ++pageNavigationToken;
        state.currentPage = nextPage;
        selectedWord = null;
        isProcessingPage = true;
        renderCurrentPage({loadMorphology: false});
        try {
            await saveState();
            await loadPageMorphology(nextPage);
        }
        finally {
            if (token === pageNavigationToken && state.currentPage === nextPage) {
                isProcessingPage = false;
                renderCurrentPage({loadMorphology: false});
            }
        }
    }

    async function loadWordDetails(location) {
        wordDetails.textContent = t("loadingWordDetails");
        const details = await fetchCorpusLocation(location);
        if (!selectedWord || selectedWord.corpusLocation !== location) return;
        wordDetails.textContent = details || t("noOnlineDetail");
    }

    async function resetProgress() {
        if (!window.confirm(t("confirmResetProgress"))) return;
        state.marks = {};
        selectedWord = null;
        await saveState();
        setStorageStatus(t("progressReset"));
        renderCurrentPage();
    }

    function exportProgress() {
        const known = Object.entries(state.marks)
            .filter((entry) => entry[1] === "known")
            .map((entry) => entry[0]);
        const learning = Object.entries(state.marks)
            .filter((entry) => entry[1] === "learning")
            .map((entry) => entry[0]);
        const payload = {
            exportedAt: new Date().toISOString(),
            currentPage: state.currentPage,
            known,
            learning
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "quran-word-progress.json";
        link.click();
        URL.revokeObjectURL(url);
    }

    function quoteCsvValue(value) {
        return `"${String(value || "").replace(/"/g, '""')}"`;
    }

    function exportLearningWords() {
        const allUniqueKeys = getUniqueKeys(allWords);
        const learning = allUniqueKeys
            .filter((key) => getStatus(key) === "learning")
            .sort((a, b) => a.localeCompare(b, "ar"));
        const rows = [
            [t("csvWord"), t("csvKey"), t("csvOccurrences"), t("csvExamples")],
            ...learning.map((key) => {
                const sample = allWords.find((word) => getWordKey(word) === key);
                return [
                    sample ? sample.display : key,
                    key,
                    countOccurrences(key),
                    getExamples(key)
                ];
            })
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(quoteCsvValue).join(",")).join("\n")}`;
        const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "quran-learning-words.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    quranPage.addEventListener("click", (event) => {
        if (isProcessingPage) return;
        const word = event.target.closest(".word-token");
        if (word && quranPage.contains(word)) {
            selectWordFromElement(word);
        }
    });

    markedWords.addEventListener("click", (event) => {
        if (isProcessingPage) return;
        const word = event.target.closest(".marked-word");
        if (!word) return;
        selectedWord = {
            key: word.getAttribute("data-key"),
            display: word.getAttribute("data-display"),
            location: ""
        };
        renderCurrentPage();
    });

    statusButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedWord) return;
            setStatus(selectedWord.key, button.dataset.status, {
                advanceToNextStudyWord: button.dataset.status === "known" || button.dataset.status === "learning"
            });
        });
    });

    pageSelect.addEventListener("change", () => {
        goToPage(pageSelect.value);
    });

    languageSelect.addEventListener("change", () => {
        state.language = translations[languageSelect.value] ? languageSelect.value : "en";
        applyLanguage();
        populatePageSelect();
        renderCurrentPage({loadMorphology: false});
        saveState();
    });

    skipLearningWords.addEventListener("change", () => {
        state.skipLearningWords = skipLearningWords.checked;
        saveState();
    });

    statusFilter.addEventListener("change", renderCurrentPage);
    resetAllBtn.addEventListener("click", resetProgress);
    exportBtn.addEventListener("click", exportProgress);
    exportLearningBtn.addEventListener("click", exportLearningWords);

    prevBtn.addEventListener("click", () => {
        goToPage(state.currentPage - 1);
    });

    nextBtn.addEventListener("click", () => {
        goToPage(state.currentPage + 1);
    });

    document.addEventListener("keydown", (event) => {
        if (isProcessingPage) return;
        if (event.target.matches("input, select, button")) return;
        if (event.key === "ArrowLeft" && state.currentPage < MAX_PAGE_INDEX) {
            goToPage(state.currentPage + 1);
        }
        if (event.key === "ArrowRight" && state.currentPage > 0) {
            goToPage(state.currentPage - 1);
        }
    });

    if (typeof quranRawData === "undefined") {
        quranPage.innerHTML = `<p class="empty-state">${escapeHtml(t("quranDataMissing"))}</p>`;
        return;
    }

    async function init() {
        await loadState();
        buildIndexes();
        await migrateAttachedPrefixMarks();
        applyLanguage();
        populatePageSelect();
        await goToPage(state.currentPage);
    }

    init();
}());
