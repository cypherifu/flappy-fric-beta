import { db } from "./firebaseConfig.js"; // ✅ Import Firestore instance
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

console.log("✅ leaderboard.js loaded successfully!");

// Function to fetch and display the leaderboard from Firestore
async function displayLeaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = ""; // Clear existing leaderboard

    try {
        const leaderboardRef = collection(db, "leaderboard"); // Reference to the Firestore collection
        const q = query(leaderboardRef, orderBy("score", "desc"), limit(10)); // Query top 10 players
        const querySnapshot = await getDocs(q);

        let rank = 1; // Track ranking
        querySnapshot.forEach((doc) => {
            const player = doc.data();
            const li = document.createElement("li");

            // Apply different styles for top 3 ranks
            if (rank === 1) {
                li.classList.add('rank-1');
            } else if (rank === 2) {
                li.classList.add('rank-2');
            } else if (rank === 3) {
                li.classList.add('rank-3');
            }

            li.textContent = `${rank}. ${player.name}: ${player.score} points`;
            leaderboardList.appendChild(li);
            rank++;
        });

        document.getElementById("leaderboardSection").style.display = "block";
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
}

// Load leaderboard when the page is ready
document.addEventListener('DOMContentLoaded', displayLeaderboard);
