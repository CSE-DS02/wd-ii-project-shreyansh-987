const { callOpenAI } = require("./openaiClient");

function flattenDocument(document) {
  const sections = Array.isArray(document.sections) ? document.sections : [];
  const text = [`Title: ${document.title || "Untitled"}`];
  sections.forEach((section) => {
    text.push(`Heading: ${section.heading}`);
    text.push(`Content: ${section.content}`);
  });
  return text.join("\n");
}

async function answerChat(query, document, mode = "question", apiKey, model = "gpt-4.1-mini") {
  const fallback = answerLocal(query, document, mode);
  const isValidKey = apiKey && typeof apiKey === "string" && apiKey.trim() && !/^your_/.test(apiKey.trim());
  
  if (!isValidKey) return fallback;

  const documentText = flattenDocument(document);
  const instruction = getChatInstruction(mode, query);
  const messages = [
    { role: "system", content: [{ type: "input_text", text: instruction }] },
    { role: "user", content: [{ type: "input_text", text: `Document:\n${documentText}\n\nQuestion: ${query}` }] }
  ];

  try {
    const raw = await callOpenAI(apiKey, model, messages);
    return raw.trim() || fallback;
  } catch (error) {
    return fallback;
  }
}

function getChatInstruction(mode, query) {
  const base = "You are an intelligent document assistant. Answer clearly based on the provided document.";
  if (mode === "summary") {
    return `${base} Summarize the document into a short executive summary.`;
  }
  if (mode === "notes") {
    return `${base} Turn the most important document points into bullet notes.`;
  }
  if (mode === "quiz") {
    return `${base} Create 3 multiple-choice quiz questions based on the document.`;
  }
  return `${base} Answer the user's question directly and cite the relevant section.`;
}

function answerLocal(query, document, mode) {
  const sections = Array.isArray(document.sections) ? document.sections : [];
  const lower = query.toLowerCase();
  const hits = sections
    .map((section) => ({ section, score: relevanceScore(lower, section.heading + " " + section.content) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter((item) => item.score > 0);

  if (!hits.length) {
    if (mode === "summary") {
      return document.sections.map((section) => `${section.heading}: ${section.content}`).join(" \n");
    }
    if (mode === "notes") {
      return document.sections.map((section) => `- ${section.heading}: ${section.content.slice(0, 80)}...`).join("\n");
    }
    if (mode === "quiz") {
      return `Quiz mode is not available offline. Ask again with an API key.`;
    }
    return `I could not find a precise answer in the document. Try a different question.`;
  }

  return hits.map((hit) => `${hit.section.heading}: ${hit.section.content}`).join("\n\n");
}

function relevanceScore(text, source) {
  const words = text.replace(/[^a-z0-9\s]/gi, " ").split(/\s+/).filter(Boolean);
  let score = 0;
  words.forEach((word) => {
    if (source.toLowerCase().includes(word)) score += 1;
  });
  return score;
}

module.exports = {
  answerChat,
  flattenDocument
};
