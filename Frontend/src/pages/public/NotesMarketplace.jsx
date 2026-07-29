import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Download, FileText, Search, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "@/components/ui";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage, notesApi } from "@/services/api";

export function NotesMarketplace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");

  const notesQuery = useQuery({
    queryKey: ["notes", { search, subject }],
    queryFn: () => notesApi.list({ search: search || undefined, subject: subject || undefined }),
  });

  const recentNotesQuery = useQuery({
    queryKey: ["notes", "recent"],
    queryFn: () => notesApi.list({ limit: 3 }),
  });

  const vaultQuery = useQuery({
    queryKey: ["note-purchases"],
    queryFn: notesApi.myPurchases,
    enabled: Boolean(accessToken),
  });

  const purchaseMutation = useMutation({
    mutationFn: ({ id, paid }) => (paid ? notesApi.checkout(id) : notesApi.purchase(id)),
    onSuccess: (data, variables) => {
      if (variables.paid) {
        if (!data?.checkoutUrl) {
          toast.error("Payment checkout could not be created.");
          return;
        }
        toast.success("Redirecting to secure checkout...");
        window.location.assign(data.checkoutUrl);
      } else {
        toast.success("Note added to your Study Vault");
      }
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note-purchases"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const downloadMutation = useMutation({
    mutationFn: (id) => notesApi.download(id),
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const handlePurchase = (note) => {
    if (!accessToken) {
      navigate("/login", { state: { from: "/notes" } });
      return;
    }
    if (Number(note.price || 0) > 0) {
      purchaseMutation.mutate({ id: note._id, paid: true });
      return;
    }
    purchaseMutation.mutate({ id: note._id, paid: false });
  };

  const handleCreatorAction = () => {
    if (user?.role === "instructor" || user?.role === "admin") {
      navigate("/instructor/notes");
      return;
    }
    navigate("/register", { state: { from: "/instructor/notes" } });
  };

  const notes = notesQuery.data || [];
  const recentNotes = recentNotesQuery.data || [];
  const vaultNotes = (vaultQuery.data || [])
    .map((purchase) => purchase.noteId)
    .filter((note) => note && typeof note === "object" && note._id);
  const busy = purchaseMutation.isPending || downloadMutation.isPending;

  return (
    <div className="page-shell py-10 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <p className="eyebrow">Study Vault</p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-5xl">
              Useful notes for the next thing you want to understand.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Browse focused PDF study packs from instructors and add free resources to your personal vault.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 dark:border-neutral-800"><FileText className="h-4 w-4 text-lime-600" /> PDF-first resources</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 dark:border-neutral-800"><ShieldCheck className="h-4 w-4 text-lime-600" /> Protected downloads</span>
            </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden bg-neutral-950 p-8 text-white sm:p-12 dark:bg-neutral-900">
            <Sparkles className="h-7 w-7 text-lime-300" />
            <p className="mt-12 max-w-sm text-3xl font-semibold tracking-tight">Collect the ideas worth coming back to.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">Buyers get controlled access. Creators can publish practical material without clutter.</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Browse resources</p>
            <h2 className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">Find your next study pack.</h2>
          </div>
          {user?.role === "instructor" || user?.role === "admin" ? <Button variant="outline" onClick={() => navigate("/instructor/notes")}>Publish a note</Button> : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search notes, subjects, or topics..." /></div>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} className="sm:max-w-xs" placeholder="Filter by subject" />
        </div>

        {recentNotes.length > 0 ? <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recently added</p>
              <h2 className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">Fresh study packs from instructors.</h2>
            </div>
            <span className="hidden text-sm text-neutral-500 dark:text-neutral-400 sm:block">New resources, ready to explore</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentNotes.slice(0, 3).map((note, index) => <motion.div key={note._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}><CompactNoteCard note={note} onPurchase={handlePurchase} onDownload={(id) => downloadMutation.mutate(id)} busy={busy} /></motion.div>)}
          </div>
        </motion.section> : null}

        {notesQuery.isLoading ? <div className="mt-8"><LoadingSpinner label="Loading study notes..." /></div> : notesQuery.isError ? <div className="mt-8"><EmptyState title="Notes are unavailable" description={getApiErrorMessage(notesQuery.error)} actionLabel="Try again" onAction={() => notesQuery.refetch()} icon={FileText} /></div> : notes.length === 0 ? <div className="mt-8"><EmptyState title="No notes found" description="Published study resources will appear here when instructors share them." icon={BookOpen} /></div> : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{notes.map((note, index) => <motion.div key={note._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 5) * 0.05 }}><NoteCard note={note} onPurchase={handlePurchase} onDownload={(id) => downloadMutation.mutate(id)} busy={busy} /></motion.div>)}</div>}
      </section>

      {accessToken ? <section className="mt-14 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Your vault</p>
            <h2 className="mt-2 text-xl font-bold text-neutral-950 dark:text-white">Saved study packs</h2>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{vaultNotes.length} saved · <button type="button" onClick={() => navigate("/student/vault")} className="font-medium text-neutral-950 underline-offset-4 hover:underline dark:text-white">View all</button></span>
        </div>
        {vaultQuery.isLoading ? <div className="mt-4"><LoadingSpinner label="Loading your vault..." /></div> : vaultNotes.length === 0 ? <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Free notes you add to your vault will appear here.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{vaultNotes.slice(0, 3).map((note) => <div key={note._id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"><div className="min-w-0"><p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">{note.title}</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{note.subject}</p></div><Button size="sm" variant="outline" onClick={() => downloadMutation.mutate(note._id)} disabled={downloadMutation.isPending}><Download className="mr-1 h-3.5 w-3.5" />Open</Button></div>)}</div>}
      </section> : null}

      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="mt-16 border-y border-neutral-200 py-10 dark:border-neutral-800">
        <div className="mb-7">
          <p className="eyebrow">How Study Vault works</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">From discovery to secure access.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          <VaultStep number="01" title="Discover resources" description="Search by title, topic, or subject." />
          <VaultStep number="02" title="Add to your vault" description="Save free notes or purchase paid resources." />
          <VaultStep number="03" title="Access securely" description="Open PDFs through temporary protected links." />
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="mt-14 flex flex-col gap-6 rounded-2xl bg-neutral-950 p-7 text-white dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="max-w-2xl">
          <p className="eyebrow text-lime-300">For instructors and creators</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Share useful material with learners.</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">Publish focused PDF resources without building a separate storefront.</p>
        </div>
        <Button onClick={handleCreatorAction} className="shrink-0 bg-lime-300 text-neutral-950 hover:bg-lime-200">Publish a note <ArrowRight className="h-4 w-4" /></Button>
      </motion.section>
    </div>
  );
}

function NoteCard({ note, onPurchase, onDownload, busy }) {
  const price = Number(note.price || 0);
  return <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg dark:hover:border-neutral-700">
    <div className="flex h-36 items-end bg-gradient-to-br from-lime-300 via-emerald-300 to-teal-500 p-5 text-neutral-950"><FileText className="h-10 w-10" /></div>
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{note.subject}</span><span className="text-sm font-semibold">{formatPrice(price)}</span></div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-950 dark:text-white">{note.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{note.description}</p>
      <p className="mt-4 text-xs text-neutral-400">By {note.sellerId?.name || "Skillnest instructor"} · {note.purchaseCount || 0} learners</p>
      <div className="mt-auto flex gap-2 pt-6">{price === 0 ? <Button className="flex-1" onClick={() => onPurchase(note)} disabled={busy}>Add to vault</Button> : <Button className="flex-1" variant="outline" onClick={() => onPurchase(note)} disabled={busy}>Purchase</Button>}<Button variant="outline" onClick={() => onDownload(note._id)} disabled={busy} aria-label={`Download ${note.title}`}><Download className="h-4 w-4" /></Button></div>
    </div>
  </Card>;
}

function CompactNoteCard({ note, onPurchase, onDownload, busy }) {
  const price = Number(note.price || 0);
  return <Card className="flex h-full flex-col p-5 transition-transform hover:-translate-y-1 hover:shadow-lg dark:hover:border-neutral-700">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-100 text-neutral-950 dark:bg-lime-300"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{note.subject}</p><h3 className="mt-1 truncate font-semibold text-neutral-950 dark:text-white">{note.title}</h3></div></div><span className="shrink-0 text-sm font-semibold text-lime-700 dark:text-lime-300">{formatPrice(price)}</span></div>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{note.description}</p>
    <div className="mt-auto flex gap-2 pt-5">{price === 0 ? <Button size="sm" className="flex-1" onClick={() => onPurchase(note)} disabled={busy}>Add to vault</Button> : <Button size="sm" variant="outline" className="flex-1" onClick={() => onPurchase(note)} disabled={busy}>Purchase</Button>}<Button size="sm" variant="outline" onClick={() => onDownload(note._id)} disabled={busy} aria-label={`Open ${note.title}`}><Download className="h-4 w-4" /></Button></div>
  </Card>;
}

function VaultStep({ number, title, description }) {
  return <div className="flex gap-4 md:block"><span className="font-mono text-xs text-lime-600 dark:text-lime-300">{number}</span><div><h3 className="font-semibold text-neutral-950 dark:text-white">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p></div></div>;
}

function formatPrice(price) {
  return price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`;
}
