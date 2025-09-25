import { z } from "zod"

// Schemas de validação
export const userRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  email: z.string().email("Email inválido").max(100, "Email deve ter no máximo 100 caracteres"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial",
    ),
  location: z
    .string()
    .min(2, "Localização deve ter pelo menos 2 caracteres")
    .max(100, "Localização deve ter no máximo 100 caracteres"),
})

export const bookSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título deve ter no máximo 200 caracteres").trim(),
  author: z.string().min(1, "Autor é obrigatório").max(100, "Autor deve ter no máximo 100 caracteres").trim(),
  category: z.string().min(1, "Categoria é obrigatória"),
  condition: z.enum(["Excelente", "Bom", "Regular"], {
    errorMap: () => ({ message: "Condição deve ser Excelente, Bom ou Regular" }),
  }),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .trim(),
  isbn: z
    .string()
    .optional()
    .refine((val) => !val || /^(?:\d{10}|\d{13})$/.test(val.replace(/-/g, "")), "ISBN deve ter 10 ou 13 dígitos"),
})

export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(1000, "Mensagem deve ter no máximo 1000 caracteres")
    .trim(),
})

export const requestSchema = z.object({
  message: z
    .string()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(500, "Mensagem deve ter no máximo 500 caracteres")
    .trim(),
})

export const loginSchema = z.object({
  email: z.string().email("Email inválido").max(100, "Email deve ter no máximo 100 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
})

// Função para sanitizar HTML
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Função para validar e sanitizar dados
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => err.message) 
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}