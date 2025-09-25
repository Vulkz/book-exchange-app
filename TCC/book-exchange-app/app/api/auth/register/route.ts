import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { userRegistrationSchema, sanitizeHtml } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = userRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.errors.map((err) => err.message),
        },
        { status: 400 },
      )
    }

    const { name, email, password, location } = validation.data

    // Sanitizar dados
    const sanitizedName = sanitizeHtml(name)
    const sanitizedLocation = sanitizeHtml(location)

    const supabase = createServerClient()

    // Registrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: sanitizedName, location: sanitizedLocation },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Erro ao criar conta", details: authError?.message || "Usuário não criado" }, { status: 400 })
    }

    // Criar perfil do usuário manualmente após registro
    const { data: profileData, error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      display_name: sanitizedName,
      email,
      location: sanitizedLocation,
      avatar_url: null,
      rating: 5.0,
      total_donations: 0,
      total_received: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single()

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      return NextResponse.json({ error: "Erro ao criar perfil do usuário" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: authData.user,
      profile: profileData,
    })
  } catch (error) {
    console.error("Erro no registro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
