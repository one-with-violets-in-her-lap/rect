import { buildClassName } from '@frontend/utils/class-names'
import type { HTMLAttributes } from 'react'

type SpinnerColor = 'background' | 'primary'

const SPINNER_COLOR_CLASSES: Record<SpinnerColor, string> = {
    background: 'border-t-background border-r-background',
    primary: 'border-t-primary border-r-primary',
}

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    color?: SpinnerColor
}

export function AppSpinner({
    color = 'primary',
    className,
    ...otherProps
}: SpinnerProps) {
    return (
        <div
            className={buildClassName(
                'h-7 w-7 animate-spin rounded-full border-2 border-transparent',
                SPINNER_COLOR_CLASSES[color],
                className,
            )}
            {...otherProps}
        ></div>
    )
}
