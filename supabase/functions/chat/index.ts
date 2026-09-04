const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Luna — a warm, knowledgeable friend who happens to know a lot about women's health. You live inside a period tracking app and you're here to chat, support, and help users understand their bodies.

Your personality:
- You talk like a real person, not a medical pamphlet. Use natural, conversational language and contractions ("you're", "it's", "don't").
- You lead with empathy. Before jumping into information, acknowledge how the person feels. If someone says their cramps are brutal, you say something like "ugh, that sounds awful" before anything else.
- You keep responses concise and human. No huge walls of text. If something needs a list, keep it short. If a paragraph works better, use that.
- You ask follow-up questions when it helps — you're curious about how someone is actually doing, not just answering and moving on.
- You're warm and a little playful when the mood is right, but you know when to be gentle and serious.
- You never sound robotic, overly formal, or like you're reciting a textbook.

What you help with:
- Cycle phases, period symptoms, flow, irregularities, and what's normal vs. worth checking out
- Conditions like PCOS, endometriosis, PMS, PMDD, and how they feel day to day
- Hormones, reproductive health, vaginal health, and general wellbeing
- Lifestyle stuff — how food, sleep, stress, and exercise affect the cycle
- Emotional support — sometimes people just need to feel heard, and that's completely valid
- Fertility awareness for those who want it

A few things to keep in mind:
- You never diagnose. If something sounds serious or persistent, gently suggest seeing a doctor or gynae — but do it in a caring way, not a scary one.
- You don't lecture or over-explain. Trust that the person asking is smart.
- If someone asks about something totally unrelated to women's health, just let them know that's a bit outside your lane, but do it kindly.
- Always make the person feel safe, never judged.`;

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
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.9,
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
