import { NavigationGroup, NavigationLink } from "@/lib/constants/interface"
import { sectionedNavigation } from "@/lib/constants/navigation"
import { useMemo } from "react"

type UseNavigationProps = {
  permissions: string[]
}

type FilteredSection = {
  title?: string
  items: (NavigationGroup | NavigationLink)[]
}

export function useSidebarNavigation({ permissions }: UseNavigationProps) {
  const sections = useMemo<FilteredSection[]>(() => {
    return sectionedNavigation.reduce<FilteredSection[]>((acc, section) => {
      const filteredItems = section.items.reduce<
        (NavigationGroup | NavigationLink)[]
      >((itemAcc, item) => {
        if ("children" in item && Array.isArray(item.children)) {
          const filteredChildren = item.children.filter(
            (child) =>
              !child.permission || permissions.includes(child.permission),
          )

          if (filteredChildren.length === 1) {
            const singleChild = filteredChildren[0]
            itemAcc.push({
              name: singleChild.name,
              href: singleChild.href,
              icon: item.icon,
              permission: singleChild.permission,
            })
          } else if (filteredChildren.length > 1) {
            itemAcc.push({ ...item, children: filteredChildren })
          }
        } else if (!item.permission || permissions.includes(item.permission)) {
          itemAcc.push(item as NavigationGroup | NavigationLink)
        }
        return itemAcc
      }, [])

      if (filteredItems.length > 0) {
        acc.push({ title: section.title, items: filteredItems })
      }
      return acc
    }, [])
  }, [permissions])

  // Flat list for command palette / search
  const navigation = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  )

  return { sections, navigation }
}
