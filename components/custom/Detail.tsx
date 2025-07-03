export const Detail = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) => (
  <div className="flex items-center gap-3">
    {icon && <div className="text-muted-foreground">{icon}</div>}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  </div>
)
