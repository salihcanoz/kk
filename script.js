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
    currentPage: 1, // Start from page 1
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
    } else {
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
      if (settings.currentPage < totalMushafPages) {
        loadMushafPage(settings.currentPage + 1);
      }
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      // Swiped right (RTL: Previous Page)
      if (settings.currentPage > 1) {
        loadMushafPage(settings.currentPage - 1);
      }
    }
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      // Left arrow key (RTL: Next Page)
      if (settings.currentPage < totalMushafPages) {
        loadMushafPage(settings.currentPage + 1);
      }
    } else if (event.key === 'ArrowRight') {
      // Right arrow key (RTL: Previous Page)
      if (settings.currentPage > 1) {
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
  legend.style.marginTop = '20px';
  legend.style.padding = '15px';
  legend.style.border = '1px solid #ddd';
  legend.style.borderRadius = '8px';
  legend.style.backgroundColor = '#f9f9f9';
  display.insertAdjacentElement('afterend', legend);

  if (typeof quranRawData !== 'undefined') {
    parseJSON(quranRawData);
    populateSurahDropdown();
    updateUIText();
  } else {
    console.error("Error: quranRawData is not defined.");
    display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
  }

  function updateUIText() {
    // Apply loaded settings to UI
    display.style.fontFamily = settings.fontFamily;
    display.style.fontSize = settings.fontSize + 'px';
    if (settings.showAbbreviations) {
      display.classList.add('show-abbreviations');
    } else {
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
    if (!data || !data.q) return;
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
    if (currentSurah) surahSelect.value = currentSurah;
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
    for (let i = 1; i <= totalMushafPages; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${t ? t.page : 'Page'} ${i}`;
      pageSelect.appendChild(option);
    }
    pageSelect.value = currentPage;
  }

  function getJuzNumber(page) {
    if (page <= 21) return 1;
    if (page > 601) return 30;
    return Math.floor((page - 2) / 20) + 1;
  }

  function loadMushafPage(page) {
    display.innerHTML = '';

    if (typeof pages === 'undefined') {
      display.innerHTML = '<p style="text-align:center; color: red;">Error: Page data not loaded. Ensure page-data.js is included.</p>';
      return;
    }

    const pageIndex = page - 1;

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
          } else {
            text = applyTajweed(text);
          }

          fullTextHTML += `${text} <span class="verse-number">${verse.aya}</span> `;
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
    nextBtn.disabled = settings.currentPage === 1;
    prevBtn.disabled = settings.currentPage === totalMushafPages;

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

      // show sukuun
      .replace(/ن(?=[بتحخدذرزسشصضطظعغفقكلمهوي])/g, "نْ")
      // hide idgam shaddah
      .replace(/(\s[\u0600-\u06FF])\u0651/g, "$1")

    fixedText = applyGenericMadd(fixedText);

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

      // If 3rd letter has Dammah -> Start with Dammah
      if (vowel === "\u064F") {
        return word.replace(/^ا/, "ا\u064F");
      }
      // If 3rd letter has Fatha or Kasra -> Start with Kasra
      else {
        return word.replace(/^ا/, "ا\u0650");
      }
    }

    // Default to Kasra (most common for verbs like Ihdina)
    return word.replace(/^ا/, "ا\u0650");
  }

  function applyGenericMadd(text) {
    // 1. Madd Lazim (6 counts) - e.g., the Alif in Ad-Dallin
    const maddLazim = /((?:\u0622|[\u0627\u0648\u064A]\u0653)[\u064B-\u065F]*[\u0600-\u06FF][\u064B-\u065F]*\u0651)/g;

    // 2. Madd Muttasil & Munfasil (4-5 counts)
    const maddMuttasil = /([\u0627\u0648\u064A]\u0653[ءأإ])/g;
    const maddMunfasil = /([\u0627\u0648\u064A]\u0653(?=\s[ءأإ]))/g;

    // 3. Madd Arid (2, 4, 6 counts) - Peninsula letter before verse end
    // Checks for Verse Span OR the end of the text line
    const maddArid = /([\u0627\u0648\u064A])(?=[\u0600-\u06FF](?:\u0651|[\u064B-\u065F]|\s)*(?:<span class="verse-number">|$))/g;

    // Apply specific long madds first to protect them from being overwritten
    text = text
      .replace(maddLazim, '<span class="tajweed-madd-lazim">$1</span>')
      .replace(maddMuttasil, '<span class="tajweed-madd-muttasil">$1</span>')
      .replace(maddMunfasil, '<span class="tajweed-madd-munfasil">$1</span>')
      .replace(maddArid, '<span class="tajweed-madd-arid">$1</span>');

    // 4. Madd Asli (Natural 2-count) - Green
    // Using clean hex: \u064E (Fatha), \u064F (Damma), \u0650 (Kasra)
    text = text
      .replace(/\u064E\u0627/g, '\u064E<span class="tajweed-madd-asli">\u0627</span>')
      .replace(/\u064F\u0648/g, '\u064F<span class="tajweed-madd-asli">\u0648</span>')
      .replace(/\u0650\u064A/g, '\u0650<span class="tajweed-madd-asli">\u064A</span>')
      .replace(/(\u0670)/g, '<span class="tajweed-madd-asli">$1</span>');

    return text;
  }

  function findFirstPageOfSurah(surahId) {
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      if (pageData.surah_begin === surahId) {
        return pageData.page;
      }
    }
    return 1;
  }

  function updateLegend() {
    if (!t) return;
    const maddMuttasilText = (t.maddMuttasil) ? t.maddMuttasil : 'Madd Muttasil (Connected)';
    const maddMunfasilText = (t.maddMunfasil) ? t.maddMunfasil : 'Madd Munfasil (Separated)';
    const maddAridText = (t.maddArid) ? t.maddArid : "Madd 'Arid (Temporary)";
    legend.innerHTML = `
        <h6 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.legendTitle}</h6>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FF70A6; margin-right: 5px;">■</span> <div>${t.ghunna}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #A64AC9; margin-right: 5px;">■</span> <div>${maddMuttasilText}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #E91E63; margin-right: 5px;">■</span> <div>${maddMunfasilText}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #1ABC9C; margin-right: 5px;">■</span> <div>${maddAridText}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #F39C12; margin-right: 5px;">■</span> <div>${t.maddLiin}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #9932CC; margin-right: 5px;">■</span> <div>${t.maddSilah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #7F00FF; margin-right: 5px;">■</span> <div>${t.maddAsli}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #4682B4; margin-right: 5px;">■</span> <div>${t.qalqalah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FFA500; margin-right: 5px;">■</span> <div>${t.iqlab}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #00BFFF; margin-right: 5px;">■</span> <div>${t.idghamGhunna}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamBila}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #20B2AA; margin-right: 5px;">■</span> <div>${t.ikhfa}</div></li>

        </ul>
        <h6 style="margin-top: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.pauseMarksTitle}</h6>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">۩</span> <div>${t.sajdah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">ج</span> <div>${t.jaiz}</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #27ae60; font-weight: bold; margin-right: 5px;">صلى</span> <div>${t.waslAwla}</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">قلى</span> <div>${t.waqfAwla}</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">∴</span> <div>${t.muanaqah}</div></li>
        </ul>
    `;
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
    if (settings.currentPage < totalMushafPages) {
      loadMushafPage(settings.currentPage + 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (settings.currentPage > 1) {
      loadMushafPage(settings.currentPage - 1);
    }
  });
});
