let spriteSheets = [];
let moving = 0;
let bugs = [];
let bugsNum = 15;
let direction = [-1, 1];
let angles = [0, 1];
let startButton;
let restartButton;
let allSquished = false;

let gameEnd = "GAME OVER\n";
const GameState = {
    Start: "Start",
    Playing: "Playing",
    GameOver: "GameOver"
}
let game = { bugsScore: 0, maxScore: 0, maxTime: 30, elapsedTime: 0, totalBugs: bugsNum, state: GameState.Start };

const sounds = new Tone.Players({
    'spiders': 'sounds/spiders.wav',
})

const delay = new Tone.FeedbackDelay("8n",0.5);
let initTone = true;
function preload() {
    for (let i=0; i<bugsNum; i++) {
        spriteSheets[i] = loadImage("imgs/bug.png");
    }
    
}

function setup() {
    createCanvas(400, 400);
    imageMode(CENTER);
    angleMode(DEGREES);
    sounds.toDestination();
       
    for (let i=0; i<game.totalBugs; i++) {
        bugs[i] = new bugAnimation(spriteSheets[i],80,80,random(100,300),random(100,300),6,random(1.0,2.0),6);
    }

}

function draw() {
    switch(game.state) {
        case GameState.Playing:
            background(220);
            removeElements();
            for (let i=0; i<bugsNum; i++) {
                bugs[i].draw();
            }

            textSize(40);
            text(game.bugsScore,20,30);

            let currTime = game.maxTime - game.elapsedTime;
            textSize(40);
            text(ceil(currTime),320,30);
            game.elapsedTime += deltaTime / 1000;

            if (game.bugsScore === game.totalBugs) {
                allSquished = true;
            }
            
            if (allSquished) {  
                game.state = GameState.GameOver;
            }
            if (currTime < 0) {
                game.state = GameState.GameOver;
            }
            break;

        case GameState.GameOver:
            if (allSquished)
                gameEnd = "YOU WON!\nBugs Squished: " + game.bugsScore;
            else gameEnd = "GAME OVER\nBugs Squished: " + game.bugsScore;
            background(220);
            textSize(20);
            
            text(gameEnd, 100, 100);
            restartButton = createButton('Try Again!');
            restartButton.position(100, 180);
            restartButton.mousePressed(restartGame);
            break;

        case GameState.Start:
            background(220);
            textSize(35);
            text("Welcome to Bug Squish\n", 0, 100);
            
            startButton = createButton('Start Squishing!');
            startButton.position(100, 150);
            startButton.mousePressed(startGame);
            break;
    }

        
}

//Starts a new game
function startGame() {
    game.bugsScore = 0;
    game.elapsedTime = 0;
    game.state = GameState.Playing;
    if (initTone === true) {
        initTone = false;
        Tone.start();
        //sounds.connect(delay);
        sounds.player('spiders').start(0,'0:2');
        sounds.player('spiders').setLoopPoints(0.2, 0.2);
        sounds.player('spiders').loop = true;
        sounds.player('spiders').autostart = true;
    }
}

//Resets the game
function restartGame() {
    location.reload();
}

//Squishes bugs when clicked
function mousePressed() {
    for (let i=0; i<bugsNum; i++) {
        let contains = bugs[i].contains(mouseX, mouseY);
        if (contains) {
            if (bugs[i].moving != 0) {
                bugs[i].squish();
                game.bugsScore++;
                for (let i=0; i<bugsNum; i++) {
                    bugs[i].speed += 0.1;
                }
            }
        }
       
    }
}

//Bugs
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
}