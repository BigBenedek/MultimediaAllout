//A canvas vásznunk
const c = document.getElementById("vaszon")
const ctx = c.getContext("2d")
const nameField = document.getElementById("name")
const steps = document.getElementById("steps")
const timer = document.getElementById("time")
const audio = document.getElementById("sound")
const song = document.getElementById("song")
const el = document.getElementById("pull-chain");
const levels = ['Kezdő', 'Közepes', 'Nehéz', 'Rémálom']
const levelsEn = ['Beginner', 'Medium', 'Hard', 'Nightmare']
let bckg = new Audio("/music/tuna.mp3")

/**
 * Loading manager - tracks loading progress and hides spinner when done
 */
class LoadingManager {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.isComplete = false;
        this.progressFill = null;
        this.progressText = null;
        this.loadingScreen = null;
        this.initialized = false;
    }

    initialize() {
        if (!this.initialized) {
            this.progressFill = document.getElementById('progress-fill');
            this.progressText = document.getElementById('progress-text');
            this.loadingScreen = document.getElementById('loading-screen');
            this.initialized = true;
        }
    }

    addAsset() {
        this.totalAssets++;
    }

    assetLoaded() {
        this.loadedAssets++;
        this.updateProgress();
        
        if (this.loadedAssets >= this.totalAssets && !this.isComplete) {
            this.complete();
        }
    }

    updateProgress() {
        if (this.totalAssets === 0) return;
        
        this.initialize(); // Ensure elements are found
        
        const percentage = Math.round((this.loadedAssets / this.totalAssets) * 100);
        if (this.progressFill) this.progressFill.style.width = percentage + '%';
        if (this.progressText) this.progressText.textContent = percentage + '%';
    }

    complete() {
        this.isComplete = true;
        this.initialize(); // Ensure elements are found
        
        // Ensure 100% is shown briefly before hiding
        setTimeout(() => {
            if (this.progressFill) this.progressFill.style.width = '100%';
            if (this.progressText) this.progressText.textContent = '100%';
            
            // Hide loading screen after a short delay
            setTimeout(() => {
                if (this.loadingScreen) this.loadingScreen.classList.add('loaded');
                
                // Remove from DOM after transition
                setTimeout(() => {
                    if (this.loadingScreen && this.loadingScreen.parentNode) {
                        this.loadingScreen.parentNode.removeChild(this.loadingScreen);
                    }
                }, 500);
            }, 300);
        }, 100);
    }
}

/**
 * Asset loading setup - track all loadable resources
 */
let loadingManager; // Declare but don't initialize yet

function setupAssetLoading() {
    // Initialize loading manager when DOM is ready
    loadingManager = new LoadingManager();
    
    // Track audio files
    const audioFiles = [
        { element: bckg, src: "/music/tuna.mp3" },
        { element: audio, src: "/music/mapGenSound.wav" },
        { element: song, src: "/music/TitkosMari.mp3" },
        { element: document.getElementById('backgsound'), src: "/music/tuna.mp3" }
    ];

    // Add audio assets to loading manager
    audioFiles.forEach(audioFile => {
        if (audioFile.element) {
            loadingManager.addAsset();
            
            const onLoad = () => {
                loadingManager.assetLoaded();
                audioFile.element.removeEventListener('canplaythrough', onLoad);
                audioFile.element.removeEventListener('error', onError);
            };
            
            const onError = () => {
                console.warn(`Failed to load audio: ${audioFile.src}`);
                loadingManager.assetLoaded(); // Still count as "loaded" to prevent hanging
                audioFile.element.removeEventListener('canplaythrough', onLoad);
                audioFile.element.removeEventListener('error', onError);
            };
            
            audioFile.element.addEventListener('canplaythrough', onLoad);
            audioFile.element.addEventListener('error', onError);
            
            // Set source if not already set
            if (!audioFile.element.src || audioFile.element.src === '') {
                audioFile.element.src = audioFile.src;
            }
        }
    });

    // Track CSS and external resources (fonts, etc.)
    loadingManager.addAsset(); // For CSS
    loadingManager.addAsset(); // For Bootstrap
    loadingManager.addAsset(); // For FontAwesome
    loadingManager.addAsset(); // For jQuery
    
    // Simulate external resource loading (these are typically already cached)
    setTimeout(() => {
        loadingManager.assetLoaded(); // CSS
        loadingManager.assetLoaded(); // Bootstrap
        loadingManager.assetLoaded(); // FontAwesome
        loadingManager.assetLoaded(); // jQuery
    }, 200);

    // Track DOM content
    loadingManager.addAsset();
    
    // Track initial game setup
    loadingManager.addAsset();
}

// Fallback: force complete loading after maximum wait time (10 seconds)
setTimeout(() => {
    if (loadingManager && !loadingManager.isComplete) {
        console.warn('Loading timeout reached, forcing completion');
        loadingManager.complete();
    }
}, 10000);

// Nyelv és audio állapot változók
let currentLanguage = 'hu'
let bgMusicEnabled = false
let sfxEnabled = true
let bgMusicVolume = 0.01
let sfxVolume = 0.02

/**
 * Téma preferencia kezelése localStorage-ben
 */
function saveThemePreference(isDarkMode) {
    localStorage.setItem('lights-out-theme', isDarkMode ? 'dark' : 'light');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('lights-out-theme');
    return savedTheme === 'light' ? false : true; // Alapértelmezett: dark mode
}

/**
 * Nyelvi preferencia kezelése localStorage-ben
 */
function saveLanguagePreference(language) {
    localStorage.setItem('lights-out-language', language);
}

function loadLanguagePreference() {
    return localStorage.getItem('lights-out-language');
}

function detectSystemLanguage() {
    // Böngésző nyelvének lekérése
    const browserLanguage = navigator.language || navigator.languages[0] || 'en';
    // Ha magyar nyelvű, akkor 'hu', egyébként 'en'
    return browserLanguage.toLowerCase().startsWith('hu') ? 'hu' : 'en';
}

function initializeLanguage() {
    // Először megnézzük van-e mentett nyelvi preferencia
    const savedLanguage = loadLanguagePreference();
    
    if (savedLanguage) {
        // Ha van mentett preferencia, azt használjuk
        currentLanguage = savedLanguage;
    } else {
        // Ha nincs mentett preferencia, automatikus detektálás
        currentLanguage = detectSystemLanguage();
        // Mentjük az automatikusan detektált nyelvet
        saveLanguagePreference(currentLanguage);
    }
    
    // UI frissítése az inicializált nyelvvel
    document.getElementById('currentLang').textContent = currentLanguage.toUpperCase();
    updateAllLanguageElements();
}

function applyTheme(isDarkMode) {
    const lamp = document.getElementById('lamp');
    const pullChain = document.getElementById('pull-chain');
    
    if (isDarkMode) {
        lamp.classList.remove('on');
        lamp.classList.add('off');
        // Pull chain alapértelmezett pozíció (nem húzott)
        pullChain.classList.remove('pulled');
    } else {
        lamp.classList.remove('off');
        lamp.classList.add('on');
        // Pull chain húzott pozíció
        pullChain.classList.add('pulled');
    }
    
    // Chain animáció beállítása
    const chain = pullChain.querySelector('.chain');
    if (chain) {
        chain.style.height = isDarkMode ? '50px' : '70px';
    }
}

function initializeTheme() {
    const isDarkMode = loadThemePreference();
    applyTheme(isDarkMode);
    
    // Ha vannak körök, újrarajzoljuk őket a betöltött téma szerint
    // Ez egy késleltetett callback lesz, mert a körök még nem léteznek az inicializáláskor
    setTimeout(() => {
        if (allCircles.length > 0) {
            ctx.clearRect(0, 0, c.width, c.height);
            drawAll();
        }
    }, 100);
}

//pálya mérete
const sorok = 5;
const oszlopok = 5;
//Körök közti tér
// Alapértelmezett spacing és körméret - ezek dinamikusan módosulnak responsive módban
let spacx = 110
let spacy = 110
let circleRadius = 50  // Alapértelmezett körméret

//a mivel a localStorageben nem Jsonnal tárolok így egy változó tárolja a "kövi id-t"
let gloCount = 0

//Aktív körök listája
let activeCircles = []

//Inaktív körök listája
let inactiveCircles = []

//Az összes kör listája
let allCircles = [];

//Első kattintáskor játékindításhoz
let bigBoom = 0
let gameStarted = false

//Játék kezdete után számolt kattintások alias lépések
let stepCount = 0
let timeCounter = 0

//időmérő
let travel = null

//kezdő pozíció a restarthoz
let startingPos = []

//solver be van-e kapcsolva
let solverOn = false

//Ha éppen mapot generálunk
let global_generates = false;

//lehet fölös
let lastSteps = 0;
let lastTime = 0;

//aktuálisan kiemelt kör a hover effekthez
let hoveredCircle = null;

song.volume = sfxVolume;
/**
 * Nyelvváltó funkció
 */
function switchLanguage() {
    currentLanguage = currentLanguage === 'hu' ? 'en' : 'hu'
    
    // Nyelvi preferencia mentése
    saveLanguagePreference(currentLanguage);
    
    document.getElementById('currentLang').textContent = currentLanguage.toUpperCase()
    
    updateAllLanguageElements();
}

/**
 * Összes nyelvi elem frissítése
 */
function updateAllLanguageElements() {
    // Szövegek frissítése
    const elements = document.querySelectorAll('[data-lang-hu][data-lang-en]')
    elements.forEach(element => {
        const huText = element.getAttribute('data-lang-hu')
        const enText = element.getAttribute('data-lang-en')
        
        if (huText && enText) {
            element.textContent = currentLanguage === 'hu' ? huText : enText
        }
    })
    
    // Placeholder-ek frissítése
    const placeholderElements = document.querySelectorAll('[data-lang-hu-placeholder][data-lang-en-placeholder]')
    placeholderElements.forEach(element => {
        const huPlaceholder = element.getAttribute('data-lang-hu-placeholder')
        const enPlaceholder = element.getAttribute('data-lang-en-placeholder')
        
        if (huPlaceholder && enPlaceholder) {
            element.placeholder = currentLanguage === 'hu' ? huPlaceholder : enPlaceholder
        }
    })
    
    // Modal tartalmak váltása - új módszer
    const modalContentsHu = document.querySelectorAll('[data-lang="hu"]');
    const modalContentsEn = document.querySelectorAll('[data-lang="en"]');
    
    modalContentsHu.forEach(element => {
        element.style.display = currentLanguage === 'hu' ? 'block' : 'none';
    });
    
    modalContentsEn.forEach(element => {
        element.style.display = currentLanguage === 'en' ? 'block' : 'none';
    });
    
    // Nehézségi szintek frissítése
    updateDifficultyOptions()
}

/**
 * Nehézségi szintek frissítése a nyelv alapján
 */
function updateDifficultyOptions() {
    const select = document.getElementById('palya_valaszto')
    const currentValue = select.value
    select.innerHTML = ''
    
    const currentLevels = currentLanguage === 'hu' ? levels : levelsEn
    currentLevels.forEach((level, index) => {
        const option = document.createElement('option')
        option.value = levels[index] // Mindig magyar értékkel dolgozunk belül
        option.textContent = level
        if (levels[index] === currentValue) {
            option.selected = true
        }
        select.appendChild(option)
    })
}

/**
 * Audio vezérlő funkciók
 */
function toggleBackgroundMusic() {
    bgMusicEnabled = !bgMusicEnabled
    const icon = document.getElementById('bgMusicIcon')
    
    if (bgMusicEnabled) {
        bckg.volume = bgMusicVolume
        bckg.play()
        icon.className = 'fas fa-pause'
    } else {
        bckg.pause()
        icon.className = 'fas fa-play'
    }
}

function toggleSoundEffects() {
    sfxEnabled = !sfxEnabled
    const icon = document.getElementById('sfxIcon')
    
    if (sfxEnabled) {
        icon.className = 'fas fa-volume-up'
    } else {
        icon.className = 'fas fa-volume-mute'
    }
}

function updateBackgroundVolume(value) {
    bgMusicVolume = value / 100
    bckg.volume = bgMusicVolume
    // Frissítjük a megjelenített értéket
    const valueDisplay = document.getElementById('bgVolumeValue')
    if (valueDisplay) {
        valueDisplay.textContent = value + '%'
    }
}

function updateSfxVolume(value) {
    sfxVolume = value / 100
    // Frissítjük a megjelenített értéket
    const valueDisplay = document.getElementById('sfxVolumeValue')
    if (valueDisplay) {
        valueDisplay.textContent = value + '%'
    }
}

/**
 * Hangeffekt lejátszása
 */
function playSound(soundFile, customVolume = null) {
    if (sfxEnabled) {
        audio.src = soundFile
        audio.volume = customVolume !== null ? customVolume : sfxVolume
        audio.play()
    }
}

//Játék kezdete után indított időmérő és lépésszámláló
steps.innerHTML = stepCount.toString()
timer.innerHTML = formatSeconds(timeCounter).toString()

//canvas méretének beállítása - kisebb méret a jobb elrendezéshez
adjustCanvasSize();
c.width = (oszlopok * spacx) + 50;
c.height = (sorok * spacy) + 50

/**
 * Canvas méretének és spacing-nak a beállítása képernyő méret alapján
 */
function adjustCanvasSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const containerPadding = 0; // padding mindkét oldalon
    const availableWidth = screenWidth - containerPadding;
    //console.log(`Screen width: ${screenWidth}, available width: ${availableWidth}`);
    
    // Mobilon kisebb spacing és körméret
    if (screenWidth < 576) {
        // Extra kis képernyő
        const maxCanvasWidth = Math.min(availableWidth, 300);
        spacx = spacy = Math.floor((maxCanvasWidth - 50) / Math.max(oszlopok, sorok));
        spacx = Math.max(spacx, 60); // minimum 60px spacing
        spacy = spacx;
        circleRadius = Math.max(spacx * 0.35, 20); // minimum 20px radius
    } else if (screenWidth < 768) {
        // Kis képernyő (tablet portrait)
        const maxCanvasWidth = Math.min(availableWidth, 400);
        spacx = spacy = Math.floor((maxCanvasWidth - 50) / Math.max(oszlopok, sorok));
        spacx = Math.max(spacx, 80);
        spacy = spacx;
        circleRadius = Math.max(spacx * 0.38, 30); // kicsit nagyobb arány
    } else if (screenWidth < 992) {
        // Közepes képernyő (tablet landscape)
        spacx = spacy = 90;
        circleRadius = 38; // kicsit nagyobb körök tablet landscape-en
    } else {
        // Nagy képernyő (desktop)
        spacx = spacy = 110;
        circleRadius = 50; // teljes méretű körök desktop-on
    }
}

//hamis kurzor eltüntetése - ELTÁVOLÍTVA


/**
 * Téma alapján visszaadja a megfelelő színeket
 * @returns {{activeColor: string, inactiveColor: string}} aktív és inaktív körök színei
 */
function getThemeColors() {
    const lamp = document.getElementById('lamp');
    const isDarkMode = lamp.classList.contains('off');
    
    if (isDarkMode) {
        return {
            activeColor: "#f1c40f",    // Sárga aktív körök
            inactiveColor: "#2c3e50"   // Sötét inaktív körök
        };
    } else {
        return {
            activeColor: "#f1c40f",    // Sárga aktív körök világos módban is
            inactiveColor: "#d3d3d3ff"   // Jól látható sötétszürke inaktív körök világos módban
        }
    }
}

//A kör osztály
class Circle {
    constructor(id, active, x, y) {

        //Azonosító -> hanyadik sor hanyadik oszlop első + első = 11
        this.id = id

        //Be van e kapcsolva, azaz aktív-e
        this.active = active
        
        // Grid pozíció tárolása a resize-hoz
        this.gridX = x
        this.gridY = y
       
        //A kör középpontjának X,Y pozíciója - dinamikus offset a center pozicionáláshoz
        // A játékterület középre pozicionálásához offset hozzáadása
        const offsetX = (c.width - (oszlopok * spacx)) / 2
        const offsetY = (c.height - (sorok * spacy)) / 2
        this.x = (x * spacx) - (spacx / 2) + offsetX
        this.y = (y * spacy) - (spacy / 2) + offsetY
    }

    //A kör megrajzolására szolgáló metódus
    drawme() {
        const colors = getThemeColors();
        
        // Először töröljük a teljes körterületet (körvonalas részt is)
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(this.x, this.y, circleRadius + 6, 0, 2 * Math.PI); // Kicsit nagyobb sugár a körvonal törlésére
        ctx.fill();
        ctx.restore();
        
        // Majd rajzoljuk újra a kört a dinamikus mérettel
        ctx.beginPath();
        ctx.fillStyle = (this.active ? colors.activeColor : colors.inactiveColor)
        ctx.arc(this.x, this.y, circleRadius, 0, 2 * Math.PI)
        ctx.fill()
    }

    //Kör aktívvá tevése
    setActive() {
        this.active = true
        this.drawme()
        inactiveCircles.forEach(r => {
            if (r.id === this.id) {
                inactiveCircles = inactiveCircles.filter(filter => filter !== this)
            }
        })
        allCircles.forEach(r => {
            if (r.id === this.id) {
                r.active = true
            }
        })
        activeCircles.push(this)
    }

    //Kör inaktívvá tevése
    setInactive() {
        this.active = false
        this.drawme()
        activeCircles.forEach(r => {
            if (r.id === this.id) {
                activeCircles = activeCircles.filter(filter => filter !== this)
            }
        })
        allCircles.forEach(r => {
            if (r.id === this.id) {
                r.active = false
            }
        })
        inactiveCircles.push(this)
    }

    //Kör aktívitásának megcserélése
    switch() {
        if (this.active) {
            this.setInactive()
        } else {
            this.setActive()
        }
    }

    //X kordi
    getX() {
        return this.x
    }

    //Y kordi
    getY() {
        return this.y
    }

    //körvonal
    outline() {
        ctx.beginPath();
        ctx.lineWidth = 3
        ctx.strokeStyle = "green"
        ctx.arc(this.x, this.y, circleRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    //körvonal leszedése
    clearOutline() {
        // Újrarajzoljuk a kört, így eltűnik a körvonal
        this.drawme();
    }

}

/**
 * Pálya kirajzolása, körök létrehozása és megfelelő helyre tétele
 */
function startingMap() {
    for (let i = 1; i <= sorok; i++) {
        for (let j = 1; j <= oszlopok; j++) {
            goodCirclesBack(i, j)
        }
    }
    drawAll()
}

/**
 * Az összes kör listáját kikapcsolt fényekkel tölti fel
 * @param i y kordináta
 * @param j x kordináta
 */
function goodCirclesBack(i, j) {
    //Ő lesz az új körünk
    let newbie = new Circle(i.toString() + j.toString(), false, j, i)
    allCircles.push(newbie)
}

/**
 * Megrajzolja az összes kört és állapotuk szerint 2 külön listába rakja őket
 */
function drawAll() {
    activeCircles = []
    inactiveCircles = []
    allCircles.forEach(circle => {
        if (circle.active) {
            activeCircles.push(circle)
        } else {
            inactiveCircles.push(circle)
        }
        circle.drawme()
    })
}

/**
 * Vászon-relatív koordinátákat alakít át oldal koordinátákká
 * @param canvasX vásznon belüli X koordináta
 * @param canvasY vásznon belüli Y koordináta
 * @returns {{x: number, y: number}} oldal koordináták
 */
function canvasToPageCoordinates(canvasX, canvasY) {
    let rect = c.getBoundingClientRect()
    
    // Figyelembe vesszük a canvas scaling-ét
    let scaleX = rect.width / c.width;
    let scaleY = rect.height / c.height;
    
    // Skálázott koordináták számítása
    let scaledX = canvasX * scaleX;
    let scaledY = canvasY * scaleY;
    
    return {
        x: scaledX + rect.left,
        y: scaledY + rect.top
    }
}

/**
 * Ez történik egy játékos vagy gép egy kör közelébe való kattintásakor
 * @param event egy kattintás eseményt vár
 */
function normalStepSwitching(event) {
    let rect = c.getBoundingClientRect()
    //canvason belüli kordinátákra hozás
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top

    // Ha van scaling, korrigáljuk a koordinátákat
    let scaleX = c.width / rect.width;
    let scaleY = c.height / rect.height;
    let scaledX = x * scaleX;
    let scaledY = y * scaleY;

    let closestCircle = null;
    let closestDistance = Infinity;

    // Megkeressük a legközelebbi kört a skálázott koordinátákkal
    for (let circle of allCircles) {
        let dx = circle.x - scaledX
        let dy = circle.y - scaledY
        let distance = Math.sqrt(dx * dx + dy * dy)
        let hitRadius = Math.max(circleRadius, spacx * 0.45)
        
        if (distance < hitRadius && distance < closestDistance) {
            closestDistance = distance;
            closestCircle = circle;
        }
    }

    // Ha találtunk kört, azzal dolgozunk
    if (closestCircle) {
        if (!global_generates) {
            playSound("/music/lightSwitch.mp3")
        }
        //ha még nem indult el a játék akkor az első kattnál elindítjuk
        if (bigBoom === 0) {
            gameStarted = true
            bigBoom = 1
        }
        //minden körbe kattintásnál növeljük a számlálót
        if (gameStarted) {
            steps.innerHTML = (++stepCount).toString()
        }
        //kattintott kör és körülötte lévők átváltása
        closestCircle.switch()
        let xi = parseInt(closestCircle.id.slice(0, 1))
        let yi = parseInt(closestCircle.id.slice(1, 2))
        let xm1 = (xi - 1).toString() + yi.toString()
        let xp1 = (xi + 1).toString() + yi.toString()
        let ym1 = xi.toString() + (yi - 1).toString()
        let yp1 = xi.toString() + (yi + 1).toString()

        if (sorok >= xi >= 1 || oszlopok >= yi >= 1) {
            allCircles.forEach(r => {
                if (r.id === xp1) r.switch()
                if (r.id === xm1) r.switch()
                if (r.id === yp1) r.switch()
                if (r.id === ym1) r.switch()
            })
        }
    }
}


/**
 * Alapértékek visszaállításáért felelős
 */
function reset() {
    solverOn = false
    gameStarted = false
    bigBoom = 0
    timeCounter = 0
    stepCount = 0
    steps.innerHTML = stepCount.toString()
    timer.innerHTML = formatSeconds(timeCounter).toString()
    clearInterval(travel)
}

/**
 * Játék elindításáért felelős, leginkább csak az időmérőért
 */
function start() {
    if (gameStarted) {
        travel = setInterval(function () {
            timer.innerHTML = formatSeconds(++timeCounter).toString()
        }, 1000);
    } else {
        gameStarted = true
        clearInterval(travel)
    }

}

/**
 * Időmérő megformázása, alapelve, a DateISOStringjéből kiszedem a kellő perc,másodperc kombót
 * @param totalSeconds megkapott másodpercek amit átalakítok
 * @returns {string} az emberi szemnek és agynak könnyen feldolgozható formátum
 */
function formatSeconds(totalSeconds) {
    let date = new Date(0); // The 0 there is the key, which sets the date to the epoch
    date.setSeconds(totalSeconds);
    return date.toISOString().substring(14, 19);
}

/**
 * Játék lezárásáért felelős
 */
function end() {
    if (!solverOn) {
        // Populate winner modal with final stats
        const finalTimeFormatted = formatSeconds(lastTime);
        document.getElementById('finalTime').textContent = finalTimeFormatted;
        document.getElementById('finalSteps').textContent = lastSteps.toString();
        document.getElementById('finalTimeEn').textContent = finalTimeFormatted;
        document.getElementById('finalStepsEn').textContent = lastSteps.toString();
        
        $('#endScreenModal').modal('toggle');
    } else {
        $('#lameScreenModal').modal('toggle');

    }
    reset()
}

/**
 * Minél több lépésel indul és időt tölt el, annál kevesebb lesz a pontszám.
 * Nehézségfokozat alapján kevesebb vagy több a pontszám
 * @param stepped kapott lépések
 * @param theTime kapott idő
 * @returns {number} a kapott lépésekből kiszámított pontszám
 */
function scoreGenerator(stepped, theTime) {
    let stoop = (stepped + 10000) - theTime
    let difficulty = document.getElementById('palya_valaszto')

    for (let i = 0; i < stepped + 10; i++) {
        //dobestupidme0nosqrt
        stoop = stoop - Math.sqrt(stoop)
    }
    switch (difficulty.value) {
        case 'Kezdő':
            stoop /= 4
            break
        case 'Közepes':
            stoop /= 3
            break
        case 'Nehéz':
            stoop /= 2
            break
    }
    return Math.round(stoop)
}

/**
 * kilistázza a scoreboardot
 */
function listScores() {
    let eas = document.getElementById("scoreStuff")
    eas.innerHTML = ''

    for (let i = 1; i <= localStorage.length; i++) {
        if (localStorage.getItem(i.toString()) != null) {
            eas.innerHTML += '<tr><td>' + localStorage.getItem(i.toString()).split('/')[0] + '</td>' + '<td>' + localStorage.getItem(i.toString()).split('/')[1] + '</td></tr>'
        }
    }

}

/**
 * frissíti a scoreboardot
 */
function reloadedScores() {
    gloCount = localStorage.length
}

/**
 * Kirajzolja annak a körnek a körvonalát, amely fölött van az egér
 * @param event egérmozgatás(mousemove) event
 */
function onTheHover(event) {
    let rect = c.getBoundingClientRect()
    //canvason belüli kordinátákra hozás
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    
    // Ha van scaling, korrigáljuk a koordinátákat
    let scaleX = c.width / rect.width;
    let scaleY = c.height / rect.height;
    let scaledX = x * scaleX;
    let scaledY = y * scaleY;
    
    let newHoveredCircle = null;
    let closestDistance = Infinity;
    
    // Megkeressük a legközelebbi kört a skálázott koordinátákkal
    for (let circle of allCircles) {
        let dx = circle.x - scaledX
        let dy = circle.y - scaledY
        let distance = Math.sqrt(dx * dx + dy * dy)
        let hitRadius = Math.max(circleRadius, spacx * 0.45)
                
        if (distance < hitRadius && distance < closestDistance) {
            closestDistance = distance;
            newHoveredCircle = circle;
        }
    }
    
    // Ha változott a hover állapot
    if (newHoveredCircle !== hoveredCircle) {
        // Újrarajzoljuk az egész vásznat tiszta állapotban
        ctx.clearRect(0, 0, c.width, c.height);
        drawAll();
        
        // Ha van új hover kör, adjunk neki körvonalat
        if (newHoveredCircle) {
            newHoveredCircle.outline();
        }
        
        hoveredCircle = newHoveredCircle;
    }
}

/**
 * Megnézi a palya_valaszto elem értékét és az alapján generál pályát
 */
function genMapOnSelect() {
    let difficulty = document.getElementById("palya_valaszto")
    allCircles.forEach(circle => circle.setInactive())
    global_generates = true
    let clickable = []
    //3 beégetett map a Kezdő, Közepes, Nehéz nehézségi fokozat ezek megadott pályát generálnak a Rémálom az megoldható randomot
    if (difficulty.value === 'Rémálom') {
        if (gameStarted) {
            reset()
            gameStarted = false
            clearInterval(travel)
            solvableBoard(100)
        } else {
            reset()
            gameStarted = true
            solvableBoard(100)
        }
    } else if (difficulty.value === 'Nehéz') {
        if (gameStarted) {
            reset()
            gameStarted = false
            clearInterval(travel)
        } else {
            reset()
            gameStarted = true
        }
        clickable = [
            allCircles[0],
            allCircles[1],
            allCircles[3],
            allCircles[12],
            allCircles[18]
        ]
    } else if (difficulty.value === 'Közepes') {
        if (gameStarted) {
            reset()
            gameStarted = false
            clearInterval(travel)
        } else {
            reset()
            gameStarted = true
        }
        clickable = [
            allCircles[0],
            allCircles[2],
            allCircles[13],
            allCircles[20]
        ]

    } else if (difficulty.value === 'Kezdő') {
        if (gameStarted) {
            reset()
            gameStarted = false
            clearInterval(travel)
        } else {
            reset()
            gameStarted = true
        }
        clickable = [
            allCircles[0],
            allCircles[4],
            allCircles[20],
            allCircles[24]
        ]
    }
    // fixed from clickable !== []
        if (clickable.length > 0) {
        for (let i = 0; i < clickable.length; i++) {
            let pageCoords = canvasToPageCoordinates(clickable[i].getX(), clickable[i].getY())
            let event = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true, //1-számos elcsúszás korrigálás, ne legyen 0, hanem 1-től
                'clientX': pageCoords.x,
                'clientY': pageCoords.y
            })
            normalStepSwitching(event)
        }
    }
    global_generates = false
    reset()
    ctx.clearRect(0, 0, c.width, c.height);
    drawAll()
    startingPos = clone(allCircles)
    gameStarted = true
    start()

    playSound("/music/mapGenSound.wav")
}

/**
 * Function to generate a random number between min and max: a random clickkek generálásához, hogy megoldható pálya legyen
 * @param min egész minimum ennél kissebbet nem generálhatunk
 * @param max egész maximum ennél nagyobbat nem generálhatunk
 * @returns {number} a generált canvas vásznon lévő kordináta
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Megoldható játéktáblát generál az alapján, hogy mesterséges kattintásokat hajt végre a pályán
 * @param clickNumber hányszor szeretnénk hogy kattintson véletlenszerűen
 */
function solvableBoard(clickNumber) {
    global_generates = true
    for (let i = 0; i < clickNumber; i++) {
        let x = getRandomInt(0, c.width)
        let y = getRandomInt(0, c.height)
        let pageCoords = canvasToPageCoordinates(x, y)

        let event = new MouseEvent('click', {
            'view': window, 'bubbles': true, 'cancelable': true, 'clientX': pageCoords.x, 'clientY': pageCoords.y
        })

        normalStepSwitching(event)
    }
    global_generates = false
    reset()
    ctx.clearRect(0, 0, c.width, c.height);
    drawAll()
    startingPos = clone(allCircles)
    gameStarted = true
    start()
}

/**
 * Lecsekkolja, hogy csak az utolsó sorban vannak-e aktív elemek
 * @returns {{pos: *[], isEndGame: boolean}}
 * ha nem az utolsó sorban vannak csak aktív elemek akkor isEndGame hamis értéket vesz fel
 * ellenkező esetben igazat és feltölti az utolsó sor állapotát 1-es bekapcsolt, a 0-ás kikapcsolt fény ez a lista a pos
 */
function onlyLastRow() {
    let returnerList = {
        isEndGame: true, pos: []
    }
    activeCircles.forEach(circle => {
        let xi = parseInt(circle.id.slice(0, 1))
        //let yi = parseInt(circle.id.slice(1,2))
        if (circle.active && xi !== sorok) {
            returnerList.isEndGame = false
        }
    })
    if (returnerList.isEndGame) {
        allCircles.forEach(circle => {
            if (parseInt(circle.id.slice(0, 1)) === sorok) {
                circle.active ? returnerList.pos.push(1) : returnerList.pos.push(0)
            }
        })

    }
    return returnerList
}

/**
 * Megnézi hogy két array "ugyanazt" tartalmazza-e
 * @param array1
 * @param array2
 * @returns {boolean} ha tartalmuk megegyezik igaz, egyébként nem
 */
function containingTheSame(array1, array2) {
    let areThey = true
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            areThey = false
        }
    }
    return areThey
}

/**
 * Megoldja a játékot a "Chase the light" elven, ameddig nem csak az utolsó sorban vannak aktív körök addig hívja magát, majd választ az ismert patternek közül és ismét meghívja magát (Univerzális megoldás)
 * @returns {void|*}
 */
function solver() {
    solverOn = true
    if (solverOn) {
        
        
        let lastRow = onlyLastRow()

        if (lastRow.isEndGame) {
            //utolsó soros patternek
            let endPatterns = [{
                bot: [0, 0, 1, 1, 1], top: [0, 0, 0, 1, 0], toClick: ['14']
            }, {
                bot: [0, 1, 0, 1, 0], top: [0, 1, 0, 0, 1], toClick: ['12','15']
            }, {
                bot: [0, 1, 1, 0, 1], top: [1, 0, 0, 0, 0], toClick: ['11']
            }, {
                bot: [1, 0, 0, 0, 1], top: [0, 0, 0, 1, 1], toClick: ['14', '15']
            }, {
                bot: [1, 0, 1, 1, 0], top: [0, 0, 0, 0, 1], toClick: ['15']
            }, {
                bot: [1, 1, 0, 1, 1], top: [0, 0, 1, 0, 0], toClick: ['13']
            }, {
                bot: [1, 1, 1, 0, 0], top: [0, 1, 0, 0, 0], toClick: ['12']
            }]
            for (let i = 0; i < endPatterns.length; i++) {
                if (containingTheSame(endPatterns[i].bot, onlyLastRow().pos)) {
                    for (let j = 0; j <= endPatterns[i].top.length; j++) {
                        if (endPatterns[i].top[j] === 1) {
                            let clickAt = '1' + ((j+1).toString())
                            for (let k = 0; k < allCircles.length; k++) {
                                if (allCircles[k].id === clickAt) {
                                    let canvasX = allCircles[k].getX()
                                    let canvasY = allCircles[k].getY()
                                    let pageCoords = canvasToPageCoordinates(canvasX, canvasY)
                                    let event = new MouseEvent('click', {
                                        'view': window,
                                        'bubbles': true,
                                        'cancelable': true, //1-számos elcsúszás korrigálás, ne legyen 0, hanem 1-től
                                        'clientX': pageCoords.x,
                                        'clientY': pageCoords.y
                                    })
                                    normalStepSwitching(event)
                                    //debugger;
                                }
                            }
                        }
                    }
                    onlyLastRow()

                    return setTimeout(() => {
                        solver()
                    }, 800)
                }
            }

        } else {
            for (let i = 0; i < allCircles.length; i++) {
                let circle = allCircles[i];

                let xi = parseInt(circle.id.slice(0, 1))
                let yi = parseInt(circle.id.slice(1, 2))

                if (xi > 1) {
                    for (let j = 0; j < allCircles.length; j++) {
                        let above = allCircles[j];
                        //console.log("Found active circle above: " + above.id);
                        if (above.id === (xi - 1).toString() + yi.toString() && above.active) {

                            
                            let pageCoords = canvasToPageCoordinates(circle.getX(), circle.getY())
                            let event = new MouseEvent('click', {
                                'view': window,
                                'bubbles': true,
                                'cancelable': true,
                                'clientX': pageCoords.x,
                                'clientY': pageCoords.y
                            })
                            normalStepSwitching(event)
                            return activeCircles.length === 0 ? end() : setTimeout(() => {
                                solver()
                            }, 800);
                        }
                    }
                }
            }
        }
    }
}

/**
 *  Ez nem is deepcopy, mivel az objektumok trükkösebbek újra kell alkotni a listát az alapkordinátákat az idből fejtem vissza. Ez a függvény készít egy listát új objektumokból, egy másik lista alapján
 * @param masolando a lista ami alapján a másolatot készíti
 * @returns {*[]} az elkészült friss lista
 */
function clone(masolando) {
    let masolt = []
    for (let i = 0; i < masolando.length; i++) {
        masolt.push(new Circle(masolando[i].id, masolando[i].active, masolando[i].id.slice(1, 2), masolando[i].id.slice(0, 1)))
    }
    return masolt
}

/**
 * Ha betöltödik a DOM akkor fut
 */
$(document).ready(function () {
    // Start asset loading tracking now that DOM is ready
    setupAssetLoading();
    
    // Mark DOM as loaded
    loadingManager.assetLoaded();
    
    // Téma inicializálása localStorage alapján
    initializeTheme()
    
    // Nyelvi inicializálás localStorage alapján és automatikus detektálással
    initializeLanguage()
    
    // Audio inicializálás
    bckg.volume = bgMusicVolume
    bckg.loop = true
    document.getElementById('bgVolumeSlider').value = bgMusicVolume * 100
    document.getElementById('sfxVolumeSlider').value = sfxVolume * 100
    
    // Inicializáljuk a megjelenített értékeket
    const bgValueDisplay = document.getElementById('bgVolumeValue')
    const sfxValueDisplay = document.getElementById('sfxVolumeValue')
    if (bgValueDisplay) bgValueDisplay.textContent = (bgMusicVolume * 100).toFixed(1) + '%'
    if (sfxValueDisplay) sfxValueDisplay.textContent = (sfxVolume * 100).toFixed(1) + '%'
    
    //ha nem üres akkor betöltjük az adatokat
    if (localStorage.length > 0) {
        listScores()
    }
    
    // Initialize game elements
    setTimeout(() => {
        // Mark game initialization as complete
        loadingManager.assetLoaded();
    }, 100);
    
    // Nyelvváltó eseménykezelő
    $(document.getElementById("languageToggle")).click(function () {
        switchLanguage()
    });
    
    // Audio vezérlő eseménykezelők
    $(document.getElementById("bgMusicToggle")).click(function () {
        toggleBackgroundMusic()
    });
    
    $(document.getElementById("sfxToggle")).click(function () {
        toggleSoundEffects()
    });
    
    $(document.getElementById("bgVolumeSlider")).on('input', function () {
        updateBackgroundVolume(this.value)
    });
    
    $(document.getElementById("sfxVolumeSlider")).on('input', function () {
        updateSfxVolume(this.value)
    });
    
    $(document.getElementById("reset")).click(function () {
        if (bigBoom === 1) {
            solverOn = false;
            allCircles = clone(startingPos)
            reset()
            gameStarted = true
            start()
            drawAll()
        }
    });

    $(document.getElementById("genMap")).click(function () {
        genMapOnSelect()
    });
    
    $(document.getElementById("solve")).click(function () {
        if (!solverOn && activeCircles.length > 0) {
            solverOn = true
            solver()
        }
    })
    $(document.getElementById("scoreToName")).click(function () {
        gloCount++
        if (nameField.value.trim() !== "") {
            localStorage.setItem(gloCount.toString(), nameField.value + "/" + scoreGenerator(lastSteps, lastTime).toString())
        } else {
            localStorage.setItem(gloCount.toString(), "Anonymous" + "/" + scoreGenerator(lastSteps, lastTime).toString())

        }
        listScores()
        end()
    })
    $(document.getElementById("noobsAgree")).click(function () {
        playSound("/music/solverEndSound.mp3", null)
    })
    
    // Modal accessibility fixes
    $('#lameScreenModal').on('show.bs.modal', function () {
        // Remove aria-hidden when modal is being shown
        $(this).removeAttr('aria-hidden');
    });
    
    $('#lameScreenModal').on('shown.bs.modal', function () {
        // Ensure aria-hidden is not set when modal is fully shown
        $(this).removeAttr('aria-hidden');
        // Optionally focus the first focusable element
        $(this).find('button:first').focus();
    });
    
    $('#lameScreenModal').on('hide.bs.modal', function () {
        // Bootstrap will handle aria-hidden when hiding
    });
    
    $('#endScreenModal').on('show.bs.modal', function () {
        // Remove aria-hidden when modal is being shown
        $(this).removeAttr('aria-hidden');
    });
    
    $('#endScreenModal').on('shown.bs.modal', function () {
        // Ensure aria-hidden is not set when modal is fully shown
        $(this).removeAttr('aria-hidden');
        // Optionally focus the first focusable element
        $(this).find('button:first').focus();
    });
    
    $('#endScreenModal').on('hide.bs.modal', function () {
        // Bootstrap will handle aria-hidden when hiding
    });
});

/**
 * Kattintásért felelős hallgató
 */
c.addEventListener("click", function (e) {
    if (bckg.paused && bgMusicEnabled){
        bckg.volume = bgMusicVolume
        bckg.loop = true
        bckg.play().then(r =>  console.log());
    }
    if (gameStarted) {
        normalStepSwitching(e)
        if (activeCircles.length === 0) {
            if (bgMusicEnabled) {
                bckg.pause()
                setTimeout(()=>{
                    if (bgMusicEnabled) {
                        bckg.play().then(r => console.log());
                    }
                },8000)
            }
            if (solverOn) {
                gameStarted = false;
                lastSteps = stepCount
                lastTime = timeCounter
                end()
            } else {
                if (sfxEnabled) {
                    song.src = "/music/TitkosMari.mp3"
                    song.volume = sfxVolume
                    song.play()
                }
                gameStarted = false;
                lastSteps = stepCount
                lastTime = timeCounter
                end()
            }

        }
    }
})

/**
 * Egérmozgatásért felelős hallgató
 */
c.addEventListener("mousemove", function (e) {
    if (!solverOn && gameStarted) {
        onTheHover(e)
    }
})

/**
 * Egér kilépése a canvas területéről
 */
c.addEventListener("mouseleave", function (e) {
    if (!solverOn && gameStarted && hoveredCircle) {
        hoveredCircle = null;
        ctx.clearRect(0, 0, c.width, c.height);
        drawAll();
    }
})

/**
 * Lámpakapcsoló zsinór vagy mi imitátor
 */
el.addEventListener("click", function () {
    const lamp = document.getElementById('lamp');
    const currentlyDark = lamp.classList.contains('off');
    const newDarkMode = !currentlyDark;
    
    // Téma váltása
    applyTheme(newDarkMode);
    
    // Preferencia mentése localStorage-be
    saveThemePreference(newDarkMode);
    
    // Chain animáció jQuery-vel
    $(".chain", this).animate({
        height: newDarkMode ? "50px" : "70px"
    }, 500);
    
    // Körök újrarajzolása az új témának megfelelően
    if (allCircles.length > 0) {
        ctx.clearRect(0, 0, c.width, c.height);
        drawAll();
    }
}, false);

/**
 * Kezdőpálya
 */
startingMap()

/**
 * Pontszámok betöltése
 */
reloadedScores()

/**
 * Window resize event listener - responsive canvas
 */
let resizeTimeout;
window.addEventListener('resize', function() {
    // Debounce a resize eseményt a teljesítmény érdekében
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        adjustCanvasSize();
        c.width = (oszlopok * spacx) + 50;
        c.height = (sorok * spacy) + 50;
        
        // Canvas újrarajzolása új méretekkel
        if (allCircles.length > 0) {
            // Körök pozíciójának újraszámítása középre pozicionálással
            const offsetX = (c.width - (oszlopok * spacx)) / 2
            const offsetY = (c.height - (sorok * spacy)) / 2
            allCircles.forEach(circle => {
                circle.x = (circle.gridX * spacx) - (spacx / 2) + offsetX;
                circle.y = (circle.gridY * spacy) - (spacy / 2) + offsetY;
            });
            drawAll();
        }
    }, 150);
});

/**
 * Touch események kezelése mobil eszközökön
 */
c.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = c.getBoundingClientRect();
    const canvasCoords = canvasToPageCoordinates(touch.clientX - rect.left, touch.clientY - rect.top);
    
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: canvasCoords.pageX,
        clientY: canvasCoords.pageY,
        bubbles: true
    });
    c.dispatchEvent(mouseEvent);
}, { passive: false });

c.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = c.getBoundingClientRect();
    const canvasCoords = canvasToPageCoordinates(touch.clientX - rect.left, touch.clientY - rect.top);
    
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: canvasCoords.pageX,
        clientY: canvasCoords.pageY,
        bubbles: true
    });
    c.dispatchEvent(mouseEvent);
}, { passive: false });


