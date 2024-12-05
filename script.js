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

  // Fetch confessions from Firestore, ordered by timestamp
  const confessions = await window.db.collection("confessions").orderBy("timestamp", "desc").get();
  confessions.forEach((doc) => {
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
}

// Function to submit a confession
async function submitConfession() {
  const name = document.getElementById("name").value.trim();
  const confession = document.getElementById("confession").value.trim();

  // Validation
  if (!confession) {
    document.getElementById("response").innerText =
      "Umbrys whispers: 'The void cannot redeem silence.'";
    return;
  }

  // Restrict confessions to once every 5 seconds
  const lastConfessionTime = localStorage.getItem("lastConfessionTime");
  const now = new Date().getTime();
  if (lastConfessionTime && now - lastConfessionTime < 5 * 1000) {
    const remainingTime = Math.ceil((5 * 1000 - (now - lastConfessionTime)) / 1000);
    document.getElementById("response").innerText = `Umbrys whispers: 'You must wait ${remainingTime} seconds before confessing again.'`;
    return;
  }

  // Save the current time as the last confession time
  localStorage.setItem("lastConfessionTime", now);

  // Generate random wisdom
  const wisdomMessages = [
    "In the shadows, clarity emerges.",
    "Redemption begins with acceptance.",
    "To escape chaos, one must embrace stillness.",
    "Every sin is a lesson waiting to be learned.",
    "Balance is the key to freedom in the web of connections.",
  ];
  const wisdom = wisdomMessages[Math.floor(Math.random() * wisdomMessages.length)];

  // Save confession to Firestore
  const newConfession = await window.db.collection("confessions").add({
    name: name || "Anonymous",
    confession: confession,
    wisdom: wisdom,
    upvotes: 0,
    downvotes: 0,
    timestamp: new Date(),
  });

  // Show response
  document.getElementById("response").innerText = `Umbrys whispers: "${wisdom}"`;

  // Clear form
  document.getElementById("name").value = "";
  document.getElementById("confession").value = "";

  // Add the new confession to the wall without reloading
  const confessionWall = document.getElementById("confession-wall");
  const confessionElement = document.createElement("div");
  confessionElement.className = "confession";
  confessionElement.innerHTML = `
    <p><strong>${name || "Anonymous"}:</strong> ${confession}</p>
    <p><strong>Umbrys says:</strong> ${wisdom}</p>
    <button onclick="voteConfession(this, 'up', '${newConfession.id}')">Upvote <span>0</span></button>
    <button onclick="voteConfession(this, 'down', '${newConfession.id}')">Downvote <span>0</span></button>
  `;
  confessionWall.prepend(confessionElement);
}

// Function to handle upvotes/downvotes
async function voteConfession(button, type, id) {
  const docRef = window.db.collection("confessions").doc(id);
  const confession = await docRef.get();
  const data = confession.data();

  // Check if the user has already voted
  if (userVotes.has(id)) {
    alert("You can only vote once per confession.");
    return;
  }

  // Update votes in Firestore
  const voteType = type === "up" ? "upvotes" : "downvotes";
  const newVotes = (data[voteType] || 0) + 1;
  await docRef.update({ [voteType]: newVotes });

  // Mark this confession as voted
  userVotes.set(id, true);

  // Update the UI
  button.querySelector("span").innerText = newVotes;
}
