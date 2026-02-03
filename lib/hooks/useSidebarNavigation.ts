import { NavigationGroup } from "@/lib/constants/interface"
import { baseShortcuts, orderedNavigation } from "@/lib/constants/navigation"
import { useMemo } from "react"

type UseNavigationProps = {
  permissions: string[]
}

export function useSidebarNavigation({ permissions }: UseNavigationProps) {
  const navigation = useMemo(() => {
    return orderedNavigation.reduce<NavigationGroup[]>((acc, item) => {
      if ("children" in item && Array.isArray(item.children)) {
        const filteredChildren = item.children.filter(
          (child) =>
            !child.permission || permissions.includes(child.permission),
        )

        if (filteredChildren.length === 1) {
          // Flatten single child - show child as parent
          const singleChild = filteredChildren[0]
          acc.push({
            name: singleChild.name,
            href: singleChild.href,
            icon: item.icon, // Use parent's icon
            permission: singleChild.permission,
          } as NavigationGroup)
        } else if (filteredChildren.length > 1) {
          // Keep as dropdown for multiple children
          acc.push({ ...item, children: filteredChildren })
        }
      } else if (!item.permission || permissions.includes(item.permission)) {
        acc.push(item as NavigationGroup)
      }
      return acc
    }, [])
  }, [permissions])

  const shortcuts = useMemo(() => {
    return baseShortcuts.filter(
      (shortcut) =>
        !shortcut.permission || permissions.includes(shortcut.permission),
    )
  }, [permissions])

  return { navigation, shortcuts }
}
