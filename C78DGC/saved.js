//A canvas vásznunk
const c = document.getElementById("vaszon")
const ctx = c.getContext("2d")
const scoreboard = document.getElementById("scoreboard")
const nameField = document.getElementById("name")
const nameAddButton = document.getElementById("scoreToName")
const steps = document.getElementById("steps")
const timer = document.getElementById("time")
const endScreenElement = document.getElementById("endScreen")
const audio = document.getElementById("sound")
const song = document.getElementById("song")
var bckg = new Audio('jocofullinterview41.mp3')

const sorok = 5;
const oszlopok = 5;
//Körök közti tér
const spacx = 115
const spacy = 115
c.width = (oszlopok * 100) + 200;
c.height = (sorok * 100) + 200

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
steps.innerHTML = "Lépések:" + stepCount.toString()
//Játék kezdete után indított időmérő
timer.innerHTML = "Eltelt idő:" + timeCounter.toString()
//időmérő
let travel = null
let startingPos = []
let solverOn = false


//A kör osztály
class Circle {
    constructor(id, active, x, y) {
        //Azonosító -> hanyadik sor hanyadik oszlop első + első = 11
        this.id = id
        //Be van e kapcsolva, azaz aktív-e
        this.active = active
        //A kör középpontjának X,Y pozíciója
        this.x = x * spacx
        this.y = y * spacy

    }

    //A kör megrajzolására szolgáló metódus
    drawme() {
        ctx.beginPath();
        //Ha aktív a kör akkor sárga egyébként fekete
        ctx.fillStyle = (this.active ? "yellow" : "black")
        ctx.arc(this.x, this.y, 50, 0, 2 * Math.PI)
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

    getX() {
        return this.x
    }

    getY() {
        return this.y
    }

    outline() {
        ctx.beginPath();
        ctx.lineWidth = 4
        ctx.strokeStyle = "red"
        ctx.arc(this.x, this.y, 55, 0, Math.PI * 2);
        ctx.stroke();
    }

    clearOutline() {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.arc(this.x, this.y, 55, 0, Math.PI * 2);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
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
 * Ez történik egy játékos vagy gép egy kör közelébe való kattintásakor
 * @param event egy kattintás eseményt vár
 */
function normalStepSwitching(event) {
    let rect = c.getBoundingClientRect()
    //canvason belüli kordinátákra hozás
    let x = event.x - rect.left
    let y = event.y - rect.top
    for (let circle of allCircles) {
        //távolság számítás a legközelebbi körhöz
        let dx = circle.x - x
        let dy = circle.y - y
        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 50) {
            //ha még nem indult el a játék akkor az első kattnál elindítjuk
            if (bigBoom === 0) {
                gameStarted = true
                bigBoom = 1
            }
            //minden körbe kattintásnál növeljük a számlálót
            if (gameStarted) {
                steps.innerHTML = "Lépések:" + (++stepCount).toString()
            }
            //kattintott kör és körülötte lévők átváltása
            circle.switch()
            if (solverOn) {
                circle.outline()
            }
            let xi = parseInt(circle.id.slice(0, 1))
            let yi = parseInt(circle.id.slice(1, 2))
            let xm1 = (xi - 1).toString() + yi.toString()
            let xp1 = (xi + 1).toString() + yi.toString()
            let ym1 = xi.toString() + (yi - 1).toString()
            let yp1 = xi.toString() + (yi + 1).toString()

            if (5 >= xi >= 1 || 5 >= yi >= 1) {
                allCircles.forEach(r => {
                    if (r.id === xp1) r.switch()
                    if (r.id === xm1) r.switch()
                    if (r.id === yp1) r.switch()
                    if (r.id === ym1) r.switch()
                })
            }
        }
    }
}

/**
 * Kezdőpálya
 */
startingMap()

/**
 * Alapértékek visszaállításáért felelős
 */
function reset() {
    solverOn = false
    gameStarted = false
    bigBoom = 0
    timeCounter = 0
    stepCount = 0
    steps.innerHTML = "Lépések:" + stepCount.toString()
    timer.innerHTML = "Eltelt idő:" + timeCounter.toString()
    clearInterval(travel)
}

/**
 * Játék elindításáért felelős, leginkább csak az időmérőért
 */
function start() {
    if (gameStarted) {
        travel = setInterval(function () {
            timer.innerHTML = "Eltelt idő:" + (++timeCounter).toString()
        }, 1000);
    } else {
        gameStarted = true
        clearInterval(travel)
    }

}

/**
 * Játék lezárásáért felelős
 */
function end() {
    endScreenElement.hidden = false;
    reset()
}

/**
 * Kattintásért felelős
 */

function scoreGenerator(stepped) {
    let stoop = stepped
    for (let i = 0; i < stepped; i++) {
        //dobestupidme0nosqrt
        stoop = Math.floor(Math.sqrt(stoop) * 40)
    }
    return stoop
}

function listScores() {
    let willBe = "<br>"

    for (let i = 1; i <= localStorage.length; i++) {
        if (localStorage.getItem(i.toString()) != null) {
            willBe += '<p>' + localStorage.getItem(i.toString()) + '</p>'
        }
    }
    scoreboard.innerHTML = "Scores: " + willBe
}

function reloadedScores() {
    gloCount = localStorage.length
}

function onTheHover(event) {
    let rect = c.getBoundingClientRect()
    //canvason belüli kordinátákra hozás
    let x = event.x - rect.left
    let y = event.y - rect.top
    for (let circle of allCircles) {
        let dx = circle.x - x
        let dy = circle.y - y
        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 50) {
            circle.outline()
        } else {
            circle.clearOutline()
        }
    }
}

c.addEventListener("click", function (e) {
    if (bckg.paused){
        bckg.volume = 0.01
        bckg.play();
    }

    if (gameStarted) {
        normalStepSwitching(e)
        if (activeCircles.length === 0) {
            gameStarted = false;
            reset()
            nameAddButton.onclick = () => {
                gloCount++
                localStorage.setItem(gloCount.toString(), nameField.value + "/" + scoreGenerator(stepCount).toString())
                listScores()
                end()
            }

        }
    }
})
c.addEventListener("mousemove", function (e) {
    if (!solverOn) {
        onTheHover(e)
    }
})

let levels = [1, 2, 3]
$(document).ready(function () {
    $(document.getElementById("reset")).click(function () {
        if (bigBoom === 1){
            allCircles = clone(startingPos)
            reset()
            travel
            gameStarted = true
            start()
            drawAll()
            endScreenElement.hidden = true
        }


    });
    $(document.getElementById("genMap")).click(function () {
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
        audio.src = "mixkit-cool-interface-click-tone-2568.wav"
        audio.volume = 0.2
        audio.play()


    });
    levels.forEach(num => {
        $(document.getElementById("palya_valaszto").innerHTML += "<option value=" + num + ">" + num + "</option>")
    })
    $(document.getElementById("solve")).click(function () {
        solverOn = true
        solverStart()
    })
    $(document.getElementById("test")).click(function () {

    })
});

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
    for (let i = 0; i < clickNumber; i++) {
        let x = getRandomInt(0, c.width)
        let y = getRandomInt(0, c.height)

        let event = new MouseEvent('click', {
            'view': window, 'bubbles': true, 'cancelable': true, 'clientX': x, 'clientY': y
        })
        normalStepSwitching(event)
    }
    endScreenElement.hidden = true;
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
        if (circle.active && xi !== 5) {
            returnerList.isEndGame = false
        }
    })
    if (returnerList.isEndGame) {
        allCircles.forEach(circle => {
            if (parseInt(circle.id.slice(0, 1)) === 5) {
                circle.active ? returnerList.pos.push(1) : returnerList.pos.push(0)
            }
        })

    }
    return returnerList
}

/**
 * Megkeresi a megadott idvel rendelkező kört és visszatér vele
 * @param id a megadott id
 * @returns {number} a megtalált kör
 */
function whichCircle(id) {
    let talalt = 0
    allCircles.forEach(keresett => {
        if (keresett.id === id) {
            talalt = keresett
        }
    })
    return talalt
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
 * Megoldja a játékot a "Chase the light" elven, ameddig nem csak az utolsó sorban vannak aktív körök addig hívja magát, majd választ az ismert patternek közül és ismét meghívja magát
 * @returns {void|*}
 */

function solver() {
    if (solverOn) {


        onlyLastRow()

        if (onlyLastRow().isEndGame) {
            //utolsó soros patternek
            let endPatterns = [{
                bot: [0, 0, 1, 1, 1], top: [0, 0, 0, 1, 0]
            }, {
                bot: [0, 1, 0, 1, 0], top: [0, 1, 0, 0, 1]
            }, {
                bot: [0, 1, 1, 0, 1], top: [1, 0, 0, 0, 0]
            }, {
                bot: [1, 0, 0, 0, 1], top: [0, 0, 0, 1, 1]
            }, {
                bot: [1, 0, 1, 1, 0], top: [0, 0, 0, 0, 1]
            }, {
                bot: [1, 1, 0, 1, 1], top: [0, 0, 1, 0, 0]
            }, {
                bot: [1, 1, 1, 0, 0], top: [0, 1, 0, 0, 0]
            }]
            for (let i = 0; i < endPatterns.length; i++) {
                if (containingTheSame(endPatterns[i].bot, onlyLastRow().pos)) {
                    for (let j = 0; j <= endPatterns[i].top.length; j++) {
                        if (endPatterns[i].top[j] === 1) {
                            let event = new MouseEvent('click', {
                                'view': window,
                                'bubbles': true,
                                'cancelable': true, //1-számos elcsúszás korrigálás, ne legyen 0, hanem 1-től
                                'clientX': (1 + j) * spacx,
                                'clientY': spacy * 2
                            })
                            normalStepSwitching(event)

                        }
                    }
                    onlyLastRow()

                    return setTimeout(() => {
                        solver()
                    }, 1000)
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
                        if (above.id === (xi - 1).toString() + yi.toString() && above.active) {
                            let event = new MouseEvent('click', {
                                'view': window,
                                'bubbles': true,
                                'cancelable': true,
                                'clientX': circle.getX(),
                                'clientY': circle.getY() + spacy
                            })
                            normalStepSwitching(event)
                            return activeCircles.length === 0 ? end() : setTimeout(() => {
                                solver()
                            }, 1000);
                        }
                    }
                }
            }
        }
    }
}

function solverStart() {
    solver()
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

reloadedScores()


