document.addEventListener('DOMContentLoaded', () => {
  const juzSelect = document.getElementById('juzSelect');
  const surahSelect = document.getElementById('surahSelect');
  const pageSelect = document.getElementById('pageSelect');
  const display = document.getElementById('quran-display');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  const appTitle = document.getElementById('appTitle');

  // --- Settings ---
  const defaultSettings = {
    language: navigator.language ? navigator.language.substring(0, 2) : 'en',
    currentPage: 0, // Start from page 0
    fontFamily: "'Amiri', serif",
    fontSize: 36,
    tajweedMode: 'colors-abbr' // 'none', 'colors', 'colors-abbr'
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

  // Tajweed Display Mode Dropdown
  const tajweedSelect = document.createElement('select');
  tajweedSelect.id = 'tajweedMode';
  const tajweedModes = [
    { value: 'none', key: 'tajweedNone', default: 'No tajweed' },
    { value: 'colors', key: 'tajweedColors', default: 'Colors' },
    { value: 'colors-abbr', key: 'tajweedColorsAndAbbr', default: 'Colors and Abbrevations' }
  ];
  tajweedModes.forEach(mode => {
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
  decreaseFontBtn.onclick = () => {
    if (settings.fontSize > 30) {
      settings.fontSize *= 0.8;
      display.style.fontSize = settings.fontSize + 'px';
      saveSettings();
    }
  };

  increaseFontBtn.onclick = () => {
    if (settings.fontSize < 150) {
      settings.fontSize *= 1.2;
      display.style.fontSize = settings.fontSize + 'px';
      saveSettings();
    }
  };

  fontSelect.onchange = () => {
    settings.fontFamily = fontSelect.value;
    display.style.fontFamily = settings.fontFamily;
    saveSettings();
  };

  tajweedSelect.onchange = () => {
    settings.tajweedMode = tajweedSelect.value;
    loadMushafPage(settings.currentPage);
  };

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
    const swipeThreshold = 150; // Minimum distance for a swipe
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swiped left (RTL: Previous Page)
      if (settings.currentPage > 0) {
        loadMushafPage(settings.currentPage - 1);
      }
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      // Swiped right (RTL: Next Page)
      if (settings.currentPage < totalMushafPages - 1) {
        loadMushafPage(settings.currentPage + 1);
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
    populateSurahDropdown();
    updateUIText();
  }
  else {
    console.error("Error: quranRawData is not defined.");
    display.innerHTML = `<p style="text-align:center; color: red;">Error loading Quran data. Please ensure q.js is loaded and defines 'quranRawData'.</p>`;
  }

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

  function updateUIText() {
    // Apply loaded settings to UI
    display.style.fontFamily = settings.fontFamily;
    display.style.fontSize = settings.fontSize + 'px';
    display.classList.remove('show-abbreviations');
    if (settings.tajweedMode === 'colors-abbr') {
      display.classList.add('show-abbreviations');
    }

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

      const tajweedSelect = document.getElementById('tajweedMode');
      const tajweedModes = [
        { value: 'none', key: 'tajweedNone', default: 'No tajweed' },
        { value: 'colors', key: 'tajweedColors', default: 'Colors' },
        { value: 'colors-abbr', key: 'tajweedColorsAndAbbr', default: 'Colors and Abbrevations' }
      ];
      if (tajweedSelect) {
        for (let i = 0; i < tajweedSelect.options.length; i++) {
          const option = tajweedSelect.options[i];
          const mode = tajweedModes.find(m => m.value === option.value);
          if (mode) {
            option.textContent = t[mode.key] || mode.default;
          }
        }
      }
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
      document.documentElement.style.setProperty('--abbr-silat-ha', `"${t.abbrSilatHa || 'S'}"`);
      document.documentElement.style.setProperty('--abbr-madd-lazim', `"${t.abbrMaddLazim || 'Lz'}"`);
      document.documentElement.style.setProperty('--abbr-madd-asli', `"${t.abbrMaddAsli || 'MA'}"`);
      document.documentElement.style.setProperty('--abbr-qalqalah', `"${t.abbrQalqalah || 'Q'}"`);
      document.documentElement.style.setProperty('--abbr-iqlab', `"${t.abbrIqlab || 'Iq'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-ghunna', `"${t.abbrIdghamGhunna || 'IdG'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-bila', `"${t.abbrIdghamBila || 'IdB'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-mutakaribain', `"${t.abbrIdghamMutakaribain || 'IdM'}"`);
      document.documentElement.style.setProperty('--abbr-idgham-mithlain', `"${t.abbrIdghamMutakaribain || 'Idm'}"`);
      document.documentElement.style.setProperty('--abbr-ikhfa', `"${t.abbrIkhfa || 'Ik'}"`);
    }
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

  function loadMushafPage(pageIndex) {
    display.innerHTML = '';
    const pageNum = pageIndex + 1;
    const verses = quranByPage[pageNum] || [];

    const contentDiv = document.createElement('div');
    contentDiv.className = 'quran-content';
    let fullTextHTML = '';

    if (settings.tajweedMode === 'colors-abbr') {
      display.classList.add('show-abbreviations');
    } else {
      display.classList.remove('show-abbreviations');
    }

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
                    coloredBasmalah = applyTajweed(BASMALAH);
                 }
                 fullTextHTML += `<div class="basmalah" style="text-align: center; margin-bottom: 10px; width: 100%;">${coloredBasmalah}</div>`;
            }

            let processedText = text;
            if (settings.tajweedMode !== 'none') {
              processedText = applyTajweed(text);
            }
            
            let verseHtml = `${processedText} <span class="verse-number">${verse.i}</span> `;
            if (text.includes('۩')) {
                verseHtml = `<span class="sajdah-verse" style="background-color: #faf7e5;">${verseHtml}</span>`;
            }
            fullTextHTML += verseHtml;
        });
    } else {
        fullTextHTML = '<p style="text-align:center;">No verses found for this page.</p>';
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
    legend.innerHTML = `
        <h6 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.legendTitle}</h6>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: .9rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #16a085; margin-right: 5px;">■</span> <div>${t.ghunna}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #A64AC9; margin-right: 5px;">■</span> <div>${t.maddMuttasil}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #E91E63; margin-right: 5px;">■</span> <div>${t.maddMunfasil}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #1ABC9C; margin-right: 5px;">■</span> <div>${t.maddArid}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #F39C12; margin-right: 5px;">■</span> <div>${t.maddLiin}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #7ea24b; margin-right: 5px;">■</span> <div>${t.silatHa}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #e74c3c; margin-right: 5px;">■</span> <div>${t.maddAsli}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #2980b9; margin-right: 5px;">■</span> <div>${t.qalqalah}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #8e44ad; margin-right: 5px;">■</span> <div>${t.iqlab}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #00BFFF; margin-right: 5px;">■</span> <div>${t.idghamGhunna}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamBila}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamMutakaribain}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamMithlain}</div></li>
            <li style="display: flex; align-items: center"><span class="tajweed" style="font-size: 2rem; color: #d0a386; margin-right: 5px;">■</span> <div>${t.ikhfa}</div></li>
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
