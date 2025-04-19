import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// pages/api/users/index.js
import { supabase } from "@/utils/supabase-client";

export default async function handler(req, res) {
  const userId = req.headers.user_id; // for protected GET/PUT/DELETE
  const { method, body } = req;

  switch (method) {
    case "GET": {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) return res.status(500).json(error);
      return res.status(200).json(data);
    }

    

    

    // In POST handler:
case "POST": {
  try {
    const { user } = body;
    if (!user) throw new Error("No user data");

    // Upsert using service key client
    const { error } = await supabaseServer
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.given_name || '',
        last_name: user.user_metadata?.family_name || ''
      });

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: true,
      message: error.message,
      code: error.code
    });
  }
}

    case "PUT": {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { id, ...updates } = body;
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .single();
      if (error) return res.status(500).json(error);
      return res.status(200).json(data);
    }

    case "DELETE": {
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { id } = body;
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) return res.status(500).json(error);
      return res.status(204).end();
    }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
