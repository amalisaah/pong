const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 5;
const AI_SPEED = 3;
const BALL_SPEED = 5;
const WIN_SCORE = 5; // Added for win condition

let leftPaddle = {
    x: 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    velocity: 0
};

let rightPaddle = {
    x: canvas.width - PADDLE_WIDTH - 10,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
};

let ball = {
    x: canvas.width / 2 - BALL_SIZE / 2,
    y: canvas.height / 2 - BALL_SIZE / 2,
    size: BALL_SIZE,
    speedX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    speedY: BALL_SPEED * (Math.random() * 2 - 1)
};

let score = {
    left: 0,
    right: 0
};

let gameOver = false;
let keyboardControl = {
    up: false,
    down: false
};

// Keyboard movement listeners
window.addEventListener('keydown', function(e) {
    if (gameOver) return;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keyboardControl.up = true;
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keyboardControl.down = true;
    }
});

window.addEventListener('keyup', function(e) {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keyboardControl.up = false;
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keyboardControl.down = false;
    }
});

// Update paddle position based on mouse
canvas.addEventListener('mousemove', function (evt) {
    if (gameOver) return;
    if (keyboardControl.up || keyboardControl.down) return; // ignore mouse if keyboard in use
    const rect = canvas.getBoundingClientRect();
    const mouseY = evt.clientY - rect.top;
    leftPaddle.y = mouseY - leftPaddle.height / 2;
    // Clamp within the canvas
    leftPaddle.y = Math.max(Math.min(leftPaddle.y, canvas.height - leftPaddle.height), 0);
});

function resetBall() {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    // Random direction
    ball.speedX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ball.speedY = BALL_SPEED * (Math.random() * 2 - 1);
}

function drawRect(x, y, w, h, color = '#fff') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, size, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, false);
    ctx.fill();
}

function drawNet() {
    ctx.strokeStyle = '#555';
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Net
    drawNet();
    // Paddles
    drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    // Ball
    drawBall(ball.x, ball.y, ball.size);
}

function update() {
    if (gameOver) return;

    // Keyboard paddle move (priority over mouse)
    if (keyboardControl.up) {
        leftPaddle.y -= PADDLE_SPEED;
    }
    if (keyboardControl.down) {
        leftPaddle.y += PADDLE_SPEED;
    }
    // Clamp paddle within canvas
    if (keyboardControl.up || keyboardControl.down) {
        leftPaddle.y = Math.max(Math.min(leftPaddle.y, canvas.height - leftPaddle.height), 0);
    }

    // Ball movement
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Top and bottom collision
    if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
        ball.speedY = -ball.speedY;
        ball.y = Math.max(Math.min(ball.y, canvas.height - ball.size), 0);
    }

    // Left paddle collision
    if (
        ball.x <= leftPaddle.x + leftPaddle.width &&
        ball.y + ball.size >= leftPaddle.y &&
        ball.y <= leftPaddle.y + leftPaddle.height
    ) {
        // Reflect ball, add some "english" based on where it hits the paddle
        ball.speedX = Math.abs(ball.speedX);
        // Add some spin
        let hit = (ball.y + ball.size/2) - (leftPaddle.y + leftPaddle.height/2);
        ball.speedY = hit * 0.2;
    }

    // Right paddle collision
    if (
        ball.x + ball.size >= rightPaddle.x &&
        ball.y + ball.size >= rightPaddle.y &&
        ball.y <= rightPaddle.y + rightPaddle.height
    ) {
        ball.speedX = -Math.abs(ball.speedX);
        let hit = (ball.y + ball.size/2) - (rightPaddle.y + rightPaddle.height/2);
        ball.speedY = hit * 0.2;
    }

    // Score
    if (ball.x < 0) {
        score.right++;
        updateScore();
        checkWin();
        resetBall();
    }
    if (ball.x + ball.size > canvas.width) {
        score.left++;
        updateScore();
        checkWin();
        resetBall();
    }

    // AI movement: follow the ball with max speed limit
    let center = rightPaddle.y + rightPaddle.height / 2;
    if (center < ball.y + ball.size / 2 - 10) {
        rightPaddle.y += AI_SPEED;
    } else if (center > ball.y + ball.size / 2 + 10) {
        rightPaddle.y -= AI_SPEED;
    }
    // Clamp AI paddle
    rightPaddle.y = Math.max(Math.min(rightPaddle.y, canvas.height - rightPaddle.height), 0);
}

function updateScore() {
    document.getElementById('score-left').textContent = score.left;
    document.getElementById('score-right').textContent = score.right;
}

function checkWin() {
    if (score.left >= WIN_SCORE) {
        gameOver = true;
        setTimeout(() => {
            alert("You win!");
            location.reload();
        }, 100);
    } else if (score.right >= WIN_SCORE) {
        gameOver = true;
        setTimeout(() => {
            alert("You lose!");
            location.reload();
        }, 100);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

updateScore();
gameLoop();