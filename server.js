const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pdfify-ai";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

let mongodbConnected = false;

const { buildDocument } = require("./backend/services/documentBuilder");
const { answerChat } = require("./backend/services/documentChat");
const User = require("./models/User");
const Project = require("./models/Project");
const auth = require("./middleware/auth");
const fileDatabase = require("./fileDatabase");

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    mongodbConnected = true;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Using file-based database for development');
    mongodbConnected = false;
    fileDatabase.loadDatabase(); // Load file database as fallback
  });

function isValidApiKey(key) {
  return typeof key === "string" && key.trim() && !/^your_/.test(key.trim());
}

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname)));

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (mongodbConnected) {
      // Use MongoDB
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } else {
      // Use file-based database
      const existingUser = fileDatabase.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const user = {
        id: Date.now().toString(),
        name,
        email: email.toLowerCase(),
        password: await require('bcryptjs').hash(password, 10),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdAt: new Date().toISOString()
      };

      fileDatabase.users.push(user);
      await fileDatabase.saveDatabase();

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (mongodbConnected) {
      // Use MongoDB
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } else {
      // Use file-based database
      const user = fileDatabase.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      user.lastLogin = new Date().toISOString();
      await fileDatabase.saveDatabase();

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Protected routes
app.get('/api/auth/me', auth, async (req, res) => {
  if (mongodbConnected) {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });
  } else {
    // File-based database user info is already in req.user from auth middleware
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });
  }
});

// Projects routes
app.get('/api/projects', auth, async (req, res) => {
  try {
    if (!mongodbConnected) {
      return res.json({ projects: [] });
    }

    const projects = await Project.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title type updatedAt thumbnail');

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

app.get('/api/projects/recent', auth, async (req, res) => {
  try {
    if (!mongodbConnected) {
      return res.json({ projects: [] });
    }

    const projects = await Project.find({ user: req.user._id })
      .sort({ lastAccessed: -1 })
      .limit(6)
      .select('title type lastAccessed thumbnail');

    res.json({ projects });
  } catch (error) {
    console.error('Get recent projects error:', error);
    res.status(500).json({ error: 'Failed to fetch recent projects.' });
  }
});

app.post('/api/projects', auth, async (req, res) => {
  try {
    if (!mongodbConnected) {
      return res.status(503).json({ error: 'Database not available. Please configure MongoDB.' });
    }

    const { title, description, type, content } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const project = new Project({
      title: title.trim(),
      description: description?.trim() || '',
      type: type || 'document',
      content: content || {},
      user: req.user._id
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully.',
      project: {
        id: project._id,
        title: project.title,
        type: project.type,
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL });
});

app.post("/api/document", auth, async (req, res) => {
  const { prompt, mode = "document", sections = 4 } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Please provide a prompt." });
  }
  try {
    const document = await buildDocument(prompt, mode, Number(sections || 4), OPENAI_KEY, MODEL);
    return res.json(document);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Document generation failed." });
  }
});

app.post("/api/chat", auth, async (req, res) => {
  const { query, document, mode = "question" } = req.body || {};
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: "Please ask a question." });
  }
  if (!document || !document.sections) {
    return res.status(400).json({ error: "Please provide a document to chat with." });
  }
  try {
    const answer = await answerChat(query, document, mode, OPENAI_KEY, MODEL);
    return res.json({ answer });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Chat assistance failed." });
  }
});

app.post("/api/generate", auth, async (req, res) => {
  const { prompt, mode = "write", targetPages = 1 } = req.body || {};

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Please provide a prompt." });
  }

  if (!isValidApiKey(OPENAI_KEY)) {
    return res.json(localGenerate(prompt.trim(), mode, targetPages));
  }

  const instructions = buildInstructions(mode, targetPages);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: instructions }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt.trim() }]
          }
        ]
      })
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed."
      });
    }

    const text = extractText(data).trim();
    if (!text) {
      return res.status(500).json({ error: "The AI returned an empty response." });
    }

    const { title, body } = parseDocument(text, prompt);
    return res.json({ title, text: body });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "The AI request timed out. Please try again." });
    }

    return res.status(500).json({
      error: "Server failed to generate content. Check your API key, model name, and internet connection."
    });
  }
});

app.post("/api/rewrite", auth, async (req, res) => {
  const { text, mode = "formal" } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: "Please provide text to rewrite." });
  }
  if (!isValidApiKey(OPENAI_KEY)) {
    return res.json({ text: localRewrite(String(text), mode) });
  }

  const instructionMap = {
    shorten: "Rewrite the text to be shorter and clearer while preserving key facts.",
    expand: "Rewrite the text to be more detailed and complete while keeping original intent.",
    formal: "Rewrite the text in a professional formal tone.",
    casual: "Rewrite the text in a natural casual conversational tone."
  };
  const instruction = instructionMap[mode] || instructionMap.formal;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: "system", content: [{ type: "input_text", text: `${instruction} Return plain text only.` }] },
          { role: "user", content: [{ type: "input_text", text: String(text) }] }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Rewrite failed." });
    }
    const rewritten = extractText(data).trim();
    if (!rewritten) return res.status(500).json({ error: "AI returned empty rewrite." });
    return res.json({ text: rewritten });
  } catch {
    return res.status(500).json({ error: "Rewrite request failed." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`PDFify AI running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the process using it or set a different PORT environment variable.`);
    process.exit(1);
  }
  throw error;
});

function buildInstructions(mode, targetPages) {
  const pageHint = `Aim for approximately ${Math.max(1, Number(targetPages) || 1)} page(s) of content when exported to A4 PDF format.`;

  if (mode === "document") {
    return [
      "You write polished PDF-ready documents.",
      "Return plain text only.",
      "Start with a single title line in this format: Title: <title>",
      "Then write a structured document with short paragraphs and clear section headings.",
      pageHint,
      "Keep the tone professional and useful.",
      "Do not use markdown code fences."
    ].join(" ");
  }

  return [
    "You help users draft content for documents.",
    "Return plain text only.",
    "Start with a single title line in this format: Title: <title>",
    "Then provide concise, high-quality content based on the user prompt.",
    pageHint,
    "Do not use markdown code fences."
  ].join(" ");
}

function extractText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n");
}

function parseDocument(text, prompt) {
  const lines = text.split(/\r?\n/);
  const titleLine = lines.find((line) => /^title\s*:/i.test(line));
  const title = titleLine
    ? titleLine.replace(/^title\s*:/i, "").trim()
    : prompt.trim().slice(0, 60) || "AI Document";

  const body = lines
    .filter((line, index) => !(index === lines.indexOf(titleLine) && /^title\s*:/i.test(line)))
    .join("\n")
    .trim();

  return {
    title,
    body: body || text.trim()
  };
}

function localGenerate(prompt, mode, targetPages) {
  const title = prompt.split(/[\.\?!]/)[0].trim().slice(0, 60) || "Generated Document";
  const pages = Math.max(1, Number(targetPages) || 1);
  const summary = `This local document is a basic free draft based on your prompt. It does not require an OpenAI subscription and is suitable for quick notes, planning, or draft content.`;

  if (mode === "document") {
    return {
      title,
      text: [
        `Title: ${title}`,
        `Section: Overview`,
        `Content: ${summary} ${prompt}`,
        `Section: Key Points`,
        `Content: ${prompt.slice(0, 120)}...`,
        `Section: Next Steps`,
        `Content: Use this draft to refine the document further with your own text and structure.`
      ].join("\n\n")
    };
  }

  return {
    title,
    text: [
      title,
      summary,
      prompt,
      `Pages requested: ${pages}`
    ].join("\n\n")
  };
}

function localRewrite(text, mode) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (mode === "shorten") {
    return cleaned.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
  }
  if (mode === "expand") {
    return `${cleaned} This expanded version includes extra explanation and detail to make the message clearer and more complete.`;
  }
  if (mode === "casual") {
    return cleaned.replace(/\bdo not\b/gi, "don't").replace(/\byou\b/gi, "you").concat(" :) ");
  }
  return `For a more professional tone: ${cleaned}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`PDFify AI running at http://localhost:${PORT}`);
});
