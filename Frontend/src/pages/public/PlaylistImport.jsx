import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Link as LinkIcon, PlayCircle } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { getApiErrorMessage } from "@/services/api";
import { useImportPlaylist } from "@/hooks/usePlaylists";

const schema = z.object({
  url: z.string().min(1, "Playlist URL is required").max(2000, "Playlist URL is too long"),
});

export function PlaylistImport() {
  const navigate = useNavigate();
  const importPlaylist = useImportPlaylist();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const playlist = await importPlaylist.mutateAsync({ url: values.url.trim() });
      toast.success("Playlist imported");
      navigate(`/playlists/${playlist._id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div className="focus-room-library page-shell min-h-screen py-10">
      <Card className="focus-room-surface mx-auto max-w-3xl overflow-hidden rounded-[var(--focus-radius-xl)] border">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[linear-gradient(145deg,#171717_0%,#115e59_58%,#365314_100%)] p-8 text-white sm:p-12">
            <p className="eyebrow text-white/70">Focus Room import</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Bring a public YouTube playlist into Focus Room.</h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              Paste a playlist URL and we will store the playlist metadata, the ordered video list, and progress tracking inside Skillnest.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <PlayCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Private to you</p>
                <p className="text-sm text-white/75">Imported playlists stay attached to your account.</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--focus-text-muted)]">YouTube playlist</p>
                <h2 className="mt-2 text-3xl font-black text-[var(--focus-text)]">Paste the playlist link.</h2>
              </div>

              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label>Playlist URL</Label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--focus-text-muted)]" />
                    <Input
                      id="playlist-url"
                      className="border-[var(--focus-border-strong)] bg-[var(--focus-elevated)] pl-9 text-white placeholder:text-[var(--focus-text-muted)]"
                      placeholder="https://www.youtube.com/playlist?list=PL..."
                      {...form.register("url")}
                    />
                  </div>
                  {form.formState.errors.url ? <p className="text-sm text-red-300">{form.formState.errors.url.message}</p> : null}
                  <p className="text-xs text-[var(--focus-text-muted)]">Example: https://www.youtube.com/playlist?list=PL...</p>
                </div>

                <Button type="submit" className="focus-room-primary w-full" disabled={form.formState.isSubmitting || importPlaylist.isPending}>
                  {importPlaylist.isPending ? "Importing..." : "Import playlist"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="rounded-[var(--focus-radius-md)] border border-[var(--focus-border)] bg-[var(--focus-elevated)] p-4 text-sm text-[var(--focus-text-secondary)]">
                We validate the URL on the frontend and again on the backend before fetching YouTube metadata.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
