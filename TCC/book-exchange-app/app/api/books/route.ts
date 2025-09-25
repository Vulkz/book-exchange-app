import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { bookSchema, validateAndSanitize, sanitizeHtml } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || "all"
    const condition = searchParams.get("condition") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const supabase = createServerClient()

    let query = supabase
      .from("books")
      .select(`
        *,
        profiles!books_owner_id_fkey (
          name,
          location,
          rating
        ),
        categories (
          name
        )
      `)
      .eq("available", true)

    // Aplicar filtros
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
    }

    if (category !== "all") {
      query = query.eq("categories.name", category)
    }

    if (condition !== "all") {
      query = query.eq("condition", condition)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: books, error, count } = await query.range(from, to).order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar livros:", error)
      return NextResponse.json({ error: "Erro ao buscar livros" }, { status: 500 })
    }

    return NextResponse.json({
      books: books || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Erro na busca de livros:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados de entrada
    const validation = validateAndSanitize(bookSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.errors }, { status: 400 })
    }

    const { title, author, category, condition, description, isbn } = validation.data!

    // Sanitizar dados
    const sanitizedTitle = sanitizeHtml(title)
    const sanitizedAuthor = sanitizeHtml(author)
    const sanitizedDescription = sanitizeHtml(description)

    const supabase = createServerClient()

    const userAuth = await supabase.auth.getUser()
    if (!userAuth?.data?.user?.id) {
      return NextResponse.json({ error: "Usuário não autenticado para criar livro" }, { status: 401 })
    }

    // Buscar categoria
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single()

    if (categoryError) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })
    }

    // Inserir livro
    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        title: sanitizedTitle,
        author: sanitizedAuthor,
        category_id: categoryData.id,
        condition,
        description: sanitizedDescription,
        isbn: isbn || null,
        owner_id: userAuth.data.user.id,
        available: true,
        rating: 5.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookError) {
      console.error("Erro ao criar livro:", bookError)
      return NextResponse.json({ error: "Erro ao adicionar livro" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Livro adicionado com sucesso",
      book,
    })
  } catch (error) {
    console.error("Erro ao adicionar livro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
