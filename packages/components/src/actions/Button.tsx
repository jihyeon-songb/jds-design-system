import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive"
export type ButtonSize = "sm" | "md" | "lg" | "xl"

// ComponentPropsWithoutRef<"button"> — ref를 제외한 순수 props만
export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
}

/*
  forwardRef<HTMLButtonElement, ButtonProps>
  - ref는 일반 props가 아니라 React가 특별 취급하는 속성으로 ref 타입은 forwardRef 제네릭이 책임짐
  - 이렇게 나누는게 React의 ref 처리 방식에 맞고, 중복 충돌도 막아줌
  - React19에서는 ComponentProps 타입으로 쉽게 처리 가능함
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", size = "md", loading = false, startIcon, endIcon, children, disabled, className, ...props },
  ref
) {
  return (
    <button
      {...props}
      ref={ref}
      className={["jdsb-button", className].filter(Boolean).join(" ")}
      /*
        .filter(Boolean)
        - undefined/null/빈 문자열 같은 falsy 값 제거
        - className이 없으면 undefined가 여기서 걸러져 나감
       */
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      /*
        - 업데이트/로딩 중이라서 아직 내용이 완성되지 않았다라는 걸 스크린리더 같은 보조기술에 알려주는 용도
        - loading이 false면 속성 자체를 없애야 하기 때문에 undefined로 명시적으로 바꿔줘야 함
       */
      data-state={loading ? "loading" : "idle"}
      data-variant={variant}
      data-size={size}
      /*
      - 이 버튼의 상태를 CSS 선택자가 읽을 수 있게 DOM에 노출시키는 훅들
      - 속성 선택자가 알아서 매칭 방식 CSS가 훨씬 간결해짐
       */
    >
      {startIcon ? <span aria-hidden="true" data-slot="start-icon">{startIcon}</span> : null}
      {loading ? <span aria-hidden="true" data-slot="spinner" /> : null}
      <span data-slot="label">{children}</span>
      {endIcon ? <span aria-hidden="true" data-slot="end-icon">{endIcon}</span> : null}
    </button>
    /*
      data-slot
      - 각 조각을 CSS/DOM에서 구분하기 위한 이름표

      aria-hidden="true"
      - 스크린리더에서 완전히 숨김, 라벨로 정보 전달이 되고있기 떄문에 굳이 아이콘 정보도 전달할 필요 없음
     */
  )
})
