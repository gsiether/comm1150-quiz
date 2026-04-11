exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const { question, keywords, modelAnswer, studentAnswer } = JSON.parse(event.body);

    const prompt =
      "You are marking a student short answer for a COMM1150 Global Business Environments exam at UNSW Australia.\n\n" +
      "Question: " + question + "\n\n" +
      "Key concepts expected: " + keywords.join(", ") + "\n\n" +
      "Model answer for reference: " + modelAnswer + "\n\n" +
      "Student wrote: \"" + studentAnswer.replace(/"/g, "'") + "\"\n\n" +
      "Mark out of 3:\n" +
      "3 = covers all key concepts with clear understanding\n" +
      "2 = covers most concepts but lacks depth or misses something important\n" +
      "1 = some relevant ideas but significant gaps\n" +
      "0 = largely off track or missing key concepts\n\n" +
      "Reply ONLY with valid compact JSON — no markdown, no extra text:\n" +
      "{\"mark\":0,\"covered\":[\"what student addressed well\"],\"improve\":[\"specific thing to add or develop\"],\"feedback\":\"One sentence overall assessment\"}";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 450,
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
