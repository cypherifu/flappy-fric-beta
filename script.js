import { db } from "./firebaseconfig.js"; // ✅ Import Firestore instance
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, setDoc, writeBatch, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const aspectRatio = 2 / 3;
    if (window.innerWidth < 600) {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = canvas.width / aspectRatio;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const fricImg = new Image();
fricImg.src = "./images/fric.png";

const coinImg = new Image();
coinImg.src = "./images/coin.png";

// Settings
let fricSize = 40;
let pipeSpeed = 1.5;
let pipeGap = 200;

const fric = {
    x: 50,
    y: canvas.height / 2,
    width: fricSize,
    height: fricSize,
    gravity: 0.4,
    lift: -8,
    velocity: 0
};

const pipes = [];
const coins = [];
const pipeWidth = 50;
let score = 0;
let coinCount = 0;
let gameOver = false;
let lastTime = 0;
let gameStarted = false;

function startGame() {

    document.body.style.overflow = 'hidden';

    let playerName = document.getElementById("playerName").value.trim();
    if (playerName === "") {
        alert("Enter your friccin name!");
        return;
    }

    document.querySelector(".player-input").style.display = "none";
    document.querySelector(".score-container").style.display = "flex";
    document.getElementById("gameCanvas").style.display = "block";

    gameStarted = true; 
    gameOver = false;
    score = 0;
    coinCount = 0;
    fric.y = canvas.height / 2;
    fric.velocity = 0;
    pipes.length = 0;
    coins.length = 0;
}


// Game loop (now with deltaTime)
function update(deltaTime) {
    if (!gameStarted || gameOver) return;

    // Normalize movement with deltaTime
    fric.velocity += fric.gravity * deltaTime;
    fric.y += fric.velocity * deltaTime;

    // Prevent fric from going off screen
    if (fric.y + fric.height > canvas.height) {
        fric.y = canvas.height - fric.height;
        fric.velocity = 0;
        endGame();
    }
    if (fric.y < 0) {
        fric.y = 0;
        fric.velocity = 0;
        endGame();
    }

    // Update pipes
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= pipeSpeed * deltaTime;

        // Collision detection
        if (
            fric.x < pipes[i].x + pipeWidth &&
            fric.x + fric.width > pipes[i].x &&
            (fric.y < pipes[i].top || fric.y + fric.height > pipes[i].bottom)
        ) {
            endGame();
        }
    }

    // Update coins
    for (let i = 0; i < coins.length; i++) {
        coins[i].x -= pipeSpeed * deltaTime;

        // Collision with fric
        if (
            fric.x < coins[i].x + 20 &&
            fric.x + fric.width > coins[i].x &&
            fric.y < coins[i].y + 20 &&
            fric.y + fric.height > coins[i].y
        ) {
            coins.splice(i, 1);
            coinCount++;
        }
    }

    // Remove off-screen pipes
    if (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
        score++;
    }

    // Add new pipes and coins
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
        let bottomHeight = topHeight + pipeGap;
        pipes.push({
            x: canvas.width,
            top: topHeight,
            bottom: bottomHeight
        });

        // Add coin at a more reachable position
        if (Math.random() < 0.5) {
            coins.push({
                x: canvas.width + 50,
                y: topHeight + pipeGap / 2 - 10
            });
        }
    }
}

function draw() {
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw fric image
    ctx.drawImage(fricImg, fric.x, fric.y, fric.width, fric.height);

    // Draw pipes
    ctx.fillStyle = "green";
    for (let i = 0; i < pipes.length; i++) {
        ctx.fillRect(pipes[i].x, 0, pipeWidth, pipes[i].top);
        ctx.fillStyle = "red";
        ctx.fillRect(pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);
        ctx.fillStyle = "red";
    }

    // Draw coins
    for (let i = 0; i < coins.length; i++) {
        ctx.drawImage(coinImg, coins[i].x, coins[i].y, 20, 20);
    }

    // Update Score and Coins in UI
    document.getElementById("score").textContent = score;
    document.getElementById("coins").textContent = coinCount;
}

function endGame() {
    gameOver = true;

    document.body.style.overflow = 'auto';

    // Get values directly from the UI
    const finalScore = parseInt(document.getElementById('score').textContent);
    const finalFric = parseInt(document.getElementById('coins').textContent);

    // Log the values to check them
    console.log("Final Score: " + finalScore);
    console.log("Final $Fric: " + finalFric);

    // Calculate the Total Score
    const totalScore = finalScore + (finalFric * 2);
    console.log("Total Score: " + totalScore);

    // Display the results in the game-over popup
    document.getElementById('finalScore').textContent = `Score: ${finalScore}`;
    document.getElementById('finalFric').textContent = `$Fric: ${finalFric}`;
    document.getElementById('totalScore').textContent = `Total Point: ${totalScore}`;

    // Get player name
    let playerName = document.getElementById("playerName").value;
    console.log("Player Name before check: " + playerName); // Debugging line

    // If no player name is entered, default to 'Anonymous'
    if (!playerName.trim()) {
        playerName = "Anonymous";
    }

    console.log("Player Name after check: " + playerName); // Debugging line

    // Save to LocalStorage if the player is in the top 10
    saveToLeaderboard(playerName, totalScore);

    // Show the Game Over screen
    document.getElementById("gameOverScreen").style.display = "block";
}

// Toggle leaderboard visibility only when the button is clicked
function toggleLeaderboard() {
    const leaderboardSection = document.getElementById("leaderboardSection");

    if (leaderboardSection.style.display === "none" || leaderboardSection.style.display === "") {
        leaderboardSection.style.display = "block";
        displayLeaderboard();  
    } else {
        leaderboardSection.style.display = "none";  
    }
}

// Display the leaderboard by fetching from Firestore
function displayLeaderboard() {
    console.log("displayLeaderboard called");

    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "";  // Clear previous list items

    const leaderboardRef = firebase.firestore().collection("leaderboard");

    leaderboardRef.orderBy("score", "desc").limit(10).get()
        .then((snapshot) => {
            let leaderboard = [];
            snapshot.forEach((doc) => {
                leaderboard.push(doc.data());
            });

            console.log("Leaderboard data from Firestore:", leaderboard);

            leaderboard.forEach(player => {
                console.log(`Adding player: ${player.name}, ${player.score}`);
                const li = document.createElement("li");
                li.textContent = `${player.name}: ${player.score} points`;
                leaderboardList.appendChild(li);
            });

            document.getElementById("leaderboardSection").style.display = "block";
        })
        .catch((error) => {
            console.error("Error fetching leaderboard from Firestore:", error);
        });
}



async function saveToLeaderboard(playerName, totalScore) {
    console.log("Saving to leaderboard:", playerName, totalScore);

    // ✅ Reference to Firestore leaderboard collection
    const leaderboardRef = collection(db, "leaderboard");

    // ✅ Create a new player object
    const newPlayer = {
        name: playerName,
        score: totalScore,
        timestamp: serverTimestamp() // ✅ Fix timestamp
    };

    try {
        // ✅ Get the top 10 scores using a Firestore query
        const leaderboardQuery = query(leaderboardRef, orderBy("score", "desc"), limit(10));
        const snapshot = await getDocs(leaderboardQuery);

        let leaderboard = [];
        snapshot.forEach((doc) => {
            leaderboard.push({ id: doc.id, ...doc.data() });
        });

        console.log("Current Firestore leaderboard:", leaderboard);

        // ✅ Add the new player to the list
        leaderboard.push(newPlayer);

        // ✅ Sort by score in descending order
        leaderboard.sort((a, b) => b.score - a.score);

        // ✅ Keep only the top 10
        if (leaderboard.length > 10) {
            leaderboard = leaderboard.slice(0, 10);
        }

        // ✅ Write updates using a Firestore batch
        const batch = writeBatch(db);
        leaderboard.forEach((player, index) => {
            if (player.id) {
                batch.update(doc(db, "leaderboard", player.id), { score: player.score });
            } else {
                const newDocRef = doc(collection(db, "leaderboard"));
                batch.set(newDocRef, player);
            }
        });

        await batch.commit();
        console.log("✅ Leaderboard successfully updated in Firestore!");
    } catch (error) {
        console.error("❌ Error updating leaderboard in Firestore: ", error);
    }
}




function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardList.innerHTML = '';

    // Display the top 10 players
    leaderboardData.slice(0, 10).forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} - Total Score: ${player.totalScore}`;
        leaderboardList.appendChild(li);
    });
}



function restartGame() {
    fric.y = canvas.height / 2;
    fric.velocity = 0;
    pipes.length = 0;
    coins.length = 0;
    score = 0;
    coinCount = 0;
    gameOver = false;
    document.getElementById("gameOverScreen").style.display = "none";
}

// Game loop with deltaTime to fix high refresh rate issues
function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 16.67; // 60fps
    lastTime = timestamp;

    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Controls
let lastJumpTime = 0;

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        if (!gameStarted) return; // Prevent jumping before game starts
        if (gameOver) {
            restartGame();
        } else {
            fric.velocity = fric.lift;
        }
    }
});

// Flag to check if the user is interacting with input elements or buttons
let isInteractingWithInput = false;

// Listen for touchstart events on the input fields and buttons
document.querySelectorAll("input, button").forEach(element => {
    element.addEventListener("touchstart", function() {
        isInteractingWithInput = true; 
    });
    element.addEventListener("touchend", function() {
        isInteractingWithInput = false; 
    });
});

// Listen for touchstart events to handle gameplay interactions
document.addEventListener("touchstart", function(event) {
    if (isInteractingWithInput) {
        return;
    }

    event.preventDefault();

    // Handle jump or gameplay action
    const now = Date.now();
    if (now - lastJumpTime > 100) { 
        lastJumpTime = now;

        if (!gameStarted) return;


        if (gameOver) {
            restartGame();
        } else {
            fric.velocity = fric.lift;
        }
    }
}, { passive: false });

// Ensure the player name input field works properly
document.getElementById("playerName").addEventListener("touchstart", function(event) {
    event.stopPropagation();
});


window.startGame = startGame;
