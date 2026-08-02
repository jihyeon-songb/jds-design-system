import { forwardRef, useState, type ComponentPropsWithoutRef } from "react"

export type AvatarSize = "sm" | "md" | "lg" | "xl"

export type AvatarProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  alt?: string
  name?: string
  size?: AvatarSize
  src?: string
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { alt, className, name, size = "md", src, ...props },
  ref
) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const showImage = Boolean(src) && src !== failedSrc
  const fallback = name ? Array.from(name)[0] : undefined
  const hasConsumerName = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined
  const useImageRole = props.role === undefined && (hasConsumerName || (!showImage && fallback))

  return (
    <span
      {...props}
      ref={ref}
      className={["jds-avatar", className].filter(Boolean).join(" ")}
      data-size={size}
      {...(useImageRole ? { role: "img", ...(!hasConsumerName ? { "aria-label": name } : {}) } : {})}
    >
      {showImage ? <img alt={alt ?? name ?? ""} onError={() => setFailedSrc(src)} src={src} /> : null}
      {!showImage && fallback ? <span aria-hidden="true">{fallback}</span> : null}
    </span>
  )
})
