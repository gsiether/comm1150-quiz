exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const { question, week, type } = JSON.parse(event.body);

    const weekTopics = {
      5: "International Trade & Globalisation (comparative advantage, tariffs, quotas, subsidies, sanctions, gains from trade)",
      7: "Economic Growth & Inequality (Solow-Swan model, production function, TFP, human capital, diminishing returns, Gini coefficient)",
      8: "Short-run Fluctuations & Macroeconomic Policy (fiscal policy, multiplier, MPC, consumption function, money, output gap, Phillips curve, monetary policy)"
    };

    const topicContext = weekTopics[week] || "COMM1150 Global Business Environments";

    const prompt =
      "You are a friendly tutor helping a UNSW COMM1150 student who is confused about an economics concept.\n\n" +
      "The student is stuck on this quiz question (Week " + week + " — " + topicContext + "):\n\n" +
      "\"" + question + "\"\n\n" +
      "Explain the underlying concept clearly and simply so the student understands it.\n\n" +
      "Reply ONLY with valid compact JSON — no markdown, no extra text:\n" +
      "{\"concept\":\"short name of the concept being tested\",\"summary\":\"one clear sentence explaining what this concept is\",\"points\":[\"3 to 5 concise bullet points explaining how it works, why it matters, or key distinctions to remember\"],\"example\":\"one brief real-world example that makes it concrete\"}";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: "Anthropic API error" }) };
    }

    const data = await resp.json();
    const text = (data.content[0].text || "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const result = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
