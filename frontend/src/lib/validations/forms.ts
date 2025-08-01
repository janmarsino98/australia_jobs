import * as z from "zod"
import DOMPurify from 'dompurify';

// Custom sanitizer function
const sanitizeString = (value: string) => DOMPurify.sanitize(value.trim());

// Login form schema
export const loginFormSchema = z.object({
    email: z.string()
        .email("Please enter a valid email address")
        .transform(sanitizeString),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),
    rememberMe: z.boolean().optional().default(false)
});

export const resetPasswordRequestSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
    code: z.string().min(6, "Please enter the 6-digit code").max(6, "Code must be exactly 6 digits"),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// Payment form schema
export const paymentFormSchema = z.object({
    cardName: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters")
        .transform(sanitizeString),
    billingAddress: z.object({
        line1: z.string().min(1, "Address is required").transform(sanitizeString),
        line2: z.string().optional().transform(val => val ? sanitizeString(val) : val),
        city: z.string().min(1, "City is required").transform(sanitizeString),
        state: z.string().min(1, "State is required").transform(sanitizeString),
        postalCode: z.string()
            .regex(/^\d{4}$/, "Invalid postal code")
            .transform(sanitizeString),
        country: z.string().min(1, "Country is required").transform(sanitizeString),
    })
});

// Location schema
export const locationSchema = z.object({
    state: z.string()
        .min(1, "State is required")
        .max(50, "State name is too long")
        .transform(sanitizeString),
    city: z.string()
        .min(1, "City is required")
        .max(50, "City name is too long")
        .transform(sanitizeString)
});

// Job search schema
export const jobSearchSchema = z.object({
    title: z.string()
        .max(100, "Search term is too long")
        .transform(sanitizeString)
        .optional(),
    location: z.string()
        .max(100, "Location is too long")
        .transform(sanitizeString)
        .optional(),
    categories: z.array(z.string())
        .transform(categories => categories.map(sanitizeString))
        .optional(),
    salary: z.object({
        min: z.number().min(0, "Minimum salary must be positive").optional(),
        max: z.number().min(0, "Maximum salary must be positive").optional()
    }).optional().refine(
        (data) => !data || !data.min || !data.max || data.min <= data.max,
        "Minimum salary must be less than or equal to maximum salary"
    ),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'casual', 'all']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'all']).optional(),
    datePosted: z.enum(['today', 'last3days', 'lastWeek', 'lastMonth', 'all']).optional(),
    workArrangement: z.enum(['on-site', 'remote', 'hybrid', 'all']).optional()
});

// Resume upload schema
export const resumeUploadSchema = z.object({
    file: z.instanceof(File)
        .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
        .refine(
            file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
            'Only PDF and Word documents are allowed'
        )
});

// Profile update schema
export const profileUpdateSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long")
        .transform(sanitizeString),
    email: z.string()
        .email("Please enter a valid email address")
        .transform(sanitizeString),
    phone: z.string()
        .regex(/^\+?61\d{9}$/, "Please enter a valid Australian phone number")
        .transform(sanitizeString)
        .optional(),
    bio: z.string()
        .max(500, "Bio is too long")
        .transform(sanitizeString)
        .optional()
});

// Signup form schema
export const signupFormSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters")
        .transform(sanitizeString),
    email: z.string()
        .email("Please enter a valid email address")
        .transform(sanitizeString),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),
    confirmPassword: z.string(),
    role: z.enum(['job_seeker', 'employer'], {
        message: "Please select your role"
    }),
    acceptTerms: z.boolean().refine(val => val === true, {
        message: "You must accept the terms and conditions"
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type SignupFormValues = z.infer<typeof signupFormSchema>
export type ResumeUploadValues = z.infer<typeof resumeUploadSchema>
export type PaymentFormValues = z.infer<typeof paymentFormSchema>
export type JobSearchValues = z.infer<typeof jobSearchSchema>
export type LocationValues = z.infer<typeof locationSchema> 