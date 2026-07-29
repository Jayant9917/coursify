import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getApiErrorMessage, notesApi } from "@/services/api";

export function MyVault() {
  const purchasesQuery = useQuery({ queryKey: ["note-purchases"], queryFn: notesApi.myPurchases });
  const openNote = async (id) => {
    if (!id) {
      toast.error("This saved note is no longer available.");
      return;
    }

    try {
      const result = await notesApi.download(id);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (purchasesQuery.isLoading) return <LoadingSpinner label="Loading your vault..." />;
  if (purchasesQuery.isError) return <ErrorState description={getApiErrorMessage(purchasesQuery.error)} onRetry={() => purchasesQuery.refetch()} />;

  const notes = (purchasesQuery.data || [])
    .map((purchase) => purchase.noteId)
    .filter((note) => note && typeof note === "object" && note._id);
  return <div className="space-y-6">
    <Card className="p-6"><p className="eyebrow">Study Vault</p><h1 className="mt-2 text-3xl font-black text-neutral-950 dark:text-white">Your saved notes.</h1><p className="mt-2 text-neutral-600 dark:text-neutral-400">Open the study packs you have added from the notes marketplace.</p></Card>
    {notes.length === 0 ? <EmptyState title="Your vault is empty" description="Add a free note from the Study Vault to see it here." icon={FileText} /> : <div className="grid gap-4 md:grid-cols-2">{notes.map((note) => <Card key={note._id} className="flex items-center justify-between gap-4 p-5"><div className="min-w-0"><h2 className="truncate font-semibold text-neutral-950 dark:text-white">{note.title}</h2><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{note.subject}</p></div><Button variant="outline" onClick={() => openNote(note._id)}><Download className="h-4 w-4" />Open PDF</Button></Card>)}</div>}
  </div>;
}
