//Demo: https://youtu.be/7BHq3wdXYNg
//Game elements//
let spriteSheets=[], spriteSheets2=[], spriteSheets3 = [],spriteSheets4 = [];
let moving = 0;
let bugs=[], otherBugs=[], reverseBugs=[], slowBugs = [], droneBugs = [];
let direction = [-1, 1];
let angles = [0, 1];
let startButton, restartButton, muteButton;
let allSquished = false;
let shaker = 0;
let goodSquish;
let slowMeter, reverseMeter, droneMeter, perkTime;
let spawnReversers = 0;
let spawnDrone = 0;
let droneTime;
let spawnSlows = 0;
let slowers = 3;
let reversers = 3;
let bugDrone;
let activateDrone = false;
let dronePx, dronePy;

//Arduino elements
let port, reader, writer;
let sensorData = {};
let isReading = 0;
let portHolder = 1;
let xMove = 50, yMove = 50;
let xNum = 1, yNum = 1;
let squisherColor;
let bugJuice = false;
const textDecoder = new TextDecoder();

//Game Settings//
let gameLength = 30;
let bugsNum = 20;
let othersNum = 3;
let slowNum = 4
let reverseNum = 4;
let droneNum = 4;
let gameEnd = "GAME OVER\n";
const GameState = {
    Start: "Start",
    Playing: "Playing",
    GameOver: "GameOver"
}
let game = { bugsScore: 0, maxLives: 2, maxScore: 0, maxTime: gameLength, elapsedTime: 0, totalBugs: bugsNum, state: GameState.Start };
let userLife = game.maxLives;

//Sounds and Effects//
//Spiders
const sounds = new Tone.Players({
    'spiders': 'sounds/spiders.wav'
})
const squishSound = new Tone.Player('sounds/squished.wav');

//Missed click effect
const amSynth = new Tone.AMSynth().toDestination();
amSynth.volume.value = 6;

//Gameplay background music
const synth = new Tone.FMSynth().toDestination();
const loopS = new Tone.Loop(time => {
    synth.triggerAttackRelease("C2","8n", time);
}, "4n");

//Menu music
const menuMusic = new Tone.Sequence((time, note) => {
	synth.triggerAttackRelease(note, 0.1, time);
}, ["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]]);
menuMusic.playbackRate = 0.5;

let reverbVal = 0;
const mReverb = new Tone.JCReverb(0.4);
const delay = new Tone.FeedbackDelay("8n",0.5);
let initTone = true;

//Start Background Image
let bg;

function preload() {
    for (let i=0; i<bugsNum; i++) {
        spriteSheets[i] = loadImage("imgs/bug.png");
    }
    for (let i=0; i<bugsNum; i++) {
        spriteSheets2[i] = loadImage("imgs/slow.png");
    }
    for (let i=0; i<bugsNum; i++) {
        spriteSheets3[i] = loadImage("imgs/seeker.png");
    }
    for (let i=0; i<bugsNum; i++) {
        spriteSheets4[i] = loadImage("imgs/sentinel.png");
    }
}

function setup() {
    bg = loadImage('imgs/gard.png');
    createCanvas(1920, 1080);
    imageMode(CENTER);
    angleMode(DEGREES);
    sounds.connect(delay);
    sounds.connect(mReverb);
    delay.toDestination();
    mReverb.toDestination();

    //Menu Music//
    if (game.state === GameState.Start)
    {
        menuMusic.start(0);
        Tone.Transport.start();
    }else menuMusic.mute = true;

    squishSound.toDestination();

    for (let i=0; i<game.totalBugs; i++) {
        bugs[i] = new bugAnimation(spriteSheets[i],80,80,random(100,300),random(100,300),6,random(1.0,3.0),6);
    }
    for (let i=0; i<reverseNum; i++) {
        reverseBugs[i] = new bugAnimation(spriteSheets3[i],80,80,random(100,300),random(100,300),6,random(1.0,2.0),6);
    }
    for (let i=0; i<othersNum; i++) {
        otherBugs[i] = new bugAnimation(spriteSheets[i],80,80,random(100,300),random(100,300),6,random(1.0,2.0),6);
    }
    for (let i=0; i<slowNum; i++) {
        slowBugs[i] = new bugAnimation(spriteSheets2[i],80,80,random(100,300),random(100,300),6,random(1.0,2.0),6);
    }
    for (let i=0; i<droneNum; i++) {
        droneBugs[i] = new bugAnimation(spriteSheets4[i],80,80,random(100,300),random(100,300),6,random(1.0,2.0),6);
    }

    bugDrone = new Drone();
    droneTime = 25;  //random time drone bug spawns
}

function draw() {
    switch(game.state) {
        case GameState.Playing:
            resizeCanvas(600, 600);
            let c = color(0, 200, 0);
            background(c);
            removeElements();

            //Game Time//
            let currTime = game.maxTime - game.elapsedTime;
            textSize(40);
            text(ceil(currTime),320,30);
            game.elapsedTime += deltaTime / 1000;

            //Drawbugs//
            for (let i=0; i<bugsNum; i++) {
                bugs[i].draw();
            }

            //Draw reverse bugs if meter full and arduino y(red) button pressed//
            if (spawnReversers) {
                for (let i=reversers; i<reverseNum; i++) {
                    reverseBugs[i].draw();
                }
                reverseMeter = false;
            }
            if (sensorData.xButton === 1 && reverseMeter) {
                spawnReversers = true;
            }

            //Draw drone bugs if meter full and both arduino buttons pressed//
            if (spawnDrone ) {
                for (let i=3; i<droneNum; i++) {
                    droneBugs[i].draw();
                };
                droneMeter = false;
            }
            if (sensorData.yButton === 1 && droneMeter && sensorData.xButton === 1) {
                spawnDrone = true;
            }
            
            //Spawns drone for 9 seconds if drone bug is squished//
            if (activateDrone && currTime<=perkTime && currTime>=perkTime-8 ) {
                bugDrone.draw();
                bugDrone.activate();
            }else {
                activateDrone = false;
                bugDrone.deActivate();
            }

            //Draw slow bugs if meter full and arduino x(blue) button pressed//
            if (spawnSlows) {
                
                for (let i=slowers; i<slowNum; i++) {
                    slowBugs[i].draw();
                }
                slowMeter = false;
            }
            if (sensorData.yButton === 1 && slowMeter) {
                spawnSlows = true;
            }

            //send data to arduino board//
            if (reader) {
                serialRead();
            }
            
            //Perk meter Icons//
            push();
            if (slowMeter) {
                squisherColor = color(0, 0, 255);
            }
            else squisherColor = color(0, 0, 0);
            fill(squisherColor);
            noStroke();
            ellipse(90, 10, 20, 20);
            pop();
            push();
            if (reverseMeter) {
                squisherColor = color(255, 0, 0);
            }
            else squisherColor = color(0, 0, 0);
            fill(squisherColor);
            noStroke();
            ellipse(140, 10, 20, 20);
            pop();
            push();
            if (droneMeter) {
                squisherColor = color(180, 0, 180);
            }
            else squisherColor = color(0, 0, 0);
            fill(squisherColor);
            noStroke();
            ellipse(190, 10, 20, 20);
            pop();
            
            //Score//
            textSize(40);
            text(game.bugsScore,20,30);

            //Lives//
            textSize(10);
            text('Lives: '+ userLife,20,50);

            //Result Checker//
            if (game.bugsScore === game.totalBugs) {
                allSquished = true;
                if (writer) {
                    writer.write(new Uint8Array([ 4 ]));
                }
            }

            //Slow Perk Meter//
            if (game.bugsScore>1 && game.bugsScore%5===0) {
                slowMeter = true;
                if (writer) {
                    writer.write(new Uint8Array([ 2 ]));
                }
            }else {
                if (writer) {
                    writer.write(new Uint8Array([ 12 ]));
                }
                slowMeter = false;
            }

            //Seeker Perk Meter//
            if (game.bugsScore>1 && game.bugsScore%8===0) {
                reverseMeter = true;
                if (writer) {
                    writer.write(new Uint8Array([ 3 ]));
                }
            }else {
                if (writer) {
                    writer.write(new Uint8Array([ 13 ]));
                }
                reverseMeter = false;
            }

            //Drone Meter
            if (currTime<=droneTime && currTime>=droneTime-5) {
                droneMeter = true;
                textSize(10);
                text('Drone ready',100,70);
                if (writer) {
                    writer.write(new Uint8Array([ 5 ]));
                }
            }else {
                if (writer) {
                    writer.write(new Uint8Array([ 15 ]));
                }
                droneMeter = false;
            }

            //Game Over Checker//
            if (allSquished) {  
                game.state = GameState.GameOver;
            }
            if (currTime < 0) {
                synth.frequency.value = 1;
                game.state = GameState.GameOver;
            }
            if (userLife <= 0) {
                game.state = GameState.GameOver;
            }

            //Bug Reinforcements Checker and Missed Squished Penalty//
            if (shaker>2) {
                textSize(10);
                text('11 missed squishes awakens sleepers and takes a life, avoid them!',100,40);
            }
            if (currTime < 15) {
                synth.frequency.value += 0.1;
                if (writer) {
                    writer.write(new Uint8Array([ 1 ]));
                }
                if (shaker>10) {
                    textSize(10);
                    text('Sleepers!!!!!',100,40);
                    synth.volume.value += 0.005;
                    for (let i=0; i<othersNum; i++) {
                        otherBugs[i].draw();
                    }
                }
            }
            break;

        case GameState.GameOver:
            resizeCanvas(600, 600);
            let d = color(0, 200, 0);
            background(d);
            removeElements()
            sounds.mute = true;
            if (allSquished)
                gameEnd = "YOU WON!\nBugs Squished: " + game.bugsScore;
            else gameEnd = "GAME OVER\nBugs Squished: " + game.bugsScore;
            textSize(20);
            text(gameEnd, 100, 100);
            restartButton = createButton('Try Again!');
            restartButton.position(100, 180);
            restartButton.mousePressed(restartGame);
            break;

        case GameState.Start:
            resizeCanvas(1920, 1080);
            background(bg);
            textSize(35);
            text("Welcome to Bug Squish\n", 0, 100);
            startButton = createButton('Start Squishing!');
            startButton.position(100, 150);
            startButton.mousePressed(startGame);

            //connect to arduino, needed to use perks and drones//
            if ('serial' in navigator) {
                let button = createButton('Connect Arduino');
                button.position(96, 200);
                button.mousePressed(connect);
            }

            //mutes and unmutes menu music//
            if (!menuMusic.mute){
                muteButton = createButton('Mute');
            }
            else if(menuMusic.mute){
                muteButton = createButton('Undo');
            }
            muteButton.position(95, 240);
            muteButton.mousePressed(()=>muteMusic());
            break;
    }

        
}

async function connect() {
    port = await navigator.serial.requestPort();
  
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    
    reader = port.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TransformStream(new LineBreakTransformer()))
    .getReader();
  
}

//Read
async function serialRead() {
    while(true) {
      isReading = 1;
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      
      sensorData = JSON.parse(value);
      console.log(sensorData);
    }
    
}

//Starts a new game
function startGame() {
    game.bugsScore = 0;
    game.elapsedTime = 0;
    game.state = GameState.Playing;
    menuMusic.mute = true;
    if (initTone === true) {
        initTone = false;
        Tone.start();
        Tone.Transport.start();
        loopS.start("8n");
        sounds.player('spiders').start(0,'0:3');
        sounds.player('spiders').restart('+0.7','0:3');
        sounds.player('spiders').setLoopPoints(0.9, 0.9);
        sounds.player('spiders').loop = true;
        sounds.player('spiders').autostart = true;
    }
}

//Resets the game
function restartGame() {
    location.reload();
    game.state = GameState.Start;
    sounds.player('spiders').restart();
    sounds.player('spiders').stop();
    sounds.player('spiders').loop = false;
    sounds.player('spiders').autostart = false;
    loopS.stop();
    initTone = true;
}

//Stops Menu Music
function muteMusic() {
    if (menuMusic.mute === false) {
        menuMusic.mute = true;
    }
    else {
        menuMusic.mute = false;
    }
}

function mousePressed() {
    let bugClicked = false;
    
    //squishes bugs if clicked, triggers perk effects
    if (game.state != GameState.Start && game.state != GameState.GameOver)
    {
        for (let i=0; i<bugsNum; i++) {
            let contains = bugs[i].contains(mouseX, mouseY);
            if (contains) {
                bugClicked = true;
                if (bugs[i].moving != 0) {
                    bugs[i].squish();
                    squishSound.start();
                    game.bugsScore++;
                    sounds.player('spiders').playbackRate += 0.04;
                    sounds.player('spiders').volume.value ++;
                    for (let i=0; i<bugsNum; i++) {
                        bugs[i].speed += 0.1;
                    }
                }
            }
        }
        
        //squish sleepers
        for (let i=0; i<3; i++) {
            let contains = otherBugs[i].contains(mouseX, mouseY);
            if (contains) {
                bugClicked = true;
                if (otherBugs[i].moving != 0) {
                    otherBugs[i].squish();
                    squishSound.start();
                    game.bugsScore++;
                    sounds.player('spiders').playbackRate += 0.04;
                    sounds.player('spiders').volume.value ++;
                }
            }
        }
    
        //slows other bugs if clicked//
        if (spawnSlows)
        {
            for (let i=0; i<slowNum; i++) {
                let contains = slowBugs[i].contains(mouseX, mouseY);
                if (contains) {
                    bugClicked = true;
                    if (slowBugs[i].moving != 0) {
                        slowBugs[i].squish();
                        squishSound.start();
                        sounds.player('spiders').playbackRate += 0.04;
                        sounds.player('spiders').volume.value ++;
                        slowed();
                        if (writer) {
                            writer.write(new Uint8Array([ 12 ]));
                        }
                    }
                }
            }
        }

        //movable drone that squishes bugs//
        if (spawnDrone)
        {
            for (let i=0; i<droneNum; i++) {
                let contains = droneBugs[i].contains(mouseX, mouseY);
                if (contains) {
                    bugClicked = true;
                    if (droneBugs[i].moving != 0) {
                        droneBugs[i].squish();
                        dronePx = droneBugs[i].dx;
                        dronePy = droneBugs[i].dy;
                        squishSound.start();
                        sounds.player('spiders').playbackRate += 0.04;
                        sounds.player('spiders').volume.value ++;
                        activateDrone = true;
                        perkTime = game.maxTime - game.elapsedTime;
                        if (writer) {
                            writer.write(new Uint8Array([ 15 ]));
                        }
                    }
                }
            }
        }

        //adds 3 seconds to game time
        if (spawnReversers)
        {
            for (let i=0; i<reverseNum; i++) {
                let contains = reverseBugs[i].contains(mouseX, mouseY);
                if (contains) {
                    bugClicked = true;
                    if (reverseBugs[i].moving != 0) {
                        reverseBugs[i].squish();
                        squishSound.start();
                        // game.bugsScore++;
                        sounds.player('spiders').playbackRate += 0.04;
                        sounds.player('spiders').volume.value ++;
                        reversed();
                        // for (let i=0; i<bugsNum; i++) {
                        //     seekerBugs[i].speed += 0.2;
                        // }
                        if (writer) {
                            writer.write(new Uint8Array([ 13 ]));
                        }
                    }
                }
            }
        }

        //missed clicks and user life penalty//
        if (!bugClicked)
        {
            shaker++;
            amSynth.triggerAttackRelease("G#3", 0.1);
        }else bugClicked = false;
        if (shaker%11===0 && shaker>1) {
            userLife--;
        }
    } 
}

//slows other bugs//
function slowed() {
    for (let i=0; i<bugsNum; i++) {
        if (bugs[i].isSlowed()){
            bugs[i].slowed = false;
        }
    }
    for (let i=0; i<bugsNum; i++) {
        if (!bugs[i].isSlowed()){
            bugs[i].slowed = true;
            bugs[i].speed -= 1;
        }
    }
    slowMeter = false;
    spawnSlowers = false;
}

//increases time left//
function reversed() {
    game.maxTime += 3;
    console.log(maxTime + " " + game.elapsedTime);
    spawnReversers = false;
    reverseMeter = false;
}

//Present analog data as JSON
class LineBreakTransformer {
    constructor() {
      // A container for holding stream data until a new line.
      this.chunks = "";
    }
  
    transform(chunk, controller) {
      // Append new chunks to existing chunks.
      this.chunks += chunk;
      // For each line breaks in chunks, send the parsed lines out.
      const lines = this.chunks.split("\r\n");
      this.chunks = lines.pop();
      lines.forEach((line) => controller.enqueue(line));
    }
  
    flush(controller) {
      // When the stream is closed, flush any remaining chunks out.
      controller.enqueue(this.chunks);
    }
}

//Bugs//
class bugAnimation {
    constructor(spriteSheet, sw, sh, dx, dy, animationLength, speed, framerate) {
        this.spriteSheet = spriteSheet;
        this.sw = sw;
        this.sh = sh;
        this.dx = dx;
        this.dy = dy;
        this.u = 0;
        this.v = 0;
        this.animationLength = animationLength;
        this.currentFrame = 0;
        this.moving = 1;
        this.xDirection = random(direction);
        this.speed = speed;
        this.framerate = framerate*speed;
        this.squished = 0;
        this.vertical = random(angles);
        this.slowed = false;
    }

    draw() {
        this.u = (this.moving != 0) ? this.currentFrame % this.animationLength : 0;
        push(); 
        translate(this.dx, this.dy);
        if (this.vertical) {
            rotate(90);
        }
        scale(this.xDirection,1);

        if (!this.squished)
            image(this.spriteSheet,0,0,this.sw,this.sh,this.u*this.sw,this.v*this.sh,this.sw,this.sh);
        else image(this.spriteSheet,0,0,this.sw,this.sh,5*this.sw,this.v*this.sh,this.sw,this.sh);
        
        pop();
        let proportionalFramerate = round(frameRate() / this.framerate);
        if (frameCount % proportionalFramerate == 0) {
            if (this.currentFrame == 3)
                this.currentFrame = 0;
            this.currentFrame++;
        }

        if (!this.squished && !this.vertical) 
        {   
            if (this.xDirection == -1) {
                this.moving = -1;
            }
            if (this.dx > width) {
                this.moveLeft();
            }else if (this.dx < 0) {
                this.moveRight();
            }
            this.dx += this.moving*this.speed;
        }else if  (!this.squished && this.vertical) {
            if (this.xDirection == -1) {
                this.moving = -1;
            }
            if (this.dy > height) {
                this.moveUp();
            }else if (this.dy < 0) {
                this.moveDown();
            }
            this.dy += this.moving*this.speed;
        }
    }
    
    moveRight() {
        this.squished = 0;
        this.moving = 1;
        this.xDirection = 1;
    }
 
    moveLeft() {
        this.squished = 0;
        this.moving = -1;
        this.xDirection = -1;
    }

    moveUp() {
        this.squished = 0;
        this.moving = -1;
        this.xDirection = -1;
    }

    moveDown() {
        this.squished = 0;
        this.moving = 1;
        this.xDirection = 1;
    }

    contains(x, y) {
        let insideX, insideY  = 0;
        if (!this.vertical)
        {
            if (this.xDirection == -1) {
                insideX = x >= this.dx + 20 && x <= this.dx + 38;
                insideY = y >= this.dy - 38 && y <= this.dy - 8;
            }else {
                insideX = x >= this.dx - 38 && x <= this.dx - 20;
                insideY = y >= this.dy - 38 && y <= this.dy - 8;
            }
        }else {
            if (this.xDirection == -1) {
                insideX = x >= this.dx + 10 && x <= this.dx + 38;
                insideY = y >= this.dy + 16 && y <= this.dy + 38;
            }else {
                insideX = x >= this.dx + 10 && x <= this.dx + 38;
                insideY = y >= this.dy - 38 && y <= this.dy - 16;
            }
        }
        
        return insideX && insideY;
    }

    squish() {
        this.squished = 1;
        this.moving = 0;
    }

    isSlowed() {
        return this.slowed;
    }
}

//Drone
class Drone {
    constructor() {
        this.color = color(200,0,200);
        this.xPos = 50;
        this.yPos = 50;
        if (dronePx!=null)
            this.xPos = dronePx;
        if (dronePy!=null)
            this.yPos = dronePy;
        this.squisherColor = 0;
        this.juice;
        this.attacked = false;
        this.xNum = 1;
        this.yNum = 1;
        this.active = false;
    }

    draw() {
        this.active = true;
        push();
        if (this.attacked) {
            fill(this.juice);
        }
        else fill(this.color);
        if (dronePx!=null)
        {
            this.xPos = dronePx;
            dronePx = null;
        }
        if (dronePy!=null) {
            this.yPos = dronePy;
            dronePy = null;
        }
        ellipse(this.xPos, this.yPos, 20, 20);
        pop();
    }

    deActivate() {
        this.active = false;
    }

    activate() {
        if (this.isActive()) 
        {
            this.moveLeft();    
            this.moveRight();
            this.squishBug();
            this.bounds();  //sets boundaries drone
        }
       
    }

    isActive() {
        return this.active;
    }

    //change x and y direction by hitting boundaries
    bounds() {
        if (this.yPos >= height) {
            this.yNum = -Math.abs(this.yNum);
        }else if (this.yPos <= 0) {
            this.yNum = Math.abs(this.yNum);
        }
        if (this.xPos >= width) {
            this.xNum = -Math.abs(this.xNum);;
        }else if (this.xPos <= 0) {
            this.xNum = Math.abs(this.xNum);;
        }
    }

    moveRight() {
        if (sensorData.xButton === 1) {
            this.xPos += this.xNum;
        }
    }

    moveLeft() {
        if (sensorData.yButton === 1) {
            this.yPos += this.yNum;
        }
    }
    
    squishBug() {
        if (game.state === GameState.Playing)
        {
            for (let i=0; i<bugsNum; i++) {
                let contains = bugs[i].contains(this.xPos, this.yPos);
                if (contains) {
                    if (bugs[i].moving != 0) {
                        this.juice = color(0,180,0);
                        bugs[i].squish();
                        game.bugsScore++;
                        squishSound.start();
                        sounds.player('spiders').playbackRate += 0.04;
                        sounds.player('spiders').volume.value ++;
                            
                        for (let i=0; i<bugsNum; i++) {
                            bugs[i].speed += 0.1;
                        }
                        this.attacked = true;
                    }
                }
            }

                    
            for (let i=0; i<3; i++) {
                let contains = otherBugs[i].contains(this.xPos, this.yPos);
                if (contains) {
                    if (otherBugs[i].moving != 0) {
                        this.juice = color(0,180,0);
                        otherBugs[i].squish();
                        squishSound.start();
                        game.bugsScore++;
                        sounds.player('spiders').playbackRate += 0.04;
                        sounds.player('spiders').volume.value ++;
                    }
                    this.attacked = true;
                }
            }

            if (spawnSlows)
            {
                for (let i=0; i<slowNum; i++) {
                    let contains = slowBugs[i].contains(this.xPos, this.yPos);
                    if (contains) {
                        if (slowBugs[i].moving != 0) {
                            slowBugs[i].squish();
                            squishSound.start();
                            sounds.player('spiders').playbackRate += 0.04;
                            sounds.player('spiders').volume.value ++;
                            slowed();
                            if (writer) {
                                writer.write(new Uint8Array([ 12 ]));
                            }
                        }
                        this.attacked = true;
                    }
                    
                }
            }

            if (spawnReversers)
            {
                for (let i=0; i<reverseNum; i++) {
                    let contains = reverseBugs[i].contains(this.xPos, this.yPos);
                    if (contains) {
                        if (reverseBugs[i].moving != 0) {
                            reverseBugs[i].squish();
                            squishSound.start();
                            sounds.player('spiders').playbackRate += 0.04;
                            sounds.player('spiders').volume.value ++;
                            reversed();
                            if (writer) {
                                writer.write(new Uint8Array([ 13 ]));
                            }
                        }
                        this.attacked = true;
                    }
                
                }
            }
        }
    }
}
