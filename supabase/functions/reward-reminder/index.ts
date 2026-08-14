import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://t.me/Noveaibot/App";
const PRIZE_IMAGE =
  "https://companion-hub-spark.lovable.app/__l5e/assets-v1/29528cfa-ccea-4e87-b841-dfbccaea4e2d/prize-banner.jpg";

const CAPTION =
  "Congratulations! You are user number 37,777 and you won $7,777\n\nJoin the app now and claim your prize\nYou only have a 48 hour window";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN_HELLO") || Deno.env.get("TELEGRAM_BOT_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN_HELLO (or TELEGRAM_BOT_TOKEN) not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: any = {};
  try { body = await req.json(); } catch (_) { /* no body */ }

  let targets: number[] = [];
  if (body?.telegram_id) {
    targets = [Number(body.telegram_id)];
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("telegram_id")
      .not("telegram_id", "is", null);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    targets = (data ?? []).map((p: any) => Number(p.telegram_id)).filter((n) => Number.isFinite(n));
  }

  let sent = 0;
  const failures: { chat_id: number; error: string }[] = [];

  for (const chatId of targets) {
    try {
      const res = await fetch(`${BASE_URL}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: PRIZE_IMAGE,
          caption: CAPTION,
          reply_markup: { inline_keyboard: [[{ text: "Open App", url: APP_URL }]] },
        }),
      });
      const json = await res.json();
      if (json?.ok) sent++;
      else failures.push({ chat_id: chatId, error: json?.description ?? `status ${res.status}` });
    } catch (e) {
      failures.push({ chat_id: chatId, error: String(e) });
    }
    if ((sent + failures.length) % 25 === 0) await new Promise((r) => setTimeout(r, 1000));
  }

  return new Response(JSON.stringify({ ok: true, sent, total: targets.length, failures: failures.slice(0, 20) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
