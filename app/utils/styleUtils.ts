import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export const styleMerge = (...inputs: ClassValue[]): string => (
    twMerge(clsx(inputs))
)
