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
    currentPage: 1,
    fontFamily: "'Scheherazade New', serif",
    fontSize: 28,
    showAbbreviations: false
  };

  let settings = { ...defaultSettings };

  function saveSettings() {
    localStorage.setItem('quranReaderSettings', JSON.stringify(settings));
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem('quranReaderSettings');
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  }

  // --- Initialization ---
  loadSettings();
  // Use the translations object from tr.js if available, otherwise fallback or define here.
  // Assuming tr.js defines a global 'translations' object.
  let t = (typeof translations !== 'undefined' && translations[settings.language]) ? translations[settings.language] : (typeof translations !== 'undefined' ? translations.en : {});
  console.log('Current language:', settings.language);

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
    { code: 'tr', name: '\u{1F1F9}\u{1F1F7} Türkçe' },
    { code: 'nl', name: '\u{1F1F3}\u{1F1F1} Nederlands' },
    { code: 'en', name: '\u{1F1EC}\u{1F1E7} English' }
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
    { name: 'Scheherazade', value: "'Scheherazade New', serif" },
    { name: 'Amiri', value: "'Amiri', serif" },
    { name: 'Noto Naskh', value: "'Noto Naskh Arabic', serif" },
    { name: 'Lateef', value: "'Lateef', serif" }
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
        prevBtn.textContent = t.prevPage;
        nextBtn.textContent = t.nextPage;
    }

    populateSurahDropdown();
    populateJuzDropdown();
    populatePageDropdown();

    updateLegend();
    loadMushafPage(settings.currentPage);

    // Update CSS variables for abbreviations
    if (t) {
        document.documentElement.style.setProperty('--abbr-ghunna', `"${t.abbrGhunna || 'Gh'}"`);
        document.documentElement.style.setProperty('--abbr-madd', `"${t.abbrMadd || 'M'}"`);
        document.documentElement.style.setProperty('--abbr-madd-liin', `"${t.abbrMaddLiin || 'ML'}"`);
        document.documentElement.style.setProperty('--abbr-madd-silah', `"${t.abbrMaddSilah || 'MS'}"`);
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
        quranData[surah][aya] = { aya: parseInt(aya), text: text };
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

  function applyTajweed(text) {
    let html = text;

    // --- Waqf & Sajdah Signs (Turkish Style) ---
    html = html.replace(/(۩)/g, `<span class="sajdah-sign" title="${t ? t.sajdahTitle : 'Sajdah'}">$1</span>`);
    html = html.replace(/(ۘ)/g, `<span class="waqf-sign waqf-lazim" title="${t ? t.waqfLazim : 'Lazim'}">م</span>`);
    html = html.replace(/(ۚ)/g, `<span class="waqf-sign waqf-jaiz" title="${t ? t.waqfJaiz : 'Jaiz'}">ج</span>`);
    html = html.replace(/(ۖ)/g, `<span class="waqf-sign waqf-continue" title="${t ? t.alWaslAwla : 'Continue'}">صلى</span>`);
    html = html.replace(/(ۗ)/g, `<span class="waqf-sign waqf-awla" title="${t ? t.waqfAwlaTitle : 'Stop'}">قلى</span>`);
    html = html.replace(/(ۛ)/g, `<span class="waqf-sign waqf-muanaqah" title="${t ? t.muanaqahTitle : 'Muanaqah'}">∴</span>`);

    // --- Madd Rules (Long - 4/5 counts) ---
    html = html.replace(/(?<=َ)(ا)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');
    html = html.replace(/(?<=ُ)(و)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');
    html = html.replace(/(?<=ِ)(ي)(?=[ءئؤأإآ])/g, '<span class="tajweed-madd">$1</span>');

    html = html.replace(/(?<=َ)([اى])(\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2');
    html = html.replace(/(?<=ُ)(و)(ا?\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2');
    html = html.replace(/(?<=ِ)(ي)(\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>$2');

    html = html.replace(/(?<=َ)([وي]ْ)/g, '<span class="tajweed-madd-liin">$1</span>');

    html = html.replace(/(فِيهِ)(\s+مُهَانًا)/g, '<span class="tajweed-madd-silah">$1</span>$2');
    html = html.replace(/(?<=[\u064E\u064F\u0650])(ه[\u064F\u0650])(?=\s+[أإآء])/g, '<span class="tajweed-madd">$1</span>');
    html = html.replace(/(?<=[\u064E\u064F\u0650])(ه[\u064F\u0650])(?=\s+[^\u0627\u0671\u0652أإآء])/g, '<span class="tajweed-madd-silah">$1</span>');

    html = html.replace(/(?<=َ)ا/g, '<span class="tajweed-madd-asli">ا</span>');
    html = html.replace(/(?<=ُ)و/g, '<span class="tajweed-madd-asli">و</span>');
    html = html.replace(/(?<=ِ)ي/g, '<span class="tajweed-madd-asli">ي</span>');

    html = html.replace(/([ٰ~])/g, '<span class="tajweed-madd">$1</span>');
    html = html.replace(/([قطبجد]ْ)/g, '<span class="tajweed-qalqalah">$1</span>');
    html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*ب)/g, '<span class="tajweed-iqlab">$1</span>');
    html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*[ينمو])(ّ)?/g, '<span class="tajweed-idgham-bi-ghunna">$1</span>');
    html = html.replace(/([نًٌٍ]ْ?(?:[اى])?\s*[لر])(ّ)?/g, '<span class="tajweed-idgham-bila-ghunna">$1</span>');
    html = html.replace(/([نًٌٍ]ْ?(?:[اى])?)(\s*[تثجدذزسشصضطظفقك])/g, '<span class="tajweed-ikhfa">$1</span>$2');
    html = html.replace(/([نم]ّ)/g, '<span class="tajweed-ghunna">$1</span>');
    return html;
  }

  function fixDiacritics(text) {
    let fixedText = text;
    fixedText = fixedText.replace(/^([^\s])ّ/, '$1');
    fixedText = fixedText.replace(/اللَّه/g, 'اللّٰه');
    fixedText = fixedText.replace(/لِلَّهِ/g, 'لِلّٰهِ');
    fixedText = fixedText.replace(/^ال/, 'اَل');

    const waslReplacements = {
      'اهْدِنَا': 'اِهْدِنَا', 'اسْتَغْفِرْ': 'اِسْتَغْفِرْ', 'اضْرِب': 'اِضْرِب',
      'اقْرَأْ': 'اِقْرَأْ', 'ارْجِعُوا': 'اِرْجِعُوا', 'اكْشِفْ': 'اِكْشِفْ',
      'اسْم': 'اِسْم', 'ابْن': 'اِبْن', 'ابْنَة': 'اِبْنَة',
      'امْرَأَة': 'اِمْرَأَة', 'اثْنَيْنِ': 'اِثْنَيْنِ', 'اثْنَتَيْنِ': 'اِثْنَتَيْنِ',
      'اسْتَكْبَرَ': 'اِسْتَكْبَرَ', 'اسْتَطَاعُوا': 'اِسْتَطَاعُوا', 'اسْتَجَابُوا': 'اِسْتَجَابُوا',
      'اطْمَأَنَّ': 'اِطْمَأَنَّ', 'اهْبِطُوا': 'اِهْبِطُوا', 'اتَّقُوا': 'اِتَّقُوا',
      'اصْبِرُوا': 'اِصْبِرُوا', 'اسْتَعِينُوا': 'اِسْتَعِينُوا', 'انطَلَقُوا': 'اِنطَلَقُوا',
      'انتَصِرْ': 'اِنتَصِرْ', 'اتَّبِعْ': 'اِتَّبِعْ', 'افْتَرَاهُ': 'اِفْتَرَاهُ',
      'ادْخُلُوا': 'اُدْخُلُوا', 'اخْرُجُوا': 'اُخْرُجُوا', 'انظُرُوا': 'اُنظُرُوا',
      'انظُرْ': 'اُنظُرْ', 'انْظُرْ': 'اُنْظُرْ',
      'ارْكُضْ': 'اُرْكُضْ', 'ادْعُ': 'اُدْعُ', 'اعْبُدُوا': 'اُعْبُدُوا',
      'اذْكُرُوا': 'اُذْكُرُوا', 'اقْتُلُوا': 'اُقْتُلُوا', 'انصُرْنَا': 'اُنصُرْنَا'
    };

    for (const [word, replacement] of Object.entries(waslReplacements)) {
      const regex = new RegExp('^' + word);
      if (regex.test(fixedText)) {
        fixedText = fixedText.replace(regex, replacement);
        break;
      }
    }

    const idghamLetters = 'بتثجحخدذرزسشصضطظفقكلمنوهيعغ';
    const idghamRegex = new RegExp(`([${idghamLetters}])(\\s+)(\\1)ّ`, 'g');
    fixedText = fixedText.replace(idghamRegex, '$1ْ$2$3');
    fixedText = fixedText.replace(/ن(?![ًٌٍَُِّْٰ])/g, 'نْ');

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
        // Use translated name if available, otherwise fallback to default
        const surahName = (t && t.surahNames && t.surahNames[s]) ? t.surahNames[s] : defaultSurahNames[s];
        fullTextHTML += `<div class="surah-header">(${s}) ${surahName}</div>`;
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

    settings.currentPage = page;
    const juz = getJuzNumber(settings.currentPage);
    pageInfo.textContent = `${t ? t.page : 'Page'} ${settings.currentPage} ${t ? t.of : 'of'} ${totalMushafPages} | ${t ? t.juz : 'Juz'} ${juz}`;
    prevBtn.disabled = settings.currentPage === 1;
    nextBtn.disabled = settings.currentPage === totalMushafPages;

    surahSelect.value = startSurah;
    juzSelect.value = juz;
    pageSelect.value = settings.currentPage;
    saveSettings();
  }

  function findFirstPageOfSurah(surahId) {
    for (let i = 0; i < quranPageData.length; i++) {
      const [start, end] = quranPageData[i];
      const startSurah = start[0];
      if (surahId === startSurah) {
        return i + 1;
      }
    }
    return 1;
  }

  function updateLegend() {
    if (!t) return;
    legend.innerHTML = `
        <h5 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.legendTitle}</h5>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FF70A6; margin-right: 5px;">■</span> <div>${t.ghunna}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #A64AC9; margin-right: 5px;">■</span> <div>${t.maddLong}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #F39C12; margin-right: 5px;">■</span> <div>${t.maddLiin}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #9932CC; margin-right: 5px;">■</span> <div>${t.maddSilah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #7F00FF; margin-right: 5px;">■</span> <div>${t.maddAsli}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #4682B4; margin-right: 5px;">■</span> <div>${t.qalqalah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #FFA500; margin-right: 5px;">■</span> <div>${t.iqlab}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #00BFFF; margin-right: 5px;">■</span> <div>${t.idghamGhunna}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #5DADE2; margin-right: 5px;">■</span> <div>${t.idghamBila}</div></li>
            <li style="display: flex; align-items: flex-start;"><span class="tajweed" style="font-weight: bold; color: #20B2AA; margin-right: 5px;">■</span> <div>${t.ikhfa}</div></li>
        </ul>
        <h5 style="margin-top: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">${t.pauseMarksTitle}</h5>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">۩</span> <div>${t.sajdah}</div></li>
            <li style="display: flex; align-items: flex-start;"><span style="color: #D9534F; font-weight: bold; margin-right: 5px;">م</span> <div>${t.lazim}</div></li>
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
    if (settings.currentPage > 1) {
      loadMushafPage(settings.currentPage - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (settings.currentPage < totalMushafPages) {
      loadMushafPage(settings.currentPage + 1);
    }
  });
});
