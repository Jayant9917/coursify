import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks/useUsers";
import { Button, Card, Input, Badge } from "@/components/ui";
import { Pagination } from "@/components/common/Pagination";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function UserManagement() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user: currentUser } = useAuth();
  const usersQuery = useAdminUsers({ page, limit: 10 });
  const updateStatus = useUpdateUserStatus();

  const users = useMemo(() => {
    const list = usersQuery.data?.data || usersQuery.data || [];
    if (!query) return list;
    const term = query.toLowerCase();
    return list.filter((user) => `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(term));
  }, [usersQuery.data, query]);

  if (usersQuery.isLoading) return <LoadingSpinner />;
  if (usersQuery.isError) return <ErrorState description="We could not load users." onRetry={() => usersQuery.refetch()} />;

  const toggle = async (user) => {
    const next = user.status === "blocked" ? "active" : "blocked";
    try {
      await updateStatus.mutateAsync({ id: user._id, status: next });
      toast.success(`User ${next === "blocked" ? "blocked" : "unblocked"}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">User management</h1>
          <p className="mt-2 text-slate-600">Search and manage platform users.</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>
      </Card>

      {selectedUser ? (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{selectedUser.name}</h2>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Close
            </Button>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <p>Role: {selectedUser.role}</p>
            <p>Status: {selectedUser.status}</p>
            <p>Joined: {formatDate(selectedUser.createdAt)}</p>
            <p>Avatar: {selectedUser.avatar || "N/A"}</p>
          </div>
          {selectedUser.bio ? <p className="mt-4 text-sm text-slate-600">{selectedUser.bio}</p> : null}
        </Card>
      ) : null}

      {users.length === 0 ? (
        <EmptyState title="No users found" description="Try another search term or page." />
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user._id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-sm text-slate-500">Joined {formatDate(user.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{user.role}</Badge>
                  <Badge variant={user.status === "blocked" ? "danger" : "success"}>{user.status}</Badge>
                  <Button variant="outline" onClick={() => setSelectedUser(user)}>
                    View profile
                  </Button>
                  <Button
                    variant="outline"
                    disabled={String(currentUser?._id || currentUser?.id) === String(user._id) && user.status !== "blocked"}
                    onClick={() => toggle(user)}
                  >
                    {user.status === "blocked" ? "Unblock" : "Block"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <Pagination pagination={usersQuery.data?.pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
