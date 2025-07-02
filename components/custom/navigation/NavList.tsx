import { Button } from '@/components/ui/button'
import { getLinkClasses } from '@/lib/utils/helpers'
import Link from 'next/link'

function NavList({
  items,
  activePath,
  close,
  onAction,
  title,
}: {
  items: { name: string; href?: string; icon: any; action?: string }[]
  activePath: string
  close?: () => void
  onAction?: (action: string) => void
  title?: string
}) {
  return (
    <>
      {title && (
        <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
          {title}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={close}
                className={getLinkClasses(activePath.startsWith(item.href))}
              >
                <item.icon className="size-4" />
                {item.name}
              </Link>
            ) : (
              <Button
                onClick={() => {
                  onAction?.(item.action!)
                  close?.()
                }}
                variant="ghost"
                className="w-full justify-start hover:bg-muted hover:text-primary text-muted-foreground"
              >
                <item.icon className="size-4" />
                {item.name}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

export default NavList
