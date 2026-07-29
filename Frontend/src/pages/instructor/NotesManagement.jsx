import { useState } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, Input, Label, Textarea, Badge } from "@/components/ui";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { getApiErrorMessage, notesApi, uploadApi } from "@/services/api";

const initialForm = { title: "", description: "", subject: "", price: "0", isPublished: true };

export function NotesManagement() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const notesQuery = useQuery({ queryKey: ["instructor-notes"], queryFn: notesApi.listMine });
  const [saving, setSaving] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: notesApi.remove,
    onSuccess: () => { toast.success("Note deleted"); queryClient.invalidateQueries({ queryKey: ["instructor-notes"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }) => notesApi.update(id, { isPublished }),
    onSuccess: () => { toast.success("Note visibility updated"); queryClient.invalidateQueries({ queryKey: ["instructor-notes"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const createNote = async (event) => {
    event.preventDefault();
    if (!file || file.type !== "application/pdf") { toast.error("Choose a PDF file first."); return; }
    setSaving(true);
    try {
      const upload = await uploadApi.requestLessonFileUpload({ fileName: file.name, contentType: file.type, folder: "notes" });
      await uploadApi.uploadToPresignedUrl(upload.uploadUrl, file, file.type);
      await notesApi.create({ ...form, price: Number(form.price), fileKey: upload.fileKey, fileName: file.name, fileSize: file.size });
      toast.success("Note published to Study Vault");
      setForm(initialForm);
      setFile(null);
      event.target.reset();
      queryClient.invalidateQueries({ queryKey: ["instructor-notes"] });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (notesQuery.isLoading) return <LoadingSpinner label="Loading your notes..." />;
  if (notesQuery.isError) return <ErrorState description={getApiErrorMessage(notesQuery.error)} onRetry={() => notesQuery.refetch()} />;

  const notes = notesQuery.data || [];
  return <div className="space-y-6">
    <Card className="p-6"><p className="eyebrow">Study Vault</p><h1 className="mt-2 text-3xl font-black text-neutral-950 dark:text-white">Publish useful notes.</h1><p className="mt-2 text-neutral-600 dark:text-neutral-400">Upload PDF study packs and control whether students can discover them.</p></Card>
    <Card className="p-6">
      <h2 className="text-xl font-bold text-neutral-950 dark:text-white">Publish a PDF</h2>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createNote}>
        <Field label="Title"><Input required value={form.title} onChange={(e) => update("title", e.target.value)} /></Field>
        <Field label="Subject"><Input required value={form.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
        <Field label="Price in INR"><Input type="number" min="0" required value={form.price} onChange={(e) => update("price", e.target.value)} /></Field>
        <Field label="PDF file"><Input required type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
        <Field label="Description"><Textarea required className="md:min-h-28" value={form.description} onChange={(e) => update("description", e.target.value)} /></Field>
        <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => update("isPublished", e.target.checked)} /> Publish immediately</label></div>
        <Button type="submit" className="w-fit" disabled={saving}><Upload className="h-4 w-4" />{saving ? "Uploading..." : "Publish note"}</Button>
      </form>
    </Card>
    {notes.length === 0 ? <EmptyState title="No notes yet" description="Your published and draft notes will appear here." icon={FileText} /> : <div className="grid gap-4 md:grid-cols-2">{notes.map((note) => <Card key={note._id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-neutral-950 dark:text-white">{note.title}</h3><p className="mt-1 text-sm text-neutral-500">{note.subject} · ₹{Number(note.price || 0).toLocaleString("en-IN")}</p></div><Badge variant={note.isPublished ? "success" : "secondary"}>{note.isPublished ? "Published" : "Draft"}</Badge></div><p className="mt-3 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{note.description}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => toggleMutation.mutate({ id: note._id, isPublished: !note.isPublished })}>{note.isPublished ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="outline" onClick={() => { if (window.confirm("Delete this note?")) deleteMutation.mutate(note._id); }}><Trash2 className="h-4 w-4" />Delete</Button></div></Card>)}</div>}
  </div>;
}

function Field({ label, children }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
