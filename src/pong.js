import Phaser from "phaser";
import ballPath from './vendor/assets/images/ball.png'
import paddlePath from './vendor/assets/images/paddle-horizontal.png'
import party from "party-js"

const canvasParent = document.getElementById('main-canvas')

const isMobile = window.innerWidth < 450
const scaleDownSketch = !isMobile

const config = {
    type: Phaser.AUTO,
    parent: 'main-canvas',
    width: scaleDownSketch ? window.innerWidth / 1.2 : window.innerWidth,
    height: scaleDownSketch ? window.innerHeight / 1.3 : window.innerHeight / 1.2,
    scene: {
        preload,
        create,
        update,
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
        }
    }
};

const game = new Phaser.Game(config);

let player1, ballsGroup, cursors;
let ballGroups = new Map()
let score = 0
let scoreBoard

function updateScore(_, gap) {
    score++
    gap.destroy()

    if (score % 10 == 0) {
        backgroundDay.visible = !backgroundDay.visible
        backgroundNight.visible = !backgroundNight.visible

        if (currentPipe === assets.obstacle.pipe.green)
            currentPipe = assets.obstacle.pipe.red
        else
            currentPipe = assets.obstacle.pipe.green
    }

    updateScoreboard()
}

function preload() {
    this.load.image('ball', ballPath);
    this.load.image('paddle', paddlePath);
}

function create() {

    // openingText
    this.add.text(
        5,
        5,
        'Land on asteroids 🌝',
        {
            fontFamily: 'Monaco, Courier, monospace',
            fontSize: '25px',
            fill: '#fff'
        }
    );

    //Add the scoreboard in
    scoreBoard = this.add.text(
        this.physics.world.bounds.width - 200,
        0,
        "SCORE: 0", { fontSize: '32px', fill: '#fff' });

    this.physics.world.setBoundsCollision(true, true, true, true)

    ballsGroup = this.physics.add.group()
    ballsGroup.enableBody = true;
    // this.platforms.enableBody = true
    // this.platforms.createMultiple(20, "ball")

    // left
    // for (let i = 0; i < 15; i++) {
    //     const tile = ballsGroup.create((i * 32) + 150, 800, 'ball')
    //     tile.body.allowGravity = false
    //     tile.setImmovable(true);

    //     ballGroups.set(tile, 0);
    // }


    // ball.setVisible(false);
    // ball.setScale(2)

    player1 = this.physics.add.sprite(
        Phaser.Math.Between(0, this.physics.world.bounds.width - 80), // x position
        this.physics.world.bounds.height - 200, // y position
        'paddle', // key of image for the sprite
    );

    // player1.setScale(1.7)

    // player2 = this.physics.add.sprite(
    //     this.physics.world.bounds.width / 2, // x position
    //     0, // y position
    //     'paddle', // key of image for the sprite
    // );

    // player2.setScale(1.7)

    cursors = this.input.keyboard.createCursorKeys();

    player1.setCollideWorldBounds(true);
    // player2.setCollideWorldBounds(true);
    // ball.setCollideWorldBounds(true);
    // ball.setBounce(1, 1);
    // player1.setImmovable(true);
    // player2.setImmovable(true);

    const onCollide = (avatar, ballgr) => {
        if (player1.body.onFloor()) {
            const thisBgLanded = ballGroups.get(ballgr);
            if (thisBgLanded == 0) {
                score += 1
                ballGroups.set(ballgr, 1)
                ballgr.setTint("0x33dd33")
                ballgr.setImmovable(false)

                party.confetti(canvasParent)
                scoreBoard.setText('Score: ' + score)
            }
        }
    }

    this.physics.add.collider(player1, ballsGroup, onCollide, null, this);
    // this.physics.add.collider(ball, player2, null, null, this);

    // openingText = this.add.text(
    //     this.physics.world.bounds.width / 2,
    //     this.physics.world.bounds.height / 2,
    //     'Press SPACE to Start',
    //     {
    //         fontFamily: 'Monaco, Courier, monospace',
    //         fontSize: '50px',
    //         fill: '#fff'
    //     }
    // );

    // openingText.setOrigin(0.5);
}

const paddleSpeed = 100
// const ballSpeed = 400
function update(time, delta) {

    player1.body.setAngularVelocity(0);
    player1.body.setVelocity(0, 0);

    // manage events for neck stretches
    if (window.gameUpMove()) {
        // this.physics.velocityFromRotation(player1.rotation, -200, 
        //     player1.body.velocity)
        // player1.body.setVelocity(10, paddle/Speed * -1);
        // this.physics.velocityFromRotation(player1.rotation, 200, player1.body.acceleration)
    } else if (window.gameJumpMove()) {
        const vx = Math.cos(player1.rotation) * 50
        const vy = Math.sin(player1.rotation) * 50
        player1.body.setVelocity(vx, vy);

        // this.physics.velocityFromRotation(player1.rotation, 200,
        //     player1.body.velocity)
    } else if (window.gameLeftMove()) {
        player1.body.setAngularVelocity(100 * -1);
    } else if (window.gameRightMove()) {
        player1.body.setAngularVelocity(100);
    }
}
