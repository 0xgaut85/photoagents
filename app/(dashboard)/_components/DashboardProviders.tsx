import { DashboardAuthProvider } from "./DashboardAuth";

export default function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardAuthProvider>{children}</DashboardAuthProvider>;
}
