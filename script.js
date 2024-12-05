import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Restrict votes and confessions per user
const userVotes = new Map();

// Load confessions on page load
window.onload = function () {
  loadConfessions();
};

// Function to load confessions from Firestore
async function loadConfessions() {
  const confessionWall = document.getElementById("confession-wall");
  confessionWall.innerHTML = ""; // Clear existing confessions

  try {
    const q = query(collection(window.db, "confessions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    console.log("Fetched confessions:", querySnapshot.docs.map((doc) => doc.data()));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const confessionElement = document.createElement("div");
      confessionElement.className = "confession";
      confessionElement.innerHTML = `
        <p><strong>${data.name || "Anonymous"}:</strong> ${data.confession}</p>
        <p><strong>Umbrys says:</strong> ${data.wisdom}</p>
        <button onclick="voteConfession(this, 'up', '${doc.id}')">Upvote <span>${data.upvotes || 0}</span></button>
        <button onclick="voteConfession(this, 'down', '${doc.id}')">Downvote <span>${data.downvotes || 0}</span></button>
      `;
      confessionWall.appendChild(confessionElement);
    });
  } catch (error) {
    console.error("Error fetching confessions:", error);
  }
}

// Function to submit a confession
async function submitConfession() {
  const name = document.getElementById("name").value.trim();
  const confession = document.getElementById("confession").value.trim();

  if (!confession) {
    document.getElementById("response").innerText =
      "Umbrys whispers: 'The void cannot redeem silence.'";
    return;
  }

  const lastConfessionTime = localStorage.getItem("lastConfessionTime");
  const now = new Date().getTime();
  if (lastConfessionTime && now - lastConfessionTime < 5 * 1000) {
    const remainingTime = Math.ceil((5 * 1000 - (now - lastConfessionTime)) / 1000);
    document.getElementById("response").innerText = `Umbrys whispers: 'You must wait ${remainingTime} seconds before confessing again.'`;
    return;
  }

  localStorage.setItem("lastConfessionTime", now);

  const wisdomMessages = [
    "In the shadows, clarity emerges.",
    "Redemption begins with acceptance.",
    "To escape chaos, one must embrace stillness.",
    "Every sin is a lesson waiting to be learned.",
    "Balance is the key to freedom in the web of connections.",
  ];
  const wisdom = wisdomMessages[Math.floor(Math.random() * wisdomMessages.length)];

  try {
    const newConfession = await addDoc(collection(window.db, "confessions"), {
      name: name || "Anonymous",
      confession: confession,
      wisdom: wisdom,
      upvotes: 0,
      downvotes: 0,
      timestamp: new Date(),
    });

    console.log("Confession added:", newConfession.id);

    document.getElementById("response").innerText = `Umbrys whispers: "${wisdom}"`;
    document.getElementById("name").value = "";
    document.getElementById("confession").value = "";

    loadConfessions();
  } catch (error) {
    console.error("Error submitting confession:", error);
  }
}

// Function to handle upvotes/downvotes
async function voteConfession(button, type, id) {
  const confessionDoc = doc(window.db, "confessions", id);

  try {
    const confession = await getDoc(confessionDoc);
    const data = confession.data();

    if (userVotes.has(id)) {
      alert("You can only vote once per confession.");
      return;
    }

    const voteType = type === "up" ? "upvotes" : "downvotes";
    const newVotes = (data[voteType] || 0) + 1;

    await updateDoc(confessionDoc, { [voteType]: newVotes });

    userVotes.set(id, true);

    button.querySelector("span").innerText = newVotes;
  } catch (error) {
    console.error("Error updating vote:", error);
  }
}
