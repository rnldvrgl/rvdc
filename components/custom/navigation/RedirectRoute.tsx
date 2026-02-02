import { Button } from "@/components/ui/button"
import { ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

const RedirectRoute = ({ href }: { href: string }) => {
  return (
    <Link href={href}>
      <Button
        variant="link"
        className="p-0 absolute top-4 right-4 hover:animate-in transition-all duration-100"
      >
        <ExternalLinkIcon className="size-4 text-foreground " />
      </Button>
    </Link>
  )
}

export default RedirectRoute
