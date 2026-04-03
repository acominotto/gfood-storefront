import { Breadcrumb as ChakraBreadcrumb, type SystemStyleObject } from "@chakra-ui/react"
import * as React from "react"

export interface BreadcrumbRootProps extends ChakraBreadcrumb.RootProps {
  separator?: React.ReactNode
  separatorGap?: SystemStyleObject["gap"]
}

export const BreadcrumbRoot = React.forwardRef<
  HTMLDivElement,
  BreadcrumbRootProps
>(function BreadcrumbRoot(props, ref) {
  const { separator, separatorGap, children, ...rest } = props

  const validChildren = React.Children.toArray(children).filter(
    React.isValidElement,
  )

  return (
    <ChakraBreadcrumb.Root ref={ref} {...rest}>
      <ChakraBreadcrumb.List gap={separatorGap}>
        {validChildren.map((child, index) => {
          const last = index === validChildren.length - 1
          return (
            <React.Fragment key={index}>
              <ChakraBreadcrumb.Item>{child}</ChakraBreadcrumb.Item>
              {!last && (
                <ChakraBreadcrumb.Separator>{separator}</ChakraBreadcrumb.Separator>
              )}
            </React.Fragment>
          )
        })}
      </ChakraBreadcrumb.List>
    </ChakraBreadcrumb.Root>
  )
})

export const BreadcrumbLink = ChakraBreadcrumb.Link
export const BreadcrumbCurrentLink = ChakraBreadcrumb.CurrentLink
export const BreadcrumbEllipsis = ChakraBreadcrumb.Ellipsis

export const Breadcrumb = {
  Root: BreadcrumbRoot,
  Link: BreadcrumbLink,
  CurrentLink: BreadcrumbCurrentLink,
  Ellipsis: BreadcrumbEllipsis,
} as const
