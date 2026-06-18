const OPENAI_URL = "https://api.openai.com/v1/responses";

async function callOpenAI(apiKey, model, messages, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, input: messages })
    });

    const data = await response.json();
    if (!response.ok) {
      const error = data.error?.message || `OpenAI request failed with status ${response.status}`;
      throw new Error(error);
    }

    return extractText(data);
  } finally {
    clearTimeout(timeout);
  }
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
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

module.exports = {
  callOpenAI
};
