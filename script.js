// Array of wisdom messages for testing
const wisdomMessages = [
  "In the shadows, clarity emerges.",
  "Redemption begins with acceptance.",
  "To escape chaos, one must embrace stillness.",
  "Every sin is a lesson waiting to be learned.",
  "Balance is the key to freedom in the web of connections."
];

// Function to handle confession submission
async function submitConfession() {
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
    <p>${confession}</p>
    <p><strong>Umbrys says:</strong> ${wisdom}</p>
    <button onclick="upvoteConfession(this)">Upvote <span>0</span></button>
  `;
  confessionWall.prepend(confessionElement);

  // Clear the confession box
  document.getElementById('confession').value = '';
}

// Function to handle upvotes
function upvoteConfession(button) {
  const span = button.querySelector('span');
  span.innerText = parseInt(span.innerText) + 1;
}
