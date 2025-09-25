import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { requestSchema, validateAndSanitize, sanitizeHtml } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Buscar solicitações do usuário
    const { data: requests, error } = await supabase
      .from("requests")
      .select(`
        *,
        books (
          title,
          author,
          profiles!books_owner_id_fkey (
            name
          )
        ),
        profiles!requests_requester_id_fkey (
          name
        )
      `)
      .or(`requester_id.eq.${user.id},books.owner_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar solicitações:", error)
      return NextResponse.json({ error: "Erro ao buscar solicitações" }, { status: 500 })
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error("Erro na busca de solicitações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId, message } = body

    // Validar mensagem
    const validation = validateAndSanitize(requestSchema, { message })
    if (!validation.success) {
      return NextResponse.json({ error: "Mensagem inválida", details: validation.errors }, { status: 400 })
    }

    const sanitizedMessage = sanitizeHtml(validation.data!.message)
    const supabase = createServerClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Verificar se o livro existe e está disponível
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("available", true)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: "Livro não encontrado ou não disponível" }, { status: 404 })
    }

    // Verificar se o usuário não está solicitando seu próprio livro
    if (book.owner_id === user.id) {
      return NextResponse.json({ error: "Você não pode solicitar seu próprio livro" }, { status: 400 })
    }

    // Verificar se já existe uma solicitação pendente
    const { data: existingRequest } = await supabase
      .from("requests")
      .select("id")
      .eq("book_id", bookId)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json({ error: "Você já tem uma solicitação pendente para este livro" }, { status: 400 })
    }

    // Criar solicitação
    const { data: newRequest, error: requestError } = await supabase
      .from("requests")
      .insert({
        book_id: bookId,
        requester_id: user.id,
        message: sanitizedMessage,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (requestError) {
      console.error("Erro ao criar solicitação:", requestError)
      return NextResponse.json({ error: "Erro ao criar solicitação" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Solicitação enviada com sucesso",
      request: newRequest,
    })
  } catch (error) {
    console.error("Erro ao criar solicitação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
