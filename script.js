document.addEventListener('DOMContentLoaded', () => {
  const juzSelect = document.getElementById('juzSelect');
  const surahSelect = document.getElementById('surahSelect');
  const pageSelect = document.getElementById('pageSelect');
  const display = document.getElementById('quran-display');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');

  // --- Settings ---
  const defaultSettings = {
    language: navigator.language ? navigator.language.substring(0, 2) : 'en',
    currentPage: 0, // Start from page 0
    fontFamily: "'Amiri', serif",
    fontSize: 36,
    showAbbreviations: false
  };

  let settings = {...defaultSettings};

  function saveSettings() {
    localStorage.setItem('quranReaderSettings', JSON.stringify(settings));
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem('quranReaderSettings');
    if (savedSettings) {
      settings = {...settings, ...JSON.parse(savedSettings)};
    }
  }

  // --- Initialization ---
  loadSettings();
  // Use the translations object from tr.js if available, otherwise fallback or define here.
  // Assuming tr.js defines a global 'translations' object.
  let t = (typeof translations !== 'undefined' && translations[settings.language]) ? translations[settings.language] : (typeof translations !== 'undefined' ? translations.en : {});

  // Load fonts from Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lateef:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap';
  document.head.appendChild(fontLink);

  // --- UI Controls ---
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'settings-container';

  // Language Dropdown
  const langSelect = document.createElement('select');
  const languages = [
    {code: 'tr', name: '\u{1F1F9}\u{1F1F7} Türkçe'},
    {code: 'nl', name: '\u{1F1F3}\u{1F1F1} Nederlands'},
    {code: 'en', name: '\u{1F1EC}\u{1F1E7} English'}
  ];
  languages.forEach(lang => {
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
  const fonts = [
    {name: 'Amiri', value: "'Amiri', serif"},
    {name: 'Scheherazade', value: "'Scheherazade New', serif"},
    {name: 'Noto Naskh', value: "'Noto Naskh Arabic', serif"},
    {name: 'Lateef', value: "'Lateef', serif"}
  ];
  fonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.name;
    if (font.value === settings.fontFamily) option.selected = true;
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
  abbrCheckbox.checked = settings.showAbbreviations;

  const abbrLabel = document.createElement('label');
  abbrLabel.htmlFor = 'toggleAbbreviations';
  abbrLabel.id = 'abbrLabel';

  settingsContainer.appendChild(langSelect);
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

  // --- Event Listeners ---
  decreaseFontBtn.onclick = () => {
    if (settings.fontSize > 16) {
      settings.fontSize -= 2;
      display.style.fontSize = settings.fontSize + 'px';
      saveSettings();
    }
  };

  increaseFontBtn.onclick = () => {
    if (settings.fontSize < 60) {
      settings.fontSize += 2;
      display.style.fontSize = settings.fontSize + 'px';
      saveSettings();
    }
  };

  fontSelect.onchange = () => {
    settings.fontFamily = fontSelect.value;
    display.style.fontFamily = settings.fontFamily;
    saveSettings();
  };

  abbrCheckbox.addEventListener('change', (e) => {
    settings.showAbbreviations = e.target.checked;
    if (settings.showAbbreviations) {
      display.classList.add('show-abbreviations');
    }
    else {
      display.classList.remove('show-abbreviations');
    }
    saveSettings();
  });

  langSelect.onchange = () => {
    settings.language = langSelect.value;
    if (typeof translations !== 'undefined') {
      t = translations[settings.language];
    }
    saveSettings();
    updateUIText();
  };

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

  function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swiped left (RTL: Next Page)
      if (settings.currentPage < totalMushafPages - 1) {
        loadMushafPage(settings.currentPage + 1);
      }
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      // Swiped right (RTL: Previous Page)
      if (settings.currentPage > 0) {
        loadMushafPage(settings.currentPage - 1);
      }
    }
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      // Left arrow key (RTL: Next Page)
      if (settings.currentPage < totalMushafPages - 1) {
        loadMushafPage(settings.currentPage + 1);
      }
    }
    else if (event.key === 'ArrowRight') {
      // Right arrow key (RTL: Previous Page)
      if (settings.currentPage > 0) {
        loadMushafPage(settings.currentPage - 1);
      }
    }
  });

  // --- Quran Data & Logic ---
  let quranData = {};
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

  const totalMushafPages = 604;

  // Create legend element
  const legend = document.createElement('div');
  legend.id = 'tajweed-legend';
  display.insertAdjacentElement('afterend', legend);

  if (typeof quranRawData !== 'undefined') {
    parseJSON(quranRawData);
    populateSurahDropdown();
    updateUIText();
  }
  else {
    console.error("Error: quranRawData is not defined.");
    display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
  }

  function updateUIText() {
    // Apply loaded settings to UI
    display.style.fontFamily = settings.fontFamily;
    display.style.fontSize = settings.fontSize + 'px';
    if (settings.showAbbreviations) {
      display.classList.add('show-abbreviations');
    }
    else {
      display.classList.remove('show-abbreviations');
    }

    // Update translatable text
    if (t) {
      decreaseFontBtn.title = t.decreaseFont;
      increaseFontBtn.title = t.increaseFont;
      abbrLabel.textContent = t.rulesLabel;
      prevBtn.textContent = t.nextPage;
      nextBtn.textContent = t.prevPage;
    }

    populateSurahDropdown();
    populateJuzDropdown();
    populatePageDropdown();

    updateLegend();
    loadMushafPage(settings.currentPage);

    // Update CSS variables for abbreviations
    if (t) {
      document.documentElement.style.setProperty('--abbr-ghunna', `"${t.abbrGhunna || 'Gh'}"`);
      document.documentElement.style.setProperty('--abbr-madd-muttasil', `"${t.abbrMaddMuttasil || 'MM'}"`);
      document.documentElement.style.setProperty('--abbr-madd-munfasil', `"${t.abbrMaddMunfasil || 'Mn'}"`);
      document.documentElement.style.setProperty('--abbr-madd-arid', `"${t.abbrMaddArid || 'A'}"`);
      document.documentElement.style.setProperty('--abbr-madd-liin', `"${t.abbrMaddLiin || 'ML'}"`);
      document.documentElement.style.setProperty('--abbr-madd-silah', `"${t.abbrMaddSilah || 'MS'}"`);
      document.documentElement.style.setProperty('--abbr-madd-lazim', `"${t.abbrMaddLazim || 'Lz'}"`);
      document.documentElement.style.setProperty('--abbr-madd-asli', `"${t.abbrMaddAsli || 'MA'}"`);
      document.documentElement.style.setProperty('--abbr-qalqalah', `"${t.abbrQalqalah || 'Q'}"`);
      document.documentElement.style.setProperty('--abbr-iqlab', `"${t.abbrIqlab || 'Iq'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-ghunna', `"${t.abbrIdghamGhunna || 'IdG'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-bila', `"${t.abbrIdghamBila || 'IdB'}"`);
      document.documentElement.style.setProperty('--abbr-ikhfa', `"${t.abbrIkhfa || 'Ik'}"`);
    }
  }

  function parseJSON(data) {
    if (!data || !data.q) {
      return;
    }

    data.q.forEach(verse => {
      const surah = verse['`sura`'] || verse['sura'];
      const aya = verse['`aya`'] || verse['aya'];
      const text = verse['`text`'] || verse['text'];

      if (surah) {
        if (!quranData[surah]) {
          quranData[surah] = {};
        }
        quranData[surah][aya] = {aya: parseInt(aya), text: text};
      }
    });
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

  function loadMushafPage(page) {
    display.innerHTML = '';

    if (typeof pages === 'undefined') {
      display.innerHTML = '<p style="text-align:center; color: red;">Error: Page data not loaded. Ensure page-data.js is included.</p>';
      return;
    }

    const pageIndex = page;

    if (pageIndex < 0 || pageIndex >= pages.length) {
      display.innerHTML = '<p style="text-align:center;">Page not found.</p>';
      return;
    }

    const pageVersesRanges = pages[pageIndex];
    const startSurah = pageVersesRanges.surah_begin;
    const startAya = pageVersesRanges.ayah_begin;
    const endSurah = pageVersesRanges.surah_end;
    const endAya = pageVersesRanges.ayah_end;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'quran-content';
    let fullTextHTML = '';

    for (let s = startSurah; s <= endSurah; s++) {
      if (!quranData[s]) continue;

      const ayahsInSurah = Object.keys(quranData[s]).map(Number);
      const maxAyaInSurah = Math.max(...ayahsInSurah);

      let currentSurahStartAya = (s === startSurah) ? startAya : 1;
      let currentSurahEndAya = (s === endSurah) ? endAya : maxAyaInSurah;

      if (currentSurahStartAya === 1 && s !== 9) {
        const surahName = (t && t.surahNames && t.surahNames[s]) ? t.surahNames[s] : defaultSurahNames[s];
        fullTextHTML += `<div class="surah-header">(${s}) ${surahName}</div>`;
      }

      for (let a = currentSurahStartAya; a <= currentSurahEndAya; a++) {
        const verse = quranData[s][a];
        if (verse) {
          let text = verse.text;
          const BASMALAH = "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ";
          if (a === 1 && text.startsWith(BASMALAH)) {
            const coloredBasmalah = applyTajweed(BASMALAH);
            fullTextHTML += `<div class="basmalah" style="text-align: center; margin-bottom: 10px; width: 100%;">${coloredBasmalah}</div>`;
            text = text.substring(BASMALAH.length).trim();
          }

          //text = applyTajweed(text);
          //fullTextHTML += `${text} <span class="verse-number">${verse.aya}</span> `;
          const processedText = applyTajweed(text);
          fullTextHTML += `${processedText} <span class="verse-number">${verse.aya}</span> `;
        }
      }
    }

    if (!fullTextHTML) {
      fullTextHTML = '<p style="text-align:center;">No verses found for this page.</p>';
    }

    contentDiv.innerHTML = fullTextHTML;
    display.appendChild(contentDiv);

    settings.currentPage = page;
    const juz = getJuzNumber(settings.currentPage);
    pageInfo.textContent = `${t ? t.page : 'Page'} ${settings.currentPage} | ${t ? t.juz : 'Juz'} ${juz}`;
    nextBtn.disabled = settings.currentPage === 0;
    prevBtn.disabled = settings.currentPage === totalMushafPages - 1;

    surahSelect.value = startSurah;
    juzSelect.value = juz;
    pageSelect.value = settings.currentPage;
    saveSettings();
  }

  function applyTajweed(text) {
    //const ignoreVowels = (str) => str.split('').join('[\\u064B-\\u065F]*');
    let fixedText = vowelizeStartingAlif(text)
        // --- 1. Dagger Alif Fixes (Alif Khanjariyah) ---
        .replace(/اللَّه/g, "اللّٰه")
        .replace(/لِلَّه/g, "لِلّٰه")
        .replace(/إِسْمَاعِيل/g, "إِسْمٰعِيْل")
        .replace(/إِسْحَاق/g, "إِسْحٰق")
        .replace(/السَّمَاوَات/g, "السَّمٰوٰت")

        // --- 2. Madd Lazim Fixes (6 Counts) ---
        // Rule: Madd Letter + Shaddah
        .replace(/الضَّالِّين/g, "الضَّآلِّين")  // Al-Fatiha
        .replace(/الْحَاقَّة/g, "الْحَآقَّة")    // Al-Haqqah
        .replace(/الطَّامَّة/g, "الطَّآمَّة")    // At-Nazi'at
        .replace(/الصَّاخَّة/g, "الصَّآخَّة")    // Abasa
        .replace(/تَأْمُرُونِّي/g, "تَأْمُرُوٓنِّي") // Az-Zumar
        .replace(/دَابَّة/g, "دَآبَّة")         // Various

        // hide idgam shaddah
        .replace(/(\s[\u0600-\u06FF])\u0651/g, "$1")
    ;

    // Adds Sukun to Noon, Miim, and now Ta if followed by certain letters
    fixedText = fixedText.replace(/([نمت])(?![^<]*>)(?=\s*[بتحخدذرزسشصضطظعغفقكلمهوي])/g, "$1ْ");

    fixedText = applyMaddHarfi(fixedText)

    fixedText = applyGhunnahAndMiimRules(fixedText);

    fixedText = applyIdghamRules(fixedText)

    fixedText = applyNasalRules(fixedText)

    fixedText = applyQalqalah(fixedText)

    fixedText = applyGenericMadd(fixedText);

    // Adds Sukun to Noon, Miim, and now Ta if followed by certain letters
    fixedText = fixedText.replace(/([نمت])(?![^<]*>)(?=\s*[بتحخدذرزسشصضطظعغفقكلمهوي])/g, "$1ْ");

    fixedText = colorizeWaqf(fixedText)

    return fixedText;
  }

  function vowelizeStartingAlif(word) {
    // 1. Rule for "Al-" (Definite Article): Always Fatha
    if (word.startsWith("ال")) {
      return word.replace(/^ا/, "ا\u064E");
    }

    // 2. Rule for Verbs (check the 3rd letter's vowel)
    // We strip the first two letters to find the 3rd letter's diacritic
    const thirdLetterVowel = word.match(/^..[\u064E\u064F\u0650]/);

    if (thirdLetterVowel) {
      const vowel = thirdLetterVowel[0].slice(-1);

      // If the 3rd letter has Dammah -> Start with Dammah
      if (vowel === "\u064F") {
        return word.replace(/^ا/, "ا\u064F");
      }
      // If the 3rd letter has Fatha or Kasra -> Start with Kasra
      else {
        return word.replace(/^ا/, "ا\u0650");
      }
    }

    // Default to Kasra (most common for verbs like Ihdina)
    return word.replace(/^ا/, "ا\u0650");
  }

  function colorizeWaqf(text) {
    const waqfRules = [
      {char: '\u06D6', className: 'waqf-awla'},     // ۗ (Better to stop)
      {char: '\u06D7', className: 'waqf-continue'}, // ۖ (Better to continue)
      {char: '\u06D8', className: 'waqf-lazim'},    // ۘ (Mandatory stop)
      {char: '\u06D9', className: 'waqf-lazim'},    // ۙ (Mandatory stop - alternate)
      {char: '\u06DA', className: 'waqf-jaiz'},     // ۚ (Permissible stop)
      {char: '\u06DB', className: 'waqf-continue'}, // ۛ (Stop at one, not both)
      {char: '\u06DC', className: 'waqf-continue'}  // ۜ (Small Seen - usually stop/pause)
    ];

    waqfRules.forEach(rule => {
      const regex = new RegExp(`(${rule.char})`, 'g');
      text = text.replace(regex, `<span class="waqf-sign ${rule.className}">$1</span>`);
    });

    return text;
  }

  function applyIdghamRules(text) {
    const ghunnahLetters = '\u064A\u0646\u0645\u0648';
    const bilaGhunnahLetters = '\u0644\u0631';

    // This regex now allows for:
    // 1. Noon or Tanween (ً ٌ ٍ)
    // 2. Any "hidden" characters (\u200B-\u200D), carrier letters (ا ى), or spaces
    // 3. The target Yarmaloon letter
    const idghamGhunnah = new RegExp(`([\u064B\u064C\u064D]|\\u0646[\\u0652\\u06DF\\u06E0]?)([\\u0621-\\u064A\\s\\u200B-\\u200D]*)([${ghunnahLetters}])`, 'g');
    const idghamBila = new RegExp(`([\u064B\u064C\u064D]|\\u0646[\\u0652\\u06DF\\u06E0]?)([\\u0621-\\u064A\\s\\u200B-\\u200D]*)([${bilaGhunnahLetters}])`, 'g');

    return text
      .replace(idghamGhunnah, '<span class="tajweed-idgham-bi-ghunna">$1</span>$2$3')
      .replace(idghamBila, '<span class="tajweed-idgham-bila-ghunna">$1</span>$2$3');
  }

  function applyMaddHarfi(text) {
    // Specifically for ALM: catches any letter followed by the Maddah wave (\u0653)
    // or the "Small High Upright Rectangular Zero" (\u06E0) often used as a marker
    const harfiRegex = /([\u0621-\u064A][\u064B-\u065F\u06DF\u06E0]*\u0653)/g;
    return text.replace(harfiRegex, '<span class="tajweed-madd-lazim">$1</span>');
  }

  function applyGenericMadd(text) {
    const notInSpan = '(?![^<]*>|[^>]*<\/span>)';

    // 1. PROTECT THE NAME OF ALLAH
    // Labels the superscript Alif in Allah as MA and prevents "S/MT".
    text = text.replace(/(\u0644\u0651\u0670)/g, '<span class="tajweed-madd-asli" data-label="MA">$1</span>');

    // 2. MADD 'ARID (A)
    // High priority for verse endings.
    const aridRegex = /([\u064E\u0670]\u0627|[\u064F\u0657]\u0648|[\u0650\u0656]\u064A)(?=(?:\u0651)?[\u0621-\u064A](?:\u0651|[\u064B-\u065F]|\s)*$)/g;
    text = text.replace(aridRegex, '<span class="tajweed-madd-arid" data-label="A">$1</span>');

    // 3. MADD SILAH (MS/S)
    // Excludes Ha if preceded by Lam (prevents "S" on Allah).
    const silahLogic = /([\u0621-\u0643\u0645-\u064A][\u064B-\u065F]*)([\u0647][\u064F\u0650])(?=\s+[\u0621-\u064A])/g;
    text = text.replace(silahLogic, '$1<span class="tajweed-madd-silah" data-label="MS">$2</span>');

    // 4. SUPERSCRIPT ALIF / DAGGER ALIF (Fix for ذَٰلِكَ)
    // Specifically captures \u0670 and labels as MA.
    text = text.replace(new RegExp(`([\\u0621-\\u064A]\\u0651?\\u0670)${notInSpan}`, 'g'),
      '<span class="tajweed-madd-asli" data-label="MA">$1</span>');

    // 5. MADD ASLI (MA) FOR YA (Fix for الضَّالِّينَ)
    // Handles Shaddah + Kasra + Ya pattern.
    text = text.replace(new RegExp(`([\\u0621-\\u064A]\\u0651?\\u0650\\u064A)${notInSpan}(?![\\u064B-\\u0652])`, 'g'),
      '<span class="tajweed-madd-asli" data-label="MA">$1</span>');

    // 6. SPECIFIC MADDS (Munfasil MM / Muttasil MT)
    const maddMunfasil = /([\u064E]\u0627)(?=[\s\u200B-\u200D]+[\u0622\u0623\u0625\u0621])/g;
    const maddMuttasil = /([\u064E]\u0627)(?=[\u0622\u0623\u0625\u0621\u0626])/g;
    text = text.replace(maddMunfasil, '<span class="tajweed-madd-munfasil" data-label="MM">$1\u0653</span>')
      .replace(maddMuttasil, '<span class="tajweed-madd-muttasil" data-label="MT">$1\u0653</span>');

    // 7. GENERAL MADD ASLI (MA) - THE FIX FOR وَادْخُلُوا
    // Updated regex to ignore Alif if it follows a Waw (\u0648)
    // This prevents the silent Alif at the end of plural verbs from being labeled MA.
    const maddAlifRegex = new RegExp(`([\\u0621-\\u0647\\u0649-\\u064A]\\u0651?\\u064E|</span>\\u064E)\\u0627${notInSpan}(?![\\u064B-\\u0652]|\\u0644\\u0644|[\\u0621-\\u064A]\\u0651)`, 'g');
    text = text.replace(maddAlifRegex, '$1<span class="tajweed-madd-asli" data-label="MA">\u0627</span>');

    // Madd Waw (Damma + Waw)
    text = text.replace(new RegExp(`([\\u0621-\\u064A]\\u0651?\\u064F\\u0648)${notInSpan}(?![\\u064B-\\u0652])`, 'g'),
      '<span class="tajweed-madd-asli" data-label="MA">$1</span>');

    return text;
  }

  function applyGhunnahAndMiimRules(text) {
    const invisibleChars = '[\\s\\u200B-\\u200D]';
    const notInSpan = '(?![^<]*>|[^>]*<\/span>)';

    // 1. Ikhfa Shafawi (IS) - Miim followed by Ba
    // The [\u0652]? makes the Sukun optional to catch "naked" Miims
    const ikhfaShafawi = new RegExp(`\\u0645[\\u0652]?${invisibleChars}+\\u0628`, 'g');
    text = text.replace(ikhfaShafawi, '<span class="tajweed-ghunna-ikhfa-shafawi" data-label="IS">م</span>');

    // 2. Idgham Mithlayn (IM) - Miim followed by Miim
    const idghamMithlayn = new RegExp(`\\u0645[\\u0652]?${invisibleChars}+\\u0645`, 'g');
    text = text.replace(idghamMithlayn, '<span class="tajweed-ghunna-idgam-mithlayn" data-label="IM">م</span>');

    // 3. General Ghunnah (Gh) - Noon or Miim with Shaddah
    const generalGhunnah = new RegExp(`([\\u0646\\u0645]\\u0651)${notInSpan}`, 'g');
    text = text.replace(generalGhunnah, '<span class="tajweed-ghunna" data-label="Gh">$1</span>');

    return text;
  }

  function applyNasalRules(text) {
    const notInSpan = '(?![^<]*>|[^>]*<\/span>)';

    // The 15 Ikhfa Letters: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك
    const ikhfaLetters = '\\u062A\\u062B\\u062C\\u062D\\u062F\\u0630\\u0631\\u0632\\u0633\\u0634\\u0635\\u0636\\u0637\\u0638\\u0641\\u0642\\u0643';

    const ikhfaRegex = new RegExp(`([\\u064B\\u064C\\u064D]|\\u0646[\\u0652]?)([\\s\\u200B-\\u200D]*)([${ikhfaLetters}])${notInSpan}`, 'g');

    // Iqlab (already handled)
    const iqlabRegex = new RegExp(`([\\u064B\\u064C\\u064D]|\\u0646[\\u0652]?)([\\s\\u200B-\\u200D]*)(\\u0628)${notInSpan}`, 'g');

    return text
      .replace(iqlabRegex, '<span class="tajweed-iqlab" data-label="Iq">$1</span>$2$3')
      .replace(ikhfaRegex, '<span class="tajweed-ikhfa" data-label="Ik">$1</span>$2$3');
  }

  function applyQalqalah(text) {
    // Letters: ق ط ب ج د
    const qalqalahLetters = '\u0642\u0637\u0628\u062C\u062F';

    // Matches any of these letters followed by a Sukun
    const qalqalahRegex = new RegExp(`([${qalqalahLetters}]\\u0652)`, 'g');

    // We use blue for Qalqalah (matching your existing CSS class)
    return text.replace(qalqalahRegex, '<span class="tajweed-qalqalah">$1</span>');
  }

  function findFirstPageOfSurah(surahId) {
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      if (pageData.surah_begin === surahId) {
        return i;
      }
    }
    return 0;
  }

  function updateLegend() {
    if (!t) return;
    legend.innerHTML = `
        <h6 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.legendTitle}</h6>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: .9rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #16a085; margin-right: 5px;">■</span> <div>${t.ghunna}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #A64AC9; margin-right: 5px;">■</span> <div>${t.maddMuttasil}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #E91E63; margin-right: 5px;">■</span> <div>${t.maddMunfasil}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #1ABC9C; margin-right: 5px;">■</span> <div>${t.maddArid}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #F39C12; margin-right: 5px;">■</span> <div>${t.maddLiin}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #9932CC; margin-right: 5px;">■</span> <div>${t.maddSilah}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #e74c3c; margin-right: 5px;">■</span> <div>${t.maddAsli}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #2980b9; margin-right: 5px;">■</span> <div>${t.qalqalah}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #8e44ad; margin-right: 5px;">■</span> <div>${t.iqlab}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #00BFFF; margin-right: 5px;">■</span> <div>${t.idghamGhunna}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamBila}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #d35400; margin-right: 5px;">■</span> <div>${t.ikhfa}</div></li>
        </ul>
        <h6 style="margin-top: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.pauseMarksTitle}</h6>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: .8rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; "><span style="color: #D9534F; margin-right: 5px;">۩</span> <div>${t.sajdah}</div></li>
            <li style="display: flex; "><span style="color: #D9534F; margin-right: 5px;">ج</span> <div>${t.jaiz}</div></li>
            <li style="display: flex; "><span style="color: #27ae60; margin-right: 5px;">صلى</span> <div>${t.waslAwla}</div></li>
            <li style="display: flex; "><span style="color: #D9534F; margin-right: 5px;">قلى</span> <div>${t.waqfAwla}</div></li>
            <li style="display: flex; "><span style="color: #D9534F; margin-right: 5px;">∴</span> <div>${t.muanaqah}</div></li>
        </ul>
    `;
  }

  juzSelect.addEventListener('change', (e) => {
    const selectedJuz = parseInt(e.target.value);
    const page = (selectedJuz === 1) ? 0 : (selectedJuz - 1) * 20 + 1;
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
    if (settings.currentPage < totalMushafPages - 1) {
      loadMushafPage(settings.currentPage + 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (settings.currentPage > 0) {
      loadMushafPage(settings.currentPage - 1);
    }
  });
});
