import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBYToVDrDcTjB5xFPsAGi31_Ar9h90JHFM",
    authDomain: "umbrys-database.firebaseapp.com",
    projectId: "umbrys-database",
    storageBucket: "umbrys-database.firebasestorage.app",
    messagingSenderId: "382151152246",
    appId: "1:382151152246:web:dd3b61060e7ed556658557",
    measurementId: "G-KH28SSHP6E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userVotes = new Map();

window.onload = function () {
    loadConfessions();
};

async function loadConfessions() {
    const confessionWall = document.getElementById("confession-wall");
    confessionWall.innerHTML = ""; // Clear existing confessions

    try {
        const q = query(collection(db, "confessions"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const confessionElement = document.createElement("div");
            confessionElement.className = "confession";
            confessionElement.innerHTML = `
                <div class="confession-text">
                    <p><strong>${data.name || "Anonymous"}:</strong> ${data.confession}</p>
                </div>
                <div class="wisdom-text">
                    <p><strong>Umbrys says:</strong> ${data.wisdom}</p>
                </div>
                <div class="vote-buttons">
                    <button onclick="voteConfession(this, 'up', '${doc.id}')">Upvote <span>${data.upvotes || 0}</span></button>
                    <button onclick="voteConfession(this, 'down', '${doc.id}')">Downvote <span>${data.downvotes || 0}</span></button>
                </div>
            `;
            confessionWall.appendChild(confessionElement); // Append confession to the wall
        });
    } catch (error) {
        console.error("Error fetching confessions:", error);
    }
}

let lastSubmissionTime = 0;

async function submitConfession() {
    const cooldownPeriod = 30 * 1000;
    const currentTime = Date.now();

    if (currentTime - lastSubmissionTime < cooldownPeriod) {
        const waitTime = Math.ceil((cooldownPeriod - (currentTime - lastSubmissionTime)) / 1000);
        document.getElementById("response").innerText = `Umbrys whispers: 'You must wait ${waitTime} seconds before confessing again.'`;
        return;
    }

    lastSubmissionTime = currentTime;

    const name = document.getElementById("name").value.trim();
    const confession = document.getElementById("confession").value.trim();

    if (!confession) {
        document.getElementById("response").innerText = "Umbrys whispers: 'The void cannot redeem silence.'";
        return;
    }

    try {
        const wisdom = await generateUmbrysResponse(confession);

        const docRef = await addDoc(collection(db, "confessions"), {
            name,
            confession,
            wisdom,
            upvotes: 0,
            downvotes: 0,
            timestamp: serverTimestamp(),
        });

        document.getElementById("response").innerText = "Umbrys whispers: 'Your confession has been redeemed in the void.'";

        // Immediately add the new confession to the wall
        const confessionWall = document.getElementById("confession-wall");
        const newConfessionElement = document.createElement("div");
        newConfessionElement.className = "confession";
        newConfessionElement.innerHTML = `
            <div class="confession-text">
                <p><strong>${name || "Anonymous"}:</strong> ${confession}</p>
            </div>
            <div class="wisdom-text">
                <p><strong>Umbrys says:</strong> ${wisdom}</p>
            </div>
            <div class="vote-buttons">
                <button onclick="voteConfession(this, 'up', '${docRef.id}')">Upvote <span>0</span></button>
                <button onclick="voteConfession(this, 'down', '${docRef.id}')">Downvote <span>0</span></button>
            </div>
        `;
        confessionWall.prepend(newConfessionElement); // Add to the top of the wall
    } catch (error) {
        console.error("Error submitting confession:", error);
        document.getElementById("response").innerText = "Umbrys whispers: 'The void is unresponsive...'";
    }
}

async function voteConfession(button, voteType, docId) {
    const confessionRef = doc(db, "confessions", docId);

    try {
        const docSnap = await getDoc(confessionRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const userVoteKey = `${docId}`;

            if (userVotes.has(userVoteKey)) {
                alert("You have already cast your judgment on this confession.");
                return;
            }

            const newCount = (data[voteType + "votes"] || 0) + 1;
            await updateDoc(confessionRef, { [voteType + "votes"]: newCount });

            const voteCountSpan = button.querySelector("span");
            voteCountSpan.textContent = newCount;

            userVotes.set(userVoteKey, voteType);
        } else {
            console.error("No such document!");
        }
    } catch (error) {
        console.error("Error voting on confession:", error);
    }
}

async function generateUmbrysResponse(confession) {
    try {
        const response = await fetch("https://generate-hlm2j6byhq-uc.a.run.app/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ confession }),
        });

        if (!response.ok) {
            console.error("Error from backend:", response.statusText);
            return "Umbrys whispers: 'The shadows are silent today...'";
        }

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error("Error generating response:", error);
        return "Umbrys whispers: 'The void is unresponsive...'";
    }
}

// Attach functions to `window` for global access
window.submitConfession = submitConfession;
window.voteConfession = voteConfession;
