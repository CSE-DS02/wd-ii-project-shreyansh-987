const { callOpenAI } = require("./openaiClient");

function buildDocumentInstructions(mode, sections) {
  const sectionHint = `Create ${sections} sections: Title, Introduction, Headings, and Conclusion. Use headings and clean paragraph content.`;
  return [
    "You are an AI document intelligence engine.",
    "Return a structured document in plain text with a title and section blocks.",
    "Use this format exactly:\nTitle: <title>\nSection: <heading>\nContent: <content>\n...",
    sectionHint,
    "Do not use markdown fences. Keep content polished and professional."
  ].join(" ");
}

function parseStructuredDocument(rawText) {
  const lines = rawText.split(/\r?\n/);
  const result = { title: "AI Document", sections: [] };
  let currentSection = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const titleMatch = line.match(/^title\s*:\s*(.*)$/i);
    const sectionMatch = line.match(/^section\s*:\s*(.*)$/i);
    const contentMatch = line.match(/^content\s*:\s*(.*)$/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim() || result.title;
      continue;
    }
    if (sectionMatch) {
      if (currentSection) result.sections.push(currentSection);
      currentSection = { heading: sectionMatch[1].trim(), content: "" };
      continue;
    }
    if (contentMatch && currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + contentMatch[1].trim();
      continue;
    }
    if (currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }
  }

  if (currentSection) result.sections.push(currentSection);
  if (!result.sections.length) {
    result.sections.push({ heading: "Overview", content: rawText.trim() });
  }

  return result;
}

async function buildDocument(prompt, mode = "document", targetSections = 4, apiKey, model = "gpt-4.1-mini") {
  const isValidKey = apiKey && typeof apiKey === "string" && apiKey.trim() && !/^your_/.test(apiKey.trim());
  
  if (!isValidKey) {
    return {
      title: prompt.slice(0, 50) || "AI Document",
      sections: [
        { heading: "Overview", content: `This is a local offline document based on: ${prompt}` },
        { heading: "Key Points", content: prompt.split(/[\.\?!]/).slice(0, 2).join(". ") + "." },
        { heading: "Next Steps", content: "Use the AI document generation with a valid OpenAI API key for intelligent content, or enhance this draft with your own text and structure." }
      ]
    };
  }

  const instructions = buildDocumentInstructions(mode, targetSections);
  const messages = [
    { role: "system", content: [{ type: "input_text", text: instructions }] },
    { role: "user", content: [{ type: "input_text", text: prompt.trim() }] }
  ];

  const raw = await callOpenAI(apiKey, model, messages);
  return parseStructuredDocument(raw);
}

module.exports = {
  buildDocument,
  parseStructuredDocument
};
