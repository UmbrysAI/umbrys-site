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

const userVotes = new Map();

window.onload = function () {
  loadConfessions();
};

async function loadConfessions() {
  const confessionWall = document.getElementById("confession-wall");
  confessionWall.innerHTML = ""; // Clear existing confessions

  try {
    // Query Firestore to fetch confessions ordered by timestamp (most recent first)
    const q = query(collection(window.db, "confessions"), orderBy("timestamp", "desc"));
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
      confessionWall.prepend(confessionElement); // Add new confessions to the top
    });
  } catch (error) {
    console.error("Error fetching confessions:", error);
  }
}

let lastSubmissionTime = 0;

async function submitConfession() {
  const cooldownPeriod = 30 * 1000; // 30-second cooldown
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

    // Add new confession to Firestore with the current timestamp
    const docRef = await addDoc(collection(window.db, "confessions"), {
      name,
      confession,
      wisdom,
      upvotes: 0,
      downvotes: 0,
      timestamp: Date.now(),
    });

    // Create the new confession element dynamically
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
    confessionWall.prepend(newConfessionElement); // Ensure the new confession is at the top

    document.getElementById("response").innerText = "Umbrys whispers: 'Your confession has been redeemed in the void.'";
  } catch (error) {
    console.error("Error submitting confession:", error);
    document.getElementById("response").innerText = "Umbrys whispers: 'The void is unresponsive...'";
  }
}

async function voteConfession(button, voteType, docId) {
  const confessionRef = doc(window.db, "confessions", docId);

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
