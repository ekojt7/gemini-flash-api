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

// Fungsi helper untuk mengonversi path file gambar menjadi bagian generatif
// yang dapat dikirim ke Gemini API.
function imageToGenerativePart(imagePath, mimeType = null) {
  // Jika mimeType tidak disediakan, coba tebak dari ekstensi file
  if (!mimeType) {
    const ext = path.extname(imagePath).toLowerCase();
    switch (ext) {
      case ".jpeg":
      case ".jpg":
        mimeType = "image/jpeg";
        break;
      case ".png":
        mimeType = "image/png";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
      case ".webp":
        mimeType = "image/webp";
        break;
      default:
        // Default ke jpeg jika tidak dikenal, atau berikan error
        console.warn(
          `Unknown image type for extension: ${ext}. Defaulting to image/jpeg.`
        );
        mimeType = "image/jpeg";
        break;
    }
  }

  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
      mimeType,
    },
  };
}

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

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  // Mendapatkan prompt dari body permintaan, atau menggunakan default 'Describe the image'
  const prompt = req.body.prompt || "Describe the image";

  // Memastikan ada file yang diunggah
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  // Mengubah file yang diunggah menjadi format yang dapat digunakan oleh Gemini API
  const image = imageToGenerativePart(req.file.path, req.file.mimetype);

  try {
    // Mengirimkan prompt dan gambar ke model Gemini
    const result = await model.generateContent([prompt, image]);

    // Mendapatkan respons dari hasil generasi
    const response = await result.response;

    // Mengirimkan teks hasil generasi sebagai respons JSON
    res.json({ output: response.text() });
  } catch (error) {
    // Menangkap error jika terjadi dan mengirimkan status 500 (Internal Server Error)
    console.error("Error generating from image:", error); // Log error untuk debugging
    res.status(500).json({ error: error.message });
  } finally {
    // Pastikan file yang diunggah dihapus setelah selesai, terlepas dari sukses atau gagal
    if (req.file) {
      // Pastikan req.file ada sebelum mencoba menghapus
      fs.unlinkSync(req.file.path);
      console.log(`Deleted uploaded file: ${req.file.path}`);
    }
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    // Mendapatkan path file yang diunggah oleh Multer
    const filePath = req.file.path;

    // Memastikan ada file yang diunggah
    if (!req.file) {
      return res.status(400).json({ error: "No document file uploaded." });
    }

    try {
      // Membaca konten file yang diunggah
      const buffer = fs.readFileSync(filePath);
      // Mengonversi buffer ke string Base64
      const base64Data = buffer.toString("base64");
      // Mendapatkan MIME type dari file yang diunggah
      const mimeType = req.file.mimetype;

      // Membuat bagian dokumen dalam format yang dapat diterima Gemini API
      const documentPart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };

      // Mengirimkan prompt dan bagian dokumen ke model Gemini
      // Anda bisa mengganti 'Analyze this document:' dengan prompt yang lebih spesifik
      const result = await model.generateContent([
        "Analyze this document:",
        documentPart,
      ]);

      // Mendapatkan respons dari hasil generasi
      const response = await result.response;

      // Mengirimkan teks hasil analisis sebagai respons JSON
      res.json({ output: response.text() });
    } catch (error) {
      // Menangkap error jika terjadi dan mengirimkan status 500 (Internal Server Error)
      console.error("Error generating from document:", error); // Log error untuk debugging
      res.status(500).json({ error: error.message });
    } finally {
      // Pastikan file yang diunggah dihapus setelah selesai, terlepas dari sukses atau gagal
      if (req.file) {
        // Pastikan req.file ada sebelum mencoba menghapus
        fs.unlinkSync(filePath);
        console.log(`Deleted uploaded document: ${filePath}`);
      }
    }
  }
);
