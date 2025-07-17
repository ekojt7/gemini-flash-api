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
