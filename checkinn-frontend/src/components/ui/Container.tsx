import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type ContainerElement = 'div' | 'section' | 'article' | 'main'

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ContainerElement
  children: ReactNode
  size?: 'default' | 'narrow'
}

export function Container({
  as = 'div',
  children,
  className = '',
  size = 'default',
  ...props
}: ContainerProps) {
  const Component = as as ElementType
  const classes = ['container', `container--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
