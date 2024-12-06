async function generateUmbrysResponse(confession) {
  try {
    const response = await fetch("http://localhost:3000/generate", {
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

// Keep track of the last submission time
let lastSubmissionTime = 0;

async function submitConfession() {
  const cooldownPeriod = 30 * 1000; // 30 seconds cooldown
  const currentTime = Date.now();

  // Check if user is allowed to submit
  if (currentTime - lastSubmissionTime < cooldownPeriod) {
    const waitTime = Math.ceil((cooldownPeriod - (currentTime - lastSubmissionTime)) / 1000);
    document.getElementById("response").innerText = `Umbrys whispers: 'You must wait ${waitTime} seconds before confessing again.'`;
    return;
  }

  // Update last submission time
  lastSubmissionTime = currentTime;

  const name = document.getElementById("name").value.trim();
  const confession = document.getElementById("confession").value.trim();

  if (!confession) {
    document.getElementById("response").innerText = "Umbrys whispers: 'The void cannot redeem silence.'";
    return;
  }

  try {
    // Generate AI response
    const wisdom = await generateUmbrysResponse(confession);

    // Save confession to Firestore
    await addDoc(collection(window.db, "confessions"), {
      name: name || "Anonymous",
      confession: confession,
      wisdom: wisdom,
      upvotes: 0,
      downvotes: 0,
      timestamp: new Date(),
    });

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
