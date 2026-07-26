export default function DashboardLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="h-3 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="h-5 w-5 bg-muted rounded animate-pulse mb-3" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
