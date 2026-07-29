import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, ListVideo, PlayCircle, Search, Timer, RefreshCcw } from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { useMyPlaylists, useRefreshPlaylist } from "@/hooks/usePlaylists";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

export function FocusPlaylists() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const refreshPlaylist = useRefreshPlaylist();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const playlistsQuery = useMyPlaylists(
    {
      page,
      limit: 8,
      search: search || undefined,
      status,
      sortBy,
      sortOrder,
    },
    true
  );

  const playlists = playlistsQuery.data?.data || playlistsQuery.data || [];
  const featured = useMemo(() => playlists.find((item) => item.status !== "completed") || playlists[0], [playlists]);
  const stats = useMemo(
    () =>
      playlists.reduce(
        (acc, playlist) => {
          acc.total += 1;
          if (playlist.status === "completed") acc.completed += 1;
          else acc.active += 1;
          return acc;
        },
        { total: 0, active: 0, completed: 0 }
      ),
    [playlists]
  );

  if (playlistsQuery.isLoading) return <LoadingSpinner />;
  if (playlistsQuery.isError) {
    return <ErrorState description="We could not load your playlists." onRetry={() => playlistsQuery.refetch()} />;
  }

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleRefresh = async (playlistId) => {
    try {
      await refreshPlaylist.mutateAsync(playlistId);
      toast.success("Playlist refreshed");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="page-shell relative py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.18),_transparent_28%),linear-gradient(to_bottom,_rgba(255,255,255,0.04),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.14),_transparent_24%),linear-gradient(to_bottom,_rgba(255,255,255,0.03),_transparent_60%)]" />

      <section className="overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)] dark:border-neutral-800/80 dark:bg-neutral-950">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden p-8 sm:p-12 lg:p-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.08),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(24,24,27,0.04),_transparent_30%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.1),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.03),_transparent_26%)]" />
            <div className="relative">
              <p className="eyebrow">Focus Playlists</p>
              <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-5xl sm:leading-[1.02]">
                Turn public YouTube playlists into focused study sessions.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
                Import a playlist, resume where you left off, and keep all your learning progress inside Coursify.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => navigate("/playlists/import")}>
                  Import playlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate(featured ? `/playlists/${featured._id}/watch` : "/playlists/import")}>
                  Continue watching
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <StatCard icon={ListVideo} title="Playlist import" description="Save a public YouTube playlist to your library." />
                <StatCard icon={PlayCircle} title="Focused player" description="Watch without extra page clutter or noise." />
                <StatCard icon={Timer} title="Progress saved" description="Resume from the last watched point." />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[linear-gradient(160deg,#089981_0%,#0f766e_42%,#164e63_100%)] p-8 text-white sm:p-12 lg:p-14">
            <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex h-full min-h-[300px] flex-col justify-between gap-6">
              <div className="max-w-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Your library</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight">Continue from the exact point you stopped.</h2>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-white/80">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">Resume instantly</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">Track progress</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">No distractions</span>
                </div>
              </div>

              <div className="w-full rounded-3xl border border-white/15 bg-black/20 p-5 text-white shadow-[0_20px_60px_-36px_rgba(0,0,0,0.65)] backdrop-blur">
                {featured ? (
                  <>
                    <p className="text-sm text-white/70">Continue watching</p>
                    <p className="mt-2 line-clamp-2 text-lg font-semibold leading-snug">{featured.title}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/75">
                      <Clock3 className="h-4 w-4" />
                      <span>{formatDuration(featured.totalDuration)}</span>
                      <span>•</span>
                      <span>{formatDate(featured.updatedAt)}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button className="bg-white text-neutral-950 hover:bg-white/90" onClick={() => navigate(`/playlists/${featured._id}/watch`)}>
                        Resume playlist
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => handleRefresh(featured._id)}
                        disabled={refreshPlaylist.isPending}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/70">No playlists yet</p>
                    <p className="mt-2 text-lg font-semibold">Import your first public playlist to start tracking progress.</p>
                    <Button className="mt-5 bg-white text-neutral-950 hover:bg-white/90" onClick={() => navigate("/playlists/import")}>
                      Import now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Library</p>
            <h2 className="mt-2 text-3xl font-bold text-neutral-950 dark:text-white">Your imported playlists</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {stats.total} total, {stats.active} active, {stats.completed} completed
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/playlists/import")}>
            Import playlist
          </Button>
        </div>

        <Card className="border-neutral-200/80 bg-white/90 p-3 backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:p-4">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:flex-[2]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search playlists, channels, or IDs..."
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full xl:min-w-[180px] xl:flex-1"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 w-full xl:min-w-[200px] xl:flex-1">
              <option value="updatedAt">Recently updated</option>
              <option value="createdAt">Recently imported</option>
              <option value="title">Title</option>
              <option value="progressPercent">Progress</option>
              <option value="videoCount">Video count</option>
            </Select>
            <Button variant="outline" className="h-10 px-5 xl:self-stretch" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </Card>

        {playlists.length === 0 ? (
          <EmptyState
            title="No playlists imported yet"
            description="Add a public YouTube playlist and it will show up here with progress tracking."
            icon={ListVideo}
            actionLabel="Import playlist"
            onAction={() => navigate("/playlists/import")}
          />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {playlists.map((playlist) => (
                <Card
                  key={playlist._id}
                  className="group overflow-hidden border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-32px_rgba(0,0,0,0.45)] dark:border-neutral-800/80 dark:bg-neutral-950"
                >
                  <div className="relative">
                    <img
                      src={playlist.thumbnailUrl}
                      alt={playlist.title}
                      className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                      <Badge variant={playlist.status === "completed" ? "success" : "secondary"}>
                        {playlist.status === "completed" ? "Completed" : `${playlist.progressPercent || 0}%`}
                      </Badge>
                      <Badge variant="outline">{playlist.videoCount || 0} videos</Badge>
                    </div>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">{playlist.title}</h3>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, playlist.progressPercent || 0))}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                      <p>{formatDuration(playlist.totalDuration)}</p>
                      <p className="truncate">{playlist.channelTitle || "YouTube playlist"}</p>
                      <p>Updated {formatDate(playlist.updatedAt)}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={() => navigate(`/playlists/${playlist._id}/watch`)}>
                        Resume
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/playlists/${playlist._id}`)}>
                        Open
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination pagination={playlistsQuery.data?.pagination} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, title, description }) {
  return (
    <Card className="border-neutral-200/80 bg-white/95 p-4 shadow-none dark:border-neutral-800/80 dark:bg-neutral-950/95">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}
