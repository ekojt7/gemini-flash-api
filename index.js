// Import necessary modules
const express = require("express"); // Web framework for Node.js
const dotenv = require("dotenv"); // Loads environment variables from a .env file
const multer = require("multer"); // Middleware for handling multipart/form-data (file uploads)
const fs = require("fs"); // Node.js file system module for interacting with the file system
const path = require("path"); // Node.js path module for working with file and directory paths
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Google Generative AI client library

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();
// Enable parsing of JSON request bodies
app.use(express.json());

// Initialize Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Get the generative model (Gemini 1.5 Flash in this case)
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

// Configure Multer for file uploads
// Files will be stored in the 'uploads/' directory
const upload = multer({ dest: "uploads/" });

// Define the port for the server to listen on
const PORT = 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Gemini API server is running at http://localhost:${PORT}`);
});

// Anda akan menambahkan kode ini di file index.js Anda,
// setelah inisialisasi 'app' dan 'model'

app.post("/generate-text", async (req, res) => {
  // Mengekstrak 'prompt' dari body permintaan (request body)
  // Misalnya, jika permintaan JSON adalah { "prompt": "Tuliskan puisi tentang laut" }
  const { prompt } = req.body;

  // Memastikan prompt ada
  if (!prompt) {
    return res
      .status(400)
      .json({ error: "Prompt is required in the request body." });
  }

  try {
    // Mengirim prompt ke model Gemini untuk menghasilkan konten
    const result = await model.generateContent(prompt);

    // Mendapatkan respons dari hasil generasi
    const response = await result.response;

    // Mengirimkan teks hasil generasi sebagai respons JSON
    res.json({ output: response.text() });
  } catch (error) {
    // Menangkap error jika terjadi dan mengirimkan status 500 (Internal Server Error)
    console.error("Error generating text:", error); // Log error untuk debugging
    res.status(500).json({ error: error.message });
  }
});
