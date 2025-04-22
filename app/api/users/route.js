// app/api/users/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      id,
      email,
      first_name = '',  // Default empty string
      last_name = '',   // Default empty string
      security_question = 'Google authenticated user',
      security_answer = 'N/A'
    } = body;

    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer.rpc('create_user_account', {
      p_user_id: id,
      p_email: email,
      p_first_name: first_name,
      p_last_name: last_name,
      p_security_question: security_question,
      p_security_answer: security_answer
    });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("User creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Updated PUT method
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseServer
      .from("users")
      .update(body)
      .eq("id", userId)
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    );
  }
}

// Updated DELETE method
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { error } = await supabaseServer
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) throw error;
    return new Response(null, { status: 204 });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}