// Canvas and context setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Color variables
const colorRed = "#FF0000";
const colorOrange = "#FFA500";
const colorYellow = "#FFFF00";
const colorGreen = "#00FF00";
const colorCyan = "#00FFFF";

// Constants and configuration
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BALL_SPEED = 5;
const BALL_SIZE = 20;
const BRICK_HEIGHT = 20;
const BRICK_COLORS = [colorRed, colorOrange, colorYellow, colorGreen, colorCyan];
const BRICK_POINTS = [5, 4, 3, 2, 1];
const BUBBLE_RADIUS = 30;
const BUBBLE_DURATION = 1000; // Duration for score bubbles
const PADDLE_DELAY = 250; // Delay in milliseconds for paddle movement in DEV_MODE 2 and 3
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const DEV_MODE = 1; // Set the desired DEV_MODE here

// Brick configuration based on DEV_MODE
let BRICK_ROWS = 5;
let BRICK_COLS = 10;

if (DEV_MODE === 1 || DEV_MODE === 2) {
    BRICK_ROWS = 1;
    BRICK_COLS = 5;
} else if (DEV_MODE === 3) {
    BRICK_ROWS = 5;
    BRICK_COLS = 10;
}

const BRICK_WIDTH = WIDTH / BRICK_COLS;

// Paddle initialization
let paddle = {
    x: WIDTH / 2 - PADDLE_WIDTH / 2,
    y: HEIGHT - PADDLE_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
};

// Brick initialization
let bricks = [];
for (let i = 0; i < BRICK_ROWS; i++) {
    for (let j = 0; j < BRICK_COLS; j++) {
        let brickColorIndex = i % BRICK_COLORS.length; // Use row index for color
        let brick = {
            x: j * BRICK_WIDTH,
            y: i * BRICK_HEIGHT,
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            color: BRICK_COLORS[brickColorIndex],
            points: BRICK_POINTS[brickColorIndex] // Assign points based on color index
        };
        bricks.push(brick);
    }
}

// Ball initialization
let ball = {
    x: WIDTH / 2 - BALL_SIZE / 2,
    y: HEIGHT / 2 - BALL_SIZE / 2,
    dx: Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED,
    dy: BALL_SPEED,
    size: BALL_SIZE
};

// Game state variables
let score = 0;
let scoreBubbles = [];
let startScreen = true;
let gameOver = false;
let startTime = null;

// Load game icon
const gameIcon = new Image();
gameIcon.src = "assets/Game_Icon_Image.png";

// Load Game Sounds
const paddleHitSound = new Audio("assets/paddle_bounce.mp3");
const wallHitSound = new Audio("assets/wall_bounce.mp3");
const brickBreakSound = new Audio("assets/brick_break.mp3");

// Game Results sounds
const gameoverSound = new Audio("assets/wall_bounce.mp3");
const gamewinSound = new Audio("assets/brick_break.mp3");

// Ensure sounds play only after user interaction
let userInteracted = false;

// Add sound for game results
function play_game_result_sound(message) {
    if (message === "You Win!") {
        gamewinSound.play();
    } else {
        gameoverSound.play();
    }
}

// Draw start screen
function draw_start_screen() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(gameIcon, (WIDTH - 250) / 2, (HEIGHT - 250) / 2 - 100, 250, 250);
    ctx.strokeStyle = "#ADD8E6"; // Light Blue
    ctx.lineWidth = 5;
    ctx.strokeRect((WIDTH - 250) / 2 - 5, (HEIGHT - 250) / 2 - 105, 260, 260);
    ctx.font = "30px Helvetica";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("CLICK ANYWHERE TO START", WIDTH / 2, HEIGHT / 2 + 100);
}

// Draw game screen
function draw_game_screen() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Adjust paddle dimensions in DEV_MODE 2 and 3
    const paddleWidth = DEV_MODE === 2 || DEV_MODE === 3 ? PADDLE_WIDTH * 1.25 : PADDLE_WIDTH;
    const paddleHeight = DEV_MODE === 2 || DEV_MODE === 3 ? PADDLE_HEIGHT * 1 : PADDLE_HEIGHT;

    // Draw paddle
    ctx.fillStyle = "blue";
    ctx.fillRect(paddle.x, paddle.y, paddleWidth, paddleHeight);

    // Draw bricks
    bricks.forEach(brick => {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });

    // Draw ball
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw score bubbles
    draw_score_bubbles();
}

// Draw end screen
function draw_end_screen(message) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = message === "You Win!" ? colorGreen : colorRed; // Change to green for win, red for game over
    ctx.font = "50px Helvetica";
    ctx.textAlign = "center";
    ctx.fillText(message, WIDTH / 2, HEIGHT / 2 - 25);
    ctx.font = "30px Helvetica";
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 25);
}

// Move paddle
function move_paddle(event) {
    if (DEV_MODE !== 2 && DEV_MODE !== 3) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        paddle.x = mouseX - PADDLE_WIDTH / 2;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + PADDLE_WIDTH > WIDTH) paddle.x = WIDTH - PADDLE_WIDTH;
    }
}

// Start screen event listener
canvas.addEventListener("click", () => {
    if (startScreen) {
        startScreen = false;
        userInteracted = true; // Set to true after user interaction
        canvas.removeEventListener("click", draw_start_screen);
    }
});

// Ball dynamics function
function ball_dynamics() {
    if (userInteracted) { // Play sounds only if user has interacted
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ball collision with walls
        if (ball.x <= 0 || ball.x >= WIDTH) {
            ball.dx = -ball.dx;
            wallHitSound.play();
        }
        if (ball.y <= 0) {
            ball.dy = -ball.dy;
            wallHitSound.play();
        }
        if (ball.y >= HEIGHT) {
            gameOver = true;
            play_game_result_sound("Game Over!");
            draw_end_screen("Game Over!");
            return;
        }

        // Paddle movement in DEV_MODE 2 and 3
        if (DEV_MODE === 2 || DEV_MODE === 3) {
            setTimeout(() => {
                paddle.x += ball.dx;
                if (paddle.x < 0) paddle.x = 0;
                if (paddle.x + PADDLE_WIDTH > WIDTH) paddle.x = WIDTH - PADDLE_WIDTH;
            }, PADDLE_DELAY);
        }

        detect_paddle_collision();
        detect_brick_collision();
    }
}

// Detect collision with paddle
function detect_paddle_collision() {
    const paddleWidth = DEV_MODE === 2 || DEV_MODE === 3 ? PADDLE_WIDTH * 1.2 : PADDLE_WIDTH;
    const paddleHeight = DEV_MODE === 2 || DEV_MODE === 3 ? PADDLE_HEIGHT * 1.2 : PADDLE_HEIGHT;

    if (
        ball.y + ball.size / 2 > paddle.y &&
        ball.y - ball.size / 2 < paddle.y + paddleHeight &&
        ball.x + ball.size / 2 > paddle.x &&
        ball.x - ball.size / 2 < paddle.x + paddleWidth
    ) {
        ball.dy = -ball.dy;
        ball.y = paddle.y - ball.size / 2;
        paddleHitSound.play();
    }
}

// Detect collision with bricks
function detect_brick_collision() {
    bricks = bricks.filter(brick => {
        if (
            ball.x + ball.size / 2 > brick.x &&
            ball.x - ball.size / 2 < brick.x + brick.width &&
            ball.y + ball.size / 2 > brick.y &&
            ball.y - ball.size / 2 < brick.y + brick.height
        ) {
            ball.dy = -ball.dy;
            score += brick.points; // Add brick points to score
            brickBreakSound.play();
            create_score_bubble(brick);
            return false;
        }
        return true;
    });
}

// Create a score bubble
function create_score_bubble(brick) {
    const bubble = {
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        points: brick.points,
        startTime: Date.now()
    };
    scoreBubbles.push(bubble);
}

// Draw score bubbles
function draw_score_bubbles() {
    const currentTime = Date.now();
    scoreBubbles = scoreBubbles.filter(bubble => {
        const elapsed = currentTime - bubble.startTime;
        if (elapsed < BUBBLE_DURATION) {
            ctx.font = "20px Helvetica";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(bubble.points, bubble.x, bubble.y - (elapsed / BUBBLE_DURATION) * BUBBLE_RADIUS);
            return true;
        }
        return false;
    });
}

// Update bricks remaining display
function update_bricks_remaining_display() {
    if (DEV_MODE === 1 || DEV_MODE === 3) {
        ctx.font = "20px Helvetica";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(`Bricks Remaining: ${bricks.length}`, 10, 30);
    }
}

// Update elapsed time display
function update_elapsed_time_display() {
    if (startTime) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        ctx.font = "20px Helvetica";
        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText(`Time: ${elapsedTime}s`, WIDTH - 10, 30);
    }
}

// Update DEV_MODE display
function update_dev_mode_display() {
    if (startScreen) {
        ctx.font = "20px Helvetica";
        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText(`DEV_MODE: ${DEV_MODE}`, WIDTH - 10, HEIGHT - 10);
    }
}

// Main game loop
function gameLoop() {
    if (!startScreen && !gameOver) {
        if (!startTime) startTime = Date.now();
        ball_dynamics();
        draw_game_screen();
        update_bricks_remaining_display();
        update_elapsed_time_display();
        
        if (bricks.length === 0) {
            gameOver = true;
            play_game_result_sound("You Win!");
            draw_end_screen("You Win!");
        }
    } else if (gameOver) {
        if (!scoreBubbles.length) {
            draw_end_screen(gameOver ? "Game Over!" : "You Win!");
        }
    }
    update_dev_mode_display();
    setTimeout(() => {
        requestAnimationFrame(gameLoop);
    }, 16);
}

// Event listeners
canvas.addEventListener("mousemove", move_paddle);

// Initial call to start screen
draw_start_screen();

// Start the game loop
gameLoop();
