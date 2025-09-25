import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "../../../../lib/supabase/server"
import { loginSchema } from "../../../../lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.errors.map((err) => err.message),
        },
        { status: 400 },
      )
    }

    const { email, password } = validation.data
    const supabase = createServerClient()

    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError)
      return NextResponse.json({ error: "Erro ao carregar perfil do usuário" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user: authData.user,
      profile,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
