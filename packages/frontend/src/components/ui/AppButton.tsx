import type { ButtonHTMLAttributes } from 'react'
import { AppSpinner } from '@frontend/components/ui/AppSpinner'

type ButtonSize = 'default' | 'large'
interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    size?: ButtonSize
    loading?: boolean
}

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
    default: 'text-base px-6 py-2',
    large: 'text-xl px-8 py-3',
}

export function AppButton({
    size = 'default',
    loading,
    ...props
}: AppButtonProps) {
    return (
        <button
            {...props}
            className={`bg-primary text-background hover:bg-primary/80 flex items-center justify-center gap-x-2 rounded-lg border-2 border-transparent shadow-lg shadow-black/10 transition-all duration-300 hover:scale-105 hover:cursor-pointer active:scale-95 active:shadow-transparent active:duration-100 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:cursor-default disabled:hover:bg-pink-500 ${BUTTON_SIZE_CLASSES[size]} ${props.className}`}
            disabled={props.disabled || loading}
        >
            {loading ? <AppSpinner color="background" /> : props.children}
        </button>
    )
}
