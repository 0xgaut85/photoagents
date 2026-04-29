import DashboardProviders from "./_components/DashboardProviders";
import DashboardShell from "./_components/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProviders>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProviders>
  );
}
