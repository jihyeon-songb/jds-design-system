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
  /*
   `failedSrc` / `showImage` - 이미지 로딩 실패를 추적하는 상태

    이미지 로딩 실패시에 이름의 맨 앞 한글자를 가져와서 보여준다
    fallback이 undefined 일 때는 `src`도 없고 `name`도 없는 경우 스크린리더에게는 빈 컨테이너로 인식
   */
  const [failedSrc, setFailedSrc] = useState<string>()
  const showImage = Boolean(src) && src !== failedSrc
  const fallback = name ? Array.from(name)[0] : undefined

  /*
   hasConsumerName - 사용하는 쪽에서 이미 `aria-label`이나 `aria-labelledby`로 접근성 이름을 직접 지정했는지 확인

    `aria-label`은 문자열을 직접 하드코딩
    `aria-labelledby`는 페이지에 이미 보이는 다른 텍스트를 재사용
   */
  const hasConsumerName = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined

  /*
   `props.role === undefined`
    - `aria-label`/`aria-labelledby` 을 직접 줬다면 role로 지정하거나
    - `!showImage && fallback` 이미지가 안 보이고 이니셜 텍스트만 보이는 상황, 스크린리더가 "지"라는 텍스트로 그냥 읽지 않고 아바타 전체를 하나의 이미지로 인식하도록 role을 붙이고 `name`을 라벨로 씀
   */
  const useImageRole = props.role === undefined && (hasConsumerName || (!showImage && fallback))

  return (
    <span
      {...props}
      ref={ref}
      className={["jdsb-avatar", className].filter(Boolean).join(" ")}
      data-size={size}
      {...(useImageRole ? { role: "img", ...(!hasConsumerName ? { "aria-label": name } : {}) } : {})}
    >
      {showImage ? <img alt={alt ?? name ?? ""} onError={() => setFailedSrc(src)} src={src} /> : null}
      {!showImage && fallback ? <span aria-hidden="true">{fallback}</span> : null}
    </span>
  )
})
