import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export function useZodForm<T extends z.ZodType<any, any>>(props: {
    schema: T
    defaultValues?: any
    mode?: "onBlur" | "onChange" | "onSubmit" | "all" | "onTouched"
}) {
    const form = useForm({
        resolver: zodResolver(props.schema),
        defaultValues: props.defaultValues,
        mode: props.mode || "onSubmit",
    })

    return form
} 