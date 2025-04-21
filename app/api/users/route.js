

// app/api/users/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  try {
    // Get user ID from validated session
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user } = body;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Invalid user data" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.given_name || '',
        last_name: user.user_metadata?.family_name || ''
      });

    if (error) throw error;

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: "User creation failed" },
      { status: 500 }
    );
  }
}

    export async function PUT(request) {
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

    export async function DELETE(request) {
            if (!userId) return res.status(401).json({ error: "Unauthorized" });
            const { id } = body;
            const { error } = await supabase.from("users").delete().eq("id", id);
            if (error) return res.status(500).json(error);
            return res.status(204).end();
          }

// Similar improvements for PUT and DELETE methods