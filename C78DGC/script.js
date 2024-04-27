//A canvas vásznunk
const c = document.getElementById("vaszon")
const ctx = c.getContext("2d")
const resetButton = document.getElementById("reset")
const generateButton = document.getElementById("genMap")
const solveButton = document.getElementById("solve")
const nameAddButton = document.getElementById("scoreToName")
const endScreenElement = document.getElementById("endScreen")
const palya_valaszto = document.getElementById("palya_valaszto")
const scoreboard = document.getElementById("scoreboard")
const nameField = document.getElementById("name")
const steps = document.getElementById("steps")
const timer = document.getElementById("time")
//Hányszor hanyas a pálya
const sorok = 5;
const oszlopok = 5;
//Körök közti tér 50->sugár-10->tér-50->sugár
const spacx = 110
const spacy = 110

//Az összes kör listája
let allCircles = Array.from(Array(sorok), () => new Array(oszlopok));
//Aktív körök listája
let activeCircles = 0
//Első kattintáskor játékindításhoz
let gameStarted = false
//Játék kezdete után számolt kattintások alias lépések
let stepCount = 0
//Játék kezdete után indított időmérő
let timeCounter = 0
//időmérő
let travel = null
//resethez hasznaltam
let clonedBoard = null

//dkyet
let gloCount = 0

//A kör osztály
class Circle {
    constructor(active, x, y) {
        //Be van e kapcsolva, azaz aktív-e
        this.active = active
        //A kör középpontjának X,Y pozíciója
        this.x = x
        this.y = y
    }


    //A kör megrajzolására szolgáló metódus
    draw() {
        ctx.beginPath();
        //Ha aktív a kör akkor sárga egyébként fekete
        ctx.fillStyle = (this.active ? "yellow" : "black")
        ctx.arc(this.x, this.y, 50, 0, 2 * Math.PI)
        ctx.fill()
    }

    //Kör aktívitásának megcserélése
    switch(){
        if(!this.active){
            ++activeCircles;
        }else{
            --activeCircles
        }
        this.active = !this.active
        this.draw();
    }
 }

/**
 * Pálya kirajzolása, körök létrehozása és megfelelő helyre tétele
 */
function startGame() {
    resetButton.onclick = reset;
    generateButton.onclick = generateBoard;
    solveButton.onclick = solver;

    for(let i = 1; i < 6; ++i){
        palya_valaszto.innerHTML += "<option value="+i+">"+i+"</option>"
    }

    for (let i = 0; i < sorok; i++) {
        for (let j = 0; j < oszlopok; j++) {
            allCircles[i][j] = new Circle(false, (i+1)*spacx, (j+1)*spacy)
        }
    }
    drawAll()
}

/**
 * Megrajzolja az összes kört és állapotuk szerint 2 külön listába rakja őket
 */
function drawAll() {
    allCircles.forEach(array =>{
        array.forEach(circle => {
            circle.draw()
        })
    })
}

function switchCircle(i, j){
    allCircles[i][j].switch()
    if (i-1 >= 0){
        allCircles[i-1][j].switch()
    }
    if (i+1 < sorok){
        allCircles[i+1][j].switch()
    }
    if (j-1 >= 0){
        allCircles[i][j-1].switch()
    }
    if (j+1 < oszlopok){
        allCircles[i][j+1].switch()
    }
}

/**
 * Ez történik egy játékos vagy gép egy kör közelébe való kattintásakor
 * @param x
 * @param y
 */
function normalStepSwitching(x,y){
    let coordj = (Math.round(x/110)-1) < 5 ? (Math.round(x/110)-1) : 4
    let coordi = (Math.round(y/110)-1) < 5 ? (Math.round(y/110)-1) : 4
    let egeszi = coordj < 0 ? 0 : coordj
    let egeszj = coordi < 0 ? 0 : coordi
    let circlex = allCircles[egeszi][egeszj].x
    let circley = allCircles[egeszi][egeszj].y
    let dx = circlex - x
    let dy = circley - y
    let distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < 50){
        //ha még nem indult el a játék akkor az első kattnál elindítjuk --> a videóba, miután legenerálta a mapot elindul a timer
        //minden körbe kattintásnál növeljük a számlálót
        if (gameStarted){
            steps.innerHTML =  "Lépések: " +(++stepCount)
        }
        switchCircle(egeszi, egeszj)
    }
}

/**
 * Alapértékek visszaállításáért felelős
 */
function reset() {
    if(gameStarted){
        allCircles = clone(clonedBoard);
        clearInterval(travel)
        travel = setInterval(time, 1000);
        drawAll();
        endScreenElement.hidden = true
        timeCounter = 0
        stepCount = 0
        steps.innerHTML = "Lépések: " + stepCount
        timer.innerHTML = "Eltelt idő: " + timeCounter
    }
}

/**
 * Játék lezárásáért felelős
 */
function end() {
    endScreenElement.hidden = false;
    reset()
}

function time(){
    timer.innerHTML = "Eltelt idő: " + (++timeCounter)
}

function listScores() {
    let willBe = "<br>"

    for (let i = 1; i <= localStorage.length; i++) {
        if (localStorage.getItem(i.toString()) != null){
            willBe += '<p>'+localStorage.getItem(i.toString())+'</p>'
        }
    }
    scoreboard.innerHTML ="Scores: "+ willBe
}

function reloadedScores(){
    gloCount = localStorage.length
}

function scoreGenerator(stepped) {
    let stoop = stepped
    for (let i = 0; i < stepped; i++) {
        //dobestupidme0nosqrt
        stoop = Math.floor(Math.sqrt(stoop)*40)
    }
    return stoop
}

/**
 * Kattintásért felelős
 */
c.addEventListener("click",(e) => {
    let rect = c.getBoundingClientRect()
    let x = e.x - rect.left
    let y = e.y - rect.top
    if (gameStarted){
        normalStepSwitching(x,y)
        if (activeCircles === 0){
            gameStarted = false;
            if (nameField.value.length !== 0){
                nameAddButton.onclick = () =>{
                   gloCount++
                   localStorage.setItem(gloCount.toString(),nameField.value+"/"+scoreGenerator(stepCount).toString())
                   listScores()
                   end()
                }
            }
            end()
        }
    }

})

/**
 * Function to generate a random number between min and max: a random clickkek generálásához, hogy megoldható pálya legyen
 * @param min egész minimum ennél kissebbet nem generálhatunk
 * @param max egész maximum ennél nagyobbat nem generálhatunk
 * @returns {number} a generált canvas vásznon lévő kordináta
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Megoldható játéktáblát generál az alapján, hogy mesterséges kattintásokat hajt végre a pályán
 */
function generateBoard() {
    //nehezseg lol
    let clickCount = palya_valaszto.value * 10;
    gameStarted = true;
    timeCounter = 0
    stepCount = 0
    steps.innerHTML = "Lépések: " + stepCount
    timer.innerHTML = "Eltelt idő: " + timeCounter
    clearInterval(travel);
    travel = setInterval(time, 1000);

    for (let i = 0; i < clickCount; i++){
        let x = getRandomInt(0, sorok)
        let y = getRandomInt(0, oszlopok)
        switchCircle(x, y);
    }

    endScreenElement.hidden = true;
    ctx.clearRect(0, 0, c.width, c.height);
    drawAll()
    //az objektek nem fognak problemazni? Elvileg ez igy jo de majd megnezzuk, max visszarakom . kk
    clonedBoard = clone(allCircles);
}

/**
 * Lecsekkolja, hogy csak az utolsó sorban vannak-e aktív elemek
 * ha nem az utolsó sorban vannak csak aktív elemek akkor isEndGame hamis értéket vesz fel
 * ellenkező esetben igazat és feltölti az utolsó sor állapotát 1-es bekapcsolt, a 0-ás kikapcsolt fény ez a lista a pos
 */
function onlyLastRow() {
    for(let i = 0; i < sorok; ++i){
        for(let j = 0; j < oszlopok; ++j){
            if(i !== sorok-1 && allCircles[i][j].active){
                return false;
            }
        }
    }
    return true;
}

/**
 * Megkeresi a megadott idvel rendelkező kört és visszatér vele
 * @param id a megadott id
 * @returns {number} a megtalált kör
 */
function whichCircle(id) {
    let talalt = 0
    allCircles.forEach(keresett => {
        if (keresett.id === id){
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
function containingTheSame(array1,array2) {
    let areThey = true
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]){
            areThey = false
        }
    }
    return areThey
}

/**
 * Megoldja a játékot a "Chase the light" elven, ameddig nem csak az utolsó sorban vannak aktív körök addig hívja magát, majd választ az ismert patternek közül és ismét meghívja magát
 * @returns {void|*}
 */

async function solver() {
    if(activeCircles === 0){
        gameStarted = false;
        end();
        return
    }

    if (gameStarted){
        if (onlyLastRow()){
            let lastRowPattern = [];
            let i = sorok - 1;
            for (let j = 0; j < oszlopok; ++j){
                lastRowPattern.push(allCircles[i][j].active ? 1 : 0)
            }
            //utolsó soros patternek
            let endPatterns = [
                { bot: [0,0,1,1,1], top: [0,0,0,1,0] },
                { bot: [0,1,0,1,0], top: [0,1,0,0,1] },
                { bot: [0,1,1,0,1], top: [1,0,0,0,0] },
                { bot: [1,0,0,0,1], top: [0,0,0,1,1] },
                { bot: [1,0,1,1,0], top: [0,0,0,0,1] },
                { bot: [1,1,0,1,1], top: [0,0,1,0,0] },
                { bot: [1,1,1,0,0], top: [0,1,0,0,0] }
            ]

            let topPattern = null;

            console.log(lastRowPattern)

            for (let i = 0; i < endPatterns.length; ++i){
                let botPattern = endPatterns[i].bot;
                let tf = true;
                for (let j = 0; j < botPattern.length; ++j){
                    if(botPattern[j] !== lastRowPattern[j]){
                        tf = false;
                        break;
                    }
                }

                if(tf){
                    topPattern = endPatterns[i].top;
                    break;
                }
            }

            console.log(topPattern)

            for(let i = 0; i < topPattern.length; ++i){
                if(topPattern[i] === 1){
                    await task(0, i);
                }
            }

           return  solver();
        }else {
            for (let i = 1; i < sorok; ++i) {
                for(let j = 0; j < oszlopok; ++j){
                    if(allCircles[i-1][j].active){
                        await task(i, j);
                    }
                }
            }

           return  solver();
        }
    }
}

function timed(ms) { return new Promise(res => setTimeout(res, ms)); }

async function task(i, j) {
    await timed(1000);
    switchCircle(i, j);
    drawAll()
    console.log(i, j);drawAll();
}

/**
 *  Ez nem is deepcopy, mivel az objektumok trükkösebbek újra kell alkotni a listát az alapkordinátákat az idből fejtem vissza. Ez a függvény készít egy listát új objektumokból, egy másik lista alapján
 * @param masolando a lista ami alapján a másolatot készíti
 * @returns {*[]} az elkészült friss lista
 */
function clone(masolando) {
    let masolt = Array.from(Array(sorok), () => new Array(oszlopok));
    for (let i = 0; i < sorok; i++) {
        for (let j = 0; j < oszlopok; j++) {
            let current = masolando[i][j];
            masolt[i][j] = new Circle(current.active, current.x, current.y);
        }
    }

    return masolt
}

reloadedScores()
startGame()