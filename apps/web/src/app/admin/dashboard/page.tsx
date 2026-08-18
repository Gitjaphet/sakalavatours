import { RequireAuth } from "../RequireAuth";

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <p>Dashboard — placeholder</p>
    </RequireAuth>
  );
}