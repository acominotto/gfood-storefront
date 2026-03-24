import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import {
  AbsoluteCenter,
  Button as ChakraButton,
  Span,
  Spinner,
} from "@chakra-ui/react"
import * as React from "react"

interface ButtonLoadingProps {
  loading?: boolean
  loadingText?: React.ReactNode
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "then" in value &&
    typeof (value as PromiseLike<unknown>).then === "function"
  )
}

export type ButtonProps = Omit<ChakraButtonProps, "onClick"> &
  ButtonLoadingProps & {
    onClick?: (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => void | Promise<unknown>
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { loading, disabled, loadingText, children, onClick, ...rest } = props
    const [internalLoading, setInternalLoading] = React.useState(false)
    const mountedRef = React.useRef(true)

    React.useEffect(() => {
      mountedRef.current = true
      return () => {
        mountedRef.current = false
      }
    }, [])

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        const result = onClick?.(event)
        if (isThenable(result)) {
          setInternalLoading(true)
          Promise.resolve(result).finally(() => {
            if (mountedRef.current) {
              setInternalLoading(false)
            }
          })
        }
      },
      [onClick],
    )

    const showLoading = Boolean(loading) || internalLoading

    return (
      <ChakraButton
        disabled={showLoading || disabled}
        ref={ref}
        onClick={handleClick}
        {...rest}
      >
        {showLoading && !loadingText ? (
          <>
            <AbsoluteCenter display="inline-flex">
              <Spinner size="inherit" color="inherit" />
            </AbsoluteCenter>
            <Span opacity={0}>{children}</Span>
          </>
        ) : showLoading && loadingText ? (
          <>
            <Spinner size="inherit" color="inherit" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ChakraButton>
    )
  },
)
