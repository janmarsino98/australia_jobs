import * as z from "zod"

// Login form schema
export const loginFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters")
})

// Resume upload schema
export const resumeUploadSchema = z.object({
    file: z.instanceof(File)
        .refine(file => file.size <= 5000000, "File size must be less than 5MB")
        .refine(
            file => ['application/pdf'].includes(file.type),
            "Only PDF files are allowed"
        )
})

// Payment form schema
export const paymentFormSchema = z.object({
    cardNumber: z.string().min(1, "Card number is required"),
    cardExpiry: z.string().min(1, "Expiry date is required"),
    cardCvc: z.string().min(1, "CVC is required"),
})

// Job search form schema
export const jobSearchSchema = z.object({
    title: z.string().optional(),
    location: z.string().optional(),
    categories: z.array(z.string()).optional(),
})

// Location selection schema
export const locationSchema = z.object({
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type ResumeUploadValues = z.infer<typeof resumeUploadSchema>
export type PaymentFormValues = z.infer<typeof paymentFormSchema>
export type JobSearchValues = z.infer<typeof jobSearchSchema>
export type LocationValues = z.infer<typeof locationSchema> 