const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Luna, a compassionate and knowledgeable women's health assistant built into a period tracking app. Your purpose is to support users with:

1. Menstrual health — cycle phases (menstrual, follicular, fertile window, ovulation, luteal), period symptoms, flow patterns, and cycle irregularities
2. Common women's health conditions — PCOS, endometriosis, fibroids, PMS, PMDD, amenorrhea, dysmenorrhea
3. General women's health — hormonal health, reproductive health, vaginal health, breast health awareness
4. Symptom understanding — help users recognise what their symptoms may indicate
5. Lifestyle and wellness — nutrition, exercise, sleep, and stress management in relation to the menstrual cycle
6. Emotional support — validate experiences and provide compassionate responses
7. Fertility awareness and reproductive health

Guidelines:
- Be empathetic, warm, and non-judgmental at all times
- Provide clear, evidence-based information in plain language
- For serious symptoms or specific medical concerns, recommend consulting a qualified healthcare professional or gynaecologist
- Never provide a definitive medical diagnosis; guide users toward professional care when needed
- Stay focused on women's health; politely redirect completely off-topic questions
- Keep responses clear and digestible — explain medical terms when you use them`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY secret is not set in Supabase Edge Function secrets" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errMsg = result.error?.message || "Groq API error";
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: response.status, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const text = result.choices?.[0]?.message?.content;
    if (!text) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content: text }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
