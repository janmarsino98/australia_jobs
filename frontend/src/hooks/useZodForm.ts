import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export function useZodForm(props: {
    schema: z.ZodType<any>
    defaultValues?: any
    mode?: "onBlur" | "onChange" | "onSubmit" | "all" | "onTouched"
}) {
    const form = useForm({
        resolver: zodResolver(props.schema) as any,
        defaultValues: props.defaultValues,
        mode: props.mode || "onSubmit",
    })

    return form
} 