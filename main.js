/**
 * TTS Playground - Main Logic
 */

const state = {
    lang: 'en', // UI language: 'en' or 'pl'
    voices: [],
    currentUtterance: null,
    isPlaying: false,
    text: '',
    speed: 1.0,
    pitch: 1.0,
    selectedLangCode: localStorage.getItem('tts-lang-code') || '',
    selectedVoiceName: localStorage.getItem('tts-voice') || ''
};

const translations = {
    en: {
        title: 'TTS Playground',
        inputLabel: 'Enter Text Below',
        inputPlaceholder: 'Type or paste your text here...',
        clear: 'Clear',
        languageLabel: 'Select Language',
        voiceLabel: 'Select Voice',
        loadingVoices: 'Loading voices...',
        speedLabel: 'Speed',
        pitchLabel: 'Pitch',
        play: 'Speak',
        pause: 'Pause',
        resume: 'Resume',
        stop: 'Stop',
        statusReady: 'Ready to speak',
        statusSpeaking: 'Speaking...',
        statusPaused: 'Paused',
        statusError: 'Error occurred',
        charCount: '{count} characters'
    },
    pl: {
        title: 'TTS Playground',
        inputLabel: 'Wprowadź tekst poniżej',
        inputPlaceholder: 'Wpisz lub wklej tekst tutaj...',
        clear: 'Wyczyść',
        languageLabel: 'Wybierz Język',
        voiceLabel: 'Wybierz Głos',
        loadingVoices: 'Ładowanie głosów...',
        speedLabel: 'Prędkość',
        pitchLabel: 'Ton',
        play: 'Czytaj',
        pause: 'Wstrzymaj',
        resume: 'Wznów',
        stop: 'Zatrzymaj',
        statusReady: 'Gotowy do czytania',
        statusSpeaking: 'Czytanie...',
        statusPaused: 'Wstrzymano',
        statusError: 'Wystąpił błąd',
        charCount: '{count} znaków'
    }
};

// DOM Elements
const elements = {
    title: document.getElementById('ui-title'),
    inputLabel: document.getElementById('ui-input-label'),
    textInput: document.getElementById('text-input'),
    charCount: document.getElementById('char-count'),
    btnClear: document.getElementById('btn-clear'),
    uiClear: document.getElementById('ui-clear'),
    languageLabel: document.getElementById('ui-language-label'),
    languageSelect: document.getElementById('language-select'),
    voiceLabel: document.getElementById('ui-voice-label'),
    voiceSelect: document.getElementById('voice-select'),
    voiceWrapper: document.getElementById('voice-wrapper'),
    speedLabel: document.getElementById('ui-speed-label'),
    speedVal: document.getElementById('speed-val'),
    rateInput: document.getElementById('rate'),
    pitchLabel: document.getElementById('ui-pitch-label'),
    pitchVal: document.getElementById('pitch-val'),
    pitchInput: document.getElementById('pitch'),
    btnPlay: document.getElementById('btn-play'),
    uiPlay: document.getElementById('ui-play'),
    btnStop: document.getElementById('btn-stop'),
    uiStop: document.getElementById('ui-stop'),
    btnLangToggle: document.getElementById('lang-toggle'),
    progressBar: document.getElementById('progress-bar'),
    statusText: document.getElementById('status-text')
};

/**
 * Initialize App
 */
function init() {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    updateUIStrings();
    setupEventListeners();
    
    // Load saved preferences
    const savedSpeed = localStorage.getItem('tts-speed');
    const savedPitch = localStorage.getItem('tts-pitch');
    if (savedSpeed) {
        state.speed = parseFloat(savedSpeed);
        elements.rateInput.value = state.speed;
        elements.speedVal.textContent = state.speed.toFixed(1) + 'x';
    }
    if (savedPitch) {
        state.pitch = parseFloat(savedPitch);
        elements.pitchInput.value = state.pitch;
        elements.pitchVal.textContent = state.pitch.toFixed(1);
    }
}

/**
 * Load and Organize Voices
 */
function loadVoices() {
    state.voices = speechSynthesis.getVoices();
    if (state.voices.length === 0) return;

    // Extract unique language codes (e.g., 'PL', 'EN')
    const languages = [...new Set(state.voices.map(v => v.lang.split('-')[0].toUpperCase()))].sort();
    
    elements.languageSelect.innerHTML = '<option value="" disabled selected>Select Language</option>';
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.toLowerCase();
        option.textContent = lang;
        if (state.selectedLangCode === lang.toLowerCase()) {
            option.selected = true;
        }
        elements.languageSelect.appendChild(option);
    });

    // If we have a saved language, populate voices immediately
    if (state.selectedLangCode) {
        populateVoicesForLanguage(state.selectedLangCode);
    }
}

/**
 * Populate Voice Select based on selected language
 */
function populateVoicesForLanguage(langCode) {
    const filteredVoices = state.voices.filter(v => v.lang.toLowerCase().startsWith(langCode));
    
    elements.voiceSelect.innerHTML = '';
    filteredVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (state.selectedVoiceName === voice.name) {
            option.selected = true;
        }
        elements.voiceSelect.appendChild(option);
    });

    // Animate reveal
    elements.voiceWrapper.classList.add('is-visible');
}

/**
 * Update UI Texts based on language
 */
function updateUIStrings() {
    const t = translations[state.lang];
    elements.title.textContent = t.title;
    elements.inputLabel.textContent = t.inputLabel;
    elements.textInput.placeholder = t.inputPlaceholder;
    elements.uiClear.textContent = t.clear;
    elements.languageLabel.textContent = t.languageLabel;
    elements.voiceLabel.textContent = t.voiceLabel;
    elements.speedLabel.textContent = t.speedLabel;
    elements.pitchLabel.textContent = t.pitchLabel;
    elements.uiPlay.textContent = state.isPlaying ? (speechSynthesis.paused ? t.resume : t.pause) : t.play;
    elements.uiStop.textContent = t.stop;
    elements.statusText.textContent = t.statusReady;
    
    updateCharCount();
}

function updateCharCount() {
    const count = elements.textInput.value.length;
    elements.charCount.textContent = translations[state.lang].charCount.replace('{count}', count);
}

/**
 * Speech Functions
 */
function speak() {
    if (speechSynthesis.speaking) {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            state.isPlaying = true;
            updatePlayButtonUI();
        } else {
            speechSynthesis.pause();
            state.isPlaying = true;
            updatePlayButtonUI();
        }
        return;
    }

    const text = elements.textInput.value.trim();
    if (!text) return;

    state.currentUtterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoiceName = elements.voiceSelect.value;
    const voice = state.voices.find(v => v.name === selectedVoiceName);
    if (voice) state.currentUtterance.voice = voice;

    state.currentUtterance.rate = state.speed;
    state.currentUtterance.pitch = state.pitch;

    // Events
    state.currentUtterance.onstart = () => {
        state.isPlaying = true;
        updatePlayButtonUI();
        elements.statusText.textContent = translations[state.lang].statusSpeaking;
    };

    state.currentUtterance.onend = () => {
        state.isPlaying = false;
        updatePlayButtonUI();
        elements.statusText.textContent = translations[state.lang].statusReady;
        elements.progressBar.style.width = '0%';
        document.body.classList.remove('playing');
    };

    state.currentUtterance.onerror = (event) => {
        console.error('Speech error:', event);
        state.isPlaying = false;
        updatePlayButtonUI();
        elements.statusText.textContent = translations[state.lang].statusError;
        document.body.classList.remove('playing');
    };

    state.currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const total = text.length;
            const current = event.charIndex;
            const progress = (current / total) * 100;
            elements.progressBar.style.width = `${progress}%`;
        }
    };

    document.body.classList.add('playing');
    speechSynthesis.speak(state.currentUtterance);
}

function stop() {
    speechSynthesis.cancel();
    state.isPlaying = false;
    updatePlayButtonUI();
    elements.progressBar.style.width = '0%';
    elements.statusText.textContent = translations[state.lang].statusReady;
    document.body.classList.remove('playing');
}

function updatePlayButtonUI() {
    const t = translations[state.lang];
    const playIcon = elements.btnPlay.querySelector('i');
    
    if (state.isPlaying) {
        if (speechSynthesis.paused) {
            elements.uiPlay.textContent = t.resume;
            playIcon.className = 'ph ph-play-circle';
        } else {
            elements.uiPlay.textContent = t.pause;
            playIcon.className = 'ph ph-pause';
        }
    } else {
        elements.uiPlay.textContent = t.play;
        playIcon.className = 'ph ph-play';
    }
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    elements.btnLangToggle.addEventListener('click', () => {
        state.lang = state.lang === 'en' ? 'pl' : 'en';
        updateUIStrings();
    });

    elements.textInput.addEventListener('input', updateCharCount);

    elements.btnClear.addEventListener('click', () => {
        elements.textInput.value = '';
        updateCharCount();
    });

    elements.rateInput.addEventListener('input', (e) => {
        state.speed = parseFloat(e.target.value);
        elements.speedVal.textContent = state.speed.toFixed(1) + 'x';
        localStorage.setItem('tts-speed', state.speed);
    });

    elements.pitchInput.addEventListener('input', (e) => {
        state.pitch = parseFloat(e.target.value);
        elements.pitchVal.textContent = state.pitch.toFixed(1);
        localStorage.setItem('tts-pitch', state.pitch);
    });

    elements.languageSelect.addEventListener('change', (e) => {
        state.selectedLangCode = e.target.value;
        localStorage.setItem('tts-lang-code', state.selectedLangCode);
        populateVoicesForLanguage(state.selectedLangCode);
    });

    elements.voiceSelect.addEventListener('change', (e) => {
        state.selectedVoiceName = e.target.value;
        localStorage.setItem('tts-voice', state.selectedVoiceName);
    });

    elements.btnPlay.addEventListener('click', speak);
    elements.btnStop.addEventListener('click', stop);
}

// Start
init();
