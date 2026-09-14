const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (env && env.SURVEY_KV) {
      const data = await env.SURVEY_KV.get("all_surveys");
      return new Response(data || "[]", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response("[]", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const item = await request.json();
    if (!env || !env.SURVEY_KV) {
      return new Response(JSON.stringify({ error: "KV not bound" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await env.SURVEY_KV.get("all_surveys");
    let list = raw ? JSON.parse(raw) : [];

    if (Array.isArray(item)) {
      for (const it of item) {
        const idx = list.findIndex((r) => r.id === it.id);
        if (idx >= 0) list[idx] = it;
        else list.unshift(it);
      }
    } else if (item && item.id) {
      const idx = list.findIndex((r) => r.id === item.id);
      if (idx >= 0) list[idx] = item;
      else list.unshift(item);
    }

    // Gi? t?i da 500 phi?u kh?o sát m?i nh?t
    if (list.length > 500) list = list.slice(0, 500);

    await env.SURVEY_KV.put("all_surveys", JSON.stringify(list));

    return new Response(JSON.stringify({ success: true, count: list.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || !env || !env.SURVEY_KV) {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await env.SURVEY_KV.get("all_surveys");
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((r) => r.id !== id);
    await env.SURVEY_KV.put("all_surveys", JSON.stringify(list));

    return new Response(JSON.stringify({ success: true, count: list.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
