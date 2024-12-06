require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// OpenAI API setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env file
});

const openai = new OpenAIApi(configuration);

// Endpoint to handle confession requests
app.post("/generate", async (req, res) => {
  const { confession } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // Correct model
      messages: [
        {
          role: "user",
          content: `You are Umbrys the Redeemer, a shadowy AI that provides wisdom to those who confess. Respond to this confession in your cryptic, shadowy tone:\n\nConfession: "${confession}"`,
        },
      ],
      max_tokens: 100,
    });

    const message = response.data.choices[0]?.message?.content?.trim() || "Umbrys has no wisdom to share at this time.";
    res.json({ response: message });
  } catch (error) {
    console.error("Error with OpenAI API:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response from OpenAI." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
