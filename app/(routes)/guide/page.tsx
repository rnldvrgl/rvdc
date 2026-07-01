"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import {
    AlertTriangle,
    ArrowRightLeft,
    Banknote,
    BookOpen,
    CheckCircle,
    CreditCard,
    FileText,
    Info,
    Package,
    ShoppingCart,
    Store,
    Users,
    Keyboard,
    Wrench,
    Coins,
} from "lucide-react"
import { cn } from "@/lib/utils/helpers"

// ── Shared Components ────────────────────────────────────────────

function InfoBox({
    variant = "info",
    children,
}: {
    variant?: "info" | "warning" | "success"
    children: React.ReactNode
}) {
    return (
        <div
            className={cn(
                "flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed",
                variant === "info" && "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300",
                variant === "warning" && "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                variant === "success" && "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
            )}
        >
            <span className="shrink-0 mt-0.5">
                {variant === "info" && <Info className="size-4" />}
                {variant === "warning" && <AlertTriangle className="size-4" />}
                {variant === "success" && <CheckCircle className="size-4" />}
            </span>
            <span>{children}</span>
        </div>
    )
}

function SectionCard({
    title,
    description,
    icon: Icon,
    children,
}: {
    title: string
    description?: string
    icon?: React.ElementType
    children: React.ReactNode
}) {
    return (
        <Card className="border-border/40">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    {Icon && <Icon className="size-4 text-primary shrink-0" />}
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription className="text-sm">{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

function GuideTable({
    headers,
    rows,
}: {
    headers: string[]
    rows: (string | React.ReactNode)[][]
}) {
    return (
        <div className="overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/40 bg-muted/40">
                        {headers.map((h) => (
                            <th
                                key={h}
                                className="px-4 py-2.5 text-left font-semibold text-foreground/80 text-xs uppercase tracking-wide"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                            {row.map((cell, j) => (
                                <td key={j} className="px-4 py-2.5 text-foreground/80 align-top">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function StepList({ steps }: { steps: { label: string; detail?: string }[] }) {
    return (
        <ol className="space-y-3">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                        {i + 1}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        {step.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    )
}

function FieldRow({ label, detail }: { label: string; detail: string }) {
    return (
        <div className="flex gap-3 py-2 border-b border-border/20 last:border-0">
            <span className="min-w-[140px] shrink-0 text-xs font-semibold text-foreground/70 uppercase tracking-wide pt-0.5">
                {label}
            </span>
            <span className="text-sm text-foreground/80">{detail}</span>
        </div>
    )
}

// ── Clerk Guide Sections ─────────────────────────────────────────

function ClerkGettingAround() {
    return (
        <div className="space-y-4">
            <SectionCard
                title="Key Pages"
                description="Pages you'll use every day as a clerk"
                icon={Store}
            >
                <GuideTable
                    headers={["Page", "What It's For"]}
                    rows={[
                        ["Dashboard", "Your starting point — daily summary, quick actions, and pending tasks."],
                        ["Sales", "Create, view, and manage your sales transactions."],
                        ["Clients", "Search, add, and view customer records."],
                        ["Services", "View service jobs and add parts used on a job."],
                        ["Inventory → Stall Stocks", "Check stock levels at your assigned stall."],
                        ["Inventory → Items", "Browse item catalog, check prices and descriptions."],
                        ["Receivables → Remittances", "Submit your daily cash remittance to the office."],
                        ["Expenses", "Record business expenses you have paid for."],
                        ["Shortcuts", "Full list of keyboard shortcuts available to you."],
                    ]}
                />
            </SectionCard>

            <SectionCard title="How to Navigate" icon={ArrowRightLeft}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Use the sidebar on the left to move between pages. On mobile, tap the menu icon at the top.
                    </p>
                    <InfoBox variant="info">
                        Press <strong>Ctrl + K</strong> from anywhere to open the Command Palette — type a page name or action to jump there instantly.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkShortcuts() {
    return (
        <div className="space-y-4">
            <SectionCard title="Quick Create Shortcuts" icon={Keyboard}>
                <GuideTable
                    headers={["Shortcut", "Action"]}
                    rows={[
                        ["Ctrl + Alt + S", "New Sale"],
                        ["Ctrl + Alt + C", "New Client"],
                        ["Ctrl + Alt + E", "New Expense"],
                        ["Ctrl + Alt + R", "New Remittance"],
                        ["Ctrl + Alt + P", "Open Price Checker"],
                        ["Ctrl + Alt + I", "Open Stock Checker"],
                    ]}
                />
            </SectionCard>

            <SectionCard title="Page Navigation Shortcuts" icon={Keyboard}>
                <GuideTable
                    headers={["Shortcut", "Goes To"]}
                    rows={[
                        ["Alt + Shift + D", "Dashboard"],
                        ["Alt + Shift + A", "Sales"],
                        ["Alt + Shift + C", "Clients"],
                        ["Alt + Shift + I", "Inventory"],
                        ["Alt + Shift + E", "Expenses"],
                        ["Alt + Shift + M", "Remittances"],
                        ["Alt + Shift + T", "Attendance"],
                        ["Alt + Shift + L", "Stall Stocks"],
                    ]}
                />
                <InfoBox variant="warning" >
                    Navigation shortcuts only work when you are <strong>not</strong> typing in a text field or search box.
                </InfoBox>
            </SectionCard>
        </div>
    )
}

function ClerkClients() {
    return (
        <div className="space-y-4">
            <SectionCard title="Adding a New Client" icon={Users}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Press <strong>Ctrl + Alt + C</strong> or click <strong>+ New Client</strong> on the Clients page.
                    </p>
                    <div className="space-y-0 divide-y divide-border/20 rounded-lg border border-border/40">
                        <FieldRow label="Full Name" detail="Customer's full name — required." />
                        <FieldRow label="Phone" detail="Mobile or landline number." />
                        <FieldRow label="Address" detail="Home or business address." />
                        <FieldRow label="Email" detail="Email address (optional)." />
                        <FieldRow label="Company" detail="Business name if applicable (optional)." />
                        <FieldRow label="TIN" detail="Tax Identification Number — needed for BIR receipts (optional)." />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Default Client — Analyn Dela Cruz" icon={Users}>
                <div className="space-y-3">
                    <p className="text-sm text-foreground/80">
                        Always select <strong>Analyn Dela Cruz</strong> as the client when:
                    </p>
                    <ul className="space-y-2 text-sm text-foreground/80 list-none pl-0">
                        <li className="flex gap-2 items-start">
                            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            The customer <strong>does not provide their name or contact information</strong>, or
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            The customer <strong>does not need a Sales Invoice or Official Receipt</strong>.
                        </li>
                    </ul>
                    <InfoBox variant="warning">
                        <strong>Important:</strong> Always select Analyn Dela Cruz in these cases — never leave the client field blank. This keeps records clean and ensures the transaction is properly tracked.
                    </InfoBox>
                </div>
            </SectionCard>

            <SectionCard title="Finding an Existing Client" icon={Users}>
                <StepList
                    steps={[
                        { label: "Go to the Clients page or open a New Sale.", detail: "The client search appears in both places." },
                        { label: "Type the customer's name or phone number in the search box.", detail: "Results appear as you type." },
                        { label: "Click the client to select them.", detail: "Their details will auto-fill." },
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="info">
                        You can also search by partial name — e.g., typing &ldquo;dela&rdquo; will find all clients with that in their name.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkSales() {
    return (
        <div className="space-y-4">
            <SectionCard title="Starting a New Sale" icon={ShoppingCart}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Press <strong>Ctrl + Alt + S</strong> or click <strong>+ New Sale</strong>.
                    </p>
                    <StepList
                        steps={[
                            { label: "Select Sale Type", detail: "Walk-in, Phone Order, or Online Order." },
                            { label: "Select the Client", detail: "Search by name or phone. Use Analyn Dela Cruz if no details provided." },
                            { label: "Receipt Type", detail: "Choose Official Receipt (with OR number and book) or No Receipt." },
                            { label: "Book Number", detail: "If Official Receipt — enter the book number before adding items." },
                            { label: "OR Number", detail: "System auto-fills the next OR number based on the book. Confirm it is correct." },
                            { label: "Add Items", detail: "Search by item name or code. Set quantity and price tier. Add notes if needed." },
                            { label: "Apply Discount", detail: "Optional — enter discount amount or percentage." },
                            { label: "Payment", detail: "Enter cash, card, GCash, or split payment amounts." },
                            { label: "Submit", detail: "Click Submit Sale to finalize. Receipt will print or show on screen." },
                        ]}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Receipt Types" icon={FileText}>
                <GuideTable
                    headers={["Receipt Type", "When to Use", "Requires"]}
                    rows={[
                        [
                            "Official Receipt",
                            "Customer explicitly requests an official receipt or invoice.",
                            "Book number + next OR number",
                        ],
                        [
                            "No Receipt",
                            "Walk-in customers who do not need a receipt.",
                            "Nothing extra — just proceed.",
                        ],
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="info">
                        If you are unsure which book to use, ask your manager before starting the sale.
                    </InfoBox>
                </div>
            </SectionCard>

            <SectionCard title="Adding Items" icon={Package}>
                <div className="space-y-3">
                    <GuideTable
                        headers={["Field", "What to Enter"]}
                        rows={[
                            ["Item Search", "Type item name or code — select from dropdown."],
                            ["Quantity", "Number of units sold."],
                            ["Price Tier", "Retail, Wholesale, or Technician — based on customer type."],
                            ["Unit Price", "Auto-fills based on tier; can be adjusted if allowed."],
                            ["Notes", "Optional — add special instructions or descriptions."],
                        ]}
                    />
                    <InfoBox variant="info">
                        You can add multiple items to one sale. Each item appears as its own line in the sale.
                    </InfoBox>
                </div>
            </SectionCard>

            <SectionCard title="Payment Methods" icon={CreditCard}>
                <GuideTable
                    headers={["Method", "When to Use"]}
                    rows={[
                        ["Cash", "Physical money payment."],
                        ["GCash", "Mobile wallet payment via GCash."],
                        ["Card", "Credit or debit card payment."],
                        ["Split Payment", "Customer pays using two or more methods — enter amounts for each."],
                        ["Cheque", "Payment by cheque — enter cheque number and bank."],
                    ]}
                />
            </SectionCard>

            <SectionCard title="Sale Templates" icon={FileText}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Templates let you save a set of items for sales you repeat often (e.g., a standard package).
                    </p>
                    <GuideTable
                        headers={["Action", "How"]}
                        rows={[
                            ["Save as Template", "After adding items, click Save as Template and give it a name."],
                            ["Load a Template", "Click Load Template at the top of a new sale to instantly add all saved items."],
                        ]}
                    />
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkHoldSale() {
    return (
        <div className="space-y-4">
            <SectionCard title="Holding a Sale" icon={ShoppingCart}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Hold a sale to pause it and come back later — useful when a customer needs time or you need to assist another customer first.
                    </p>
                    <StepList
                        steps={[
                            { label: "While in the sale form, click the Hold button.", detail: "The sale is saved as a draft." },
                            { label: "Assist your next customer or do what you need.", detail: "The held sale is waiting for you." },
                            { label: "To resume, open the Held Sales list from the Sales page.", detail: "Click Resume on the sale to continue." },
                        ]}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Managing Held Sales" icon={ShoppingCart}>
                <GuideTable
                    headers={["Action", "What It Does"]}
                    rows={[
                        ["Resume", "Continues the held sale from where you left off."],
                        ["Delete", "Permanently removes the held sale — use this if the customer cancels."],
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="warning">
                        Held sales are not finalized — they do not appear in reports until they are submitted. Do not leave sales on hold indefinitely.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkInventoryItems() {
    return (
        <div className="space-y-4">
            <SectionCard title="Browsing Inventory Items" icon={Package}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Go to <strong>Inventory → Items</strong> to see all available products.
                    </p>
                    <GuideTable
                        headers={["Column", "What It Shows"]}
                        rows={[
                            ["Item Code", "Unique code used to identify the item."],
                            ["Name", "Product name as it appears in sales."],
                            ["Category", "The product group (e.g., Parts, Accessories)."],
                            ["Retail Price", "Customer price for regular walk-in sales."],
                            ["Wholesale Price", "Discounted price for bulk or dealer customers."],
                            ["Technician Price", "Special price for technician customers."],
                        ]}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Price Checker" icon={Package}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Press <strong>Ctrl + Alt + P</strong> to open the Price Checker from any page.
                    </p>
                    <InfoBox variant="info">
                        The Price Checker shows Retail, Wholesale, and Technician prices. Cost price is only visible to Admin.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkInventoryStock() {
    return (
        <div className="space-y-4">
            <SectionCard title="Checking Stall Stock" icon={Store}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Go to <strong>Inventory → Stall Stocks</strong> to see quantities available at your assigned stall.
                    </p>
                    <GuideTable
                        headers={["Column", "What It Shows"]}
                        rows={[
                            ["Item", "Product name and code."],
                            ["On Hand", "Units currently physically in your stall."],
                            ["Reserved", "Units committed to pending/approved orders."],
                            ["Available", "On Hand minus Reserved — what you can actually sell."],
                        ]}
                    />
                    <InfoBox variant="info">
                        Press <strong>Ctrl + Alt + I</strong> to open the Stock Checker from any page for a quick lookup.
                    </InfoBox>
                </div>
            </SectionCard>

            <SectionCard title="Requesting a Restock" icon={Store}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        When stock at your stall is running low, submit a Stock Request so the stockroom can replenish it.
                    </p>
                    <StepList
                        steps={[
                            { label: "Go to Inventory → Stall Stocks.", detail: "Find the item you need to restock." },
                            { label: "Click Request Stock for that item.", detail: "A form will open." },
                            { label: "Enter the quantity you need and any notes.", detail: "Be specific to avoid delays." },
                            { label: "Submit the request.", detail: "The admin will review and approve or reject it." },
                        ]}
                    />
                    <InfoBox variant="info">
                        You will be notified when your stock request is approved or fulfilled.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkServiceParts() {
    return (
        <div className="space-y-4">
            <InfoBox variant="info">
                As a clerk, you do not create or manage service jobs. Your role is to record the parts and items used on a service job that has already been created by a technician or manager.
            </InfoBox>

            <SectionCard title="Adding Parts to a Service" icon={Wrench}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Go to <strong>Services</strong>, find the service job, and open it. Then add the parts used.
                    </p>
                    <StepList
                        steps={[
                            { label: "Search for the service job by client name or order number.", detail: "Use the search bar at the top of the Services page." },
                            { label: "Open the service job.", detail: "Click on the job to see its details." },
                            { label: "Go to the Parts Used section.", detail: "This is where you add items." },
                            { label: "Search for the part by name or code.", detail: "Same search as in sales — type to find the item." },
                            { label: "Set quantity and confirm.", detail: "The part is recorded against the service job." },
                        ]}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Service Level vs. Appliance Level Parts" icon={Wrench}>
                <GuideTable
                    headers={["Level", "When to Use"]}
                    rows={[
                        [
                            "Service Level",
                            "Parts that apply to the whole service job (not linked to a specific appliance).",
                        ],
                        [
                            "Appliance Level",
                            "Parts that are specific to one appliance being serviced in the job.",
                        ],
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="info">
                        If you are unsure whether a part is service-level or appliance-level, ask the technician assigned to the job.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkRemittances() {
    return (
        <div className="space-y-4">
            <SectionCard title="Submitting a Remittance" icon={Banknote}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        A remittance is your daily cash turnover to the office. Submit one at the end of each shift.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Press <strong>Ctrl + Alt + R</strong> or click <strong>+ New Remittance</strong> on the Remittances page.
                    </p>
                    <StepList
                        steps={[
                            { label: "Enter the denomination breakdown.", detail: "Fill in how many of each bill and coin you are turning over." },
                            { label: "Check the total.", detail: "The total auto-calculates from the denominations you entered." },
                            { label: "Add notes if needed.", detail: "Optional — include any relevant details about the shift." },
                            { label: "Submit.", detail: "Click Submit Remittance to send it for review." },
                        ]}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Denominations" icon={Banknote}>
                <GuideTable
                    headers={["Bill/Coin", "Value"]}
                    rows={[
                        ["₱1,000 bill", "Enter quantity of 1000-peso bills."],
                        ["₱500 bill", "Enter quantity of 500-peso bills."],
                        ["₱200 bill", "Enter quantity of 200-peso bills."],
                        ["₱100 bill", "Enter quantity of 100-peso bills."],
                        ["₱50 bill", "Enter quantity of 50-peso bills."],
                        ["₱20 bill", "Enter quantity of 20-peso bills."],
                        ["₱10 coin", "Enter quantity of 10-peso coins."],
                        ["₱5 coin", "Enter quantity of 5-peso coins."],
                        ["₱1 coin", "Enter quantity of 1-peso coins."],
                        ["₱0.25 coin", "Enter quantity of 25-centavo coins."],
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="info">
                        Use the <strong>Remit All</strong> button if you are turning over the entire balance from your sales for the day — it auto-fills the total amount.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

function ClerkExpenses() {
    return (
        <div className="space-y-4">
            <SectionCard title="Recording an Expense" icon={Coins}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Press <strong>Ctrl + Alt + E</strong> or click <strong>+ New Expense</strong> on the Expenses page.
                    </p>
                    <div className="space-y-0 divide-y divide-border/20 rounded-lg border border-border/40">
                        <FieldRow label="Description" detail="Brief description of what the expense is for." />
                        <FieldRow label="Category" detail="Select the appropriate category (e.g., Supplies, Utilities, Repairs)." />
                        <FieldRow label="Amount" detail="Total amount paid." />
                        <FieldRow label="Date" detail="Date the expense was incurred." />
                        <FieldRow label="Payment Method" detail="Cash, GCash, Card, or Cheque — how it was paid." />
                        <FieldRow label="Receipt / Reference" detail="Upload a photo of the receipt or enter a reference number (optional but recommended)." />
                        <FieldRow label="Notes" detail="Any additional information about the expense." />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Payment Status" icon={Coins}>
                <GuideTable
                    headers={["Status", "What It Means"]}
                    rows={[
                        ["Paid", "The expense has already been paid."],
                        ["Pending", "The expense has been recorded but payment has not been made yet."],
                        ["Reimbursed", "You paid out of pocket and have been reimbursed."],
                    ]}
                />
                <div className="mt-3">
                    <InfoBox variant="info">
                        The payment status is auto-calculated based on the payment method and date fields. If you are unsure, ask your manager.
                    </InfoBox>
                </div>
            </SectionCard>
        </div>
    )
}

// ── Role Guide Wrappers ──────────────────────────────────────────

function ClerkGuide() {
    return (
        <Tabs defaultValue="getting-around" className="space-y-4">
            <div className="overflow-x-auto pb-1">
                <TabsList className="inline-flex h-auto min-w-full w-max gap-1 p-1">
                    <TabsTrigger value="getting-around" className="text-xs">Getting Around</TabsTrigger>
                    <TabsTrigger value="shortcuts" className="text-xs">Shortcuts</TabsTrigger>
                    <TabsTrigger value="clients" className="text-xs">Clients</TabsTrigger>
                    <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
                    <TabsTrigger value="hold-sale" className="text-xs">Hold a Sale</TabsTrigger>
                    <TabsTrigger value="items" className="text-xs">Inventory Items</TabsTrigger>
                    <TabsTrigger value="stock" className="text-xs">Stall Stock</TabsTrigger>
                    <TabsTrigger value="service-parts" className="text-xs">Service Parts</TabsTrigger>
                    <TabsTrigger value="remittances" className="text-xs">Remittances</TabsTrigger>
                    <TabsTrigger value="expenses" className="text-xs">Expenses</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="getting-around" className="mt-0">
                <ClerkGettingAround />
            </TabsContent>
            <TabsContent value="shortcuts" className="mt-0">
                <ClerkShortcuts />
            </TabsContent>
            <TabsContent value="clients" className="mt-0">
                <ClerkClients />
            </TabsContent>
            <TabsContent value="sales" className="mt-0">
                <ClerkSales />
            </TabsContent>
            <TabsContent value="hold-sale" className="mt-0">
                <ClerkHoldSale />
            </TabsContent>
            <TabsContent value="items" className="mt-0">
                <ClerkInventoryItems />
            </TabsContent>
            <TabsContent value="stock" className="mt-0">
                <ClerkInventoryStock />
            </TabsContent>
            <TabsContent value="service-parts" className="mt-0">
                <ClerkServiceParts />
            </TabsContent>
            <TabsContent value="remittances" className="mt-0">
                <ClerkRemittances />
            </TabsContent>
            <TabsContent value="expenses" className="mt-0">
                <ClerkExpenses />
            </TabsContent>
        </Tabs>
    )
}

function ComingSoon({ roleName }: { roleName: string }) {
    return (
        <Card className="border-border/40 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <BookOpen className="size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground/60">
                    Guide for <span className="capitalize">{roleName}</span> is coming soon.
                </p>
            </CardContent>
        </Card>
    )
}

// ── Page ─────────────────────────────────────────────────────────

export default function GuidePage() {
    const { role } = useCurrentUser()

    const roleLabels: Record<string, string> = {
        admin: "Admin",
        manager: "Manager",
        clerk: "Clerk",
        technician: "Technician",
        guest: "Guest",
    }

    return (
        <Wrapper>
            <PageHeader
                variant="compact"
                icon={BookOpen}
                title="User Guide"
                description="Step-by-step instructions for your role"
                breadcrumbs={["Dashboard", "Guide"]}
            >
                <Badge variant="secondary" className="capitalize text-xs font-semibold">
                    {roleLabels[role ?? ""] ?? role}
                </Badge>
            </PageHeader>

            {role === "clerk" && <ClerkGuide />}
            {role === "manager" && <ComingSoon roleName="manager" />}
            {role === "admin" && <ComingSoon roleName="admin" />}
            {role !== "clerk" && role !== "manager" && role !== "admin" && (
                <ComingSoon roleName={role ?? "your"} />
            )}
        </Wrapper>
    )
}
