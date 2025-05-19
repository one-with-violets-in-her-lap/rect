export function buildClassName(
    ...classNames: (string | null | undefined | boolean)[]
) {
    return classNames.filter((className) => className).join(' ')
}
