// Array of wisdom messages for testing
const wisdomMessages = [
  "In the shadows, clarity emerges.",
  "Redemption begins with acceptance.",
  "To escape chaos, one must embrace stillness.",
  "Every sin is a lesson waiting to be learned.",
  "Balance is the key to freedom in the web of connections."
];

// Store user votes to ensure one vote per user
const userVotes = new Map();

// Function to handle confession submission
async function submitConfession() {
  const name = document.getElementById('name').value.trim();
  const confession = document.getElementById('confession').value.trim();

  if (!confession) {
    document.getElementById('response').innerText = "Umbrys whispers: 'The void cannot redeem silence.'";
    return;
  }

  // Simulate AI Response (replace with actual API call later)
  const wisdom = wisdomMessages[Math.floor(Math.random() * wisdomMessages.length)];
  
  document.getElementById('response').innerText = `Umbrys whispers: "${wisdom}"`;

  // Append confession to the wall
  const confessionWall = document.getElementById('confession-wall');
  const confessionElement = document.createElement('div');
  confessionElement.className = 'confession';
  confessionElement.innerHTML = `
    <p><strong>${name || 'Anonymous'}:</strong> ${confession}</p>
    <p><strong>Umbrys says:</strong> ${wisdom}</p>
    <button onclick="voteConfession(this, 'up')">Upvote <span>0</span></button>
    <button onclick="voteConfession(this, 'down')">Downvote <span>0</span></button>
  `;
  confessionWall.prepend(confessionElement);

  // Clear the form
  document.getElementById('name').value = '';
  document.getElementById('confession').value = '';
}

// Function to handle voting (upvote or downvote)
function voteConfession(button, type) {
  const confessionElement = button.closest('.confession');
  const confessionText = confessionElement.querySelector('p').innerText;

  // Check if the user has already voted on this confession
  if (userVotes.has(confessionText)) {
    alert("You can only vote once per confession.");
    return;
  }

  // Mark the confession as voted
  userVotes.set(confessionText, true);

  // Update vote count
  const span = button.querySelector('span');
  const currentVotes = parseInt(span.innerText);
  span.innerText = type === 'up' ? currentVotes + 1 : currentVotes - 1;
}
