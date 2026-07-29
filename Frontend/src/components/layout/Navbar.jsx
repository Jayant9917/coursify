import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, BookOpen, Heart, LayoutDashboard, LogOut, Menu, Search, UserCircle2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { authApi, courseApi } from "@/services/api";
import { toast } from "sonner";
import fireLogo from "../../../assets/fire.gif";
import { brand } from "@/utils/brand";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, clearAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("coursify_theme") || "light");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("coursify_theme") === "dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchTriggerRef = useRef(null);
  const notificationsQuery = useNotifications(Boolean(accessToken));
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dashboardPath = getDashboardPath(user?.role);
  const profilePath = getProfilePath(user?.role);
  const wishlistPath = user?.role === "student" ? "/student/wishlist" : "/instructor/courses";
  const coursesPath = user?.role === "student" ? "/student/courses" : "/instructor/courses";
  const isHomePage = location.pathname === "/";
  const unreadCount = useMemo(() => (notificationsQuery.data || []).filter((item) => !item.read).length, [notificationsQuery.data]);

  const handleThemeChange = (nextTheme) => {
    const isNextDark = nextTheme === "dark" || (nextTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setThemeMode(nextTheme);
    setDarkMode(isNextDark);
    document.documentElement.classList.toggle("dark", isNextDark);
    localStorage.setItem("coursify_theme", nextTheme);
  };

  const toggleTheme = () => handleThemeChange(darkMode ? "light" : "dark");

  useEffect(() => {
    const onShortcut = (event) => {
      const target = event.target;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(false);
      setSelectedSearchIndex(0);
      return undefined;
    }
    let active = true;
    setSearchLoading(true);
    setSearchError(false);
    const timer = window.setTimeout(async () => {
      try {
        const payload = await courseApi.list({ search: searchQuery.trim(), limit: 6 });
        if (active) setSearchResults(payload?.items || payload?.courses || payload || []);
      } catch {
        if (active) setSearchError(true);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchOpen, searchQuery]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    searchTriggerRef.current?.focus();
  };

  const selectSearchResult = (course) => {
    closeSearch();
    navigate(`/courses/${course.slug}`);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") return closeSearch();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSearchIndex((index) => Math.min(index + 1, Math.max(searchResults.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSearchIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && searchResults[selectedSearchIndex]) {
      event.preventDefault();
      selectSearchResult(searchResults[selectedSearchIndex]);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort logout.
    } finally {
      clearAuth();
      setProfileOpen(false);
      navigate("/");
      toast.success("Logged out successfully");
    }
  };

  const handleBrandClick = (event) => {
    if (isHomePage) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header className={`sticky relative inset-x-0 top-0 z-40 bg-transparent px-2 pt-2 sm:px-3 ${isHomePage ? "-mb-[64px]" : ""}`}>
        <div className="page-shell">
          <div className="mx-auto flex min-h-[56px] w-full items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-2 shadow-sm backdrop-blur transition-colors dark:border-neutral-800 dark:bg-neutral-950/95 sm:gap-4 sm:px-3">
            <Link to="/" onClick={handleBrandClick} className="group order-1 flex shrink-0 items-center gap-2 font-semibold text-neutral-950 dark:text-white">
              <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/10 transition-all duration-200 group-hover:scale-105 dark:ring-white/10"><img src={fireLogo} alt="" className="h-full w-full object-contain" /></span>
              <span className="text-base font-bold tracking-[-0.02em] text-[#84CC16] transition-colors duration-200 group-hover:text-[#65A30D] dark:text-white dark:group-hover:text-[#BEF264] sm:text-lg">{brand.name}</span>
            </Link>

            <nav className="order-2 hidden items-center gap-2 lg:flex" aria-label="Primary navigation">
              <NavLink to="/courses" className={pillarLinkClass}>Courses</NavLink>
              <NavLink to="/notes" className={pillarLinkClass}>Study Vault</NavLink>
              <NavLink to="/playlists" className={pillarLinkClass}>Focus Room</NavLink>
            </nav>

            <button ref={searchTriggerRef} type="button" className="order-3 hidden h-11 min-w-[260px] flex-1 items-center justify-between gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-500 transition-colors hover:border-lime-400 hover:text-neutral-950 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-[#BEF264] dark:hover:text-white lg:flex" onClick={() => setSearchOpen(true)} aria-label="Open global search"><span className="flex min-w-0 items-center gap-2 truncate"><Search className="h-4 w-4 shrink-0" /> <span className="truncate">Search</span></span><kbd className="rounded border border-neutral-200 px-2 py-0.5 text-[10px] font-medium dark:border-neutral-700">Ctrl K</kbd></button>

            <div className="order-4 hidden items-center gap-3 lg:flex">
              {accessToken ? (
                <NavLink to={dashboardPath} className={pillarLinkClass}>
                  My Learning
                </NavLink>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-10 rounded-full px-4" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button className="h-10 rounded-full px-4" onClick={() => navigate("/register")}>
                    Register
                  </Button>
                </div>
              )}
              {accessToken ? (
                <ProfileActions
                  user={user}
                  dashboardPath={dashboardPath}
                  profilePath={profilePath}
                  wishlistPath={wishlistPath}
                  coursesPath={coursesPath}
                  profileOpen={profileOpen}
                  setProfileOpen={setProfileOpen}
                  setNotificationsOpen={setNotificationsOpen}
                  logout={logout}
                  notificationsOpen={notificationsOpen}
                  notificationsQuery={notificationsQuery}
                  unreadCount={unreadCount}
                  markRead={markRead}
                  markAllRead={markAllRead}
                />
              ) : null}
              <div className="pl-1">
                <ThemeToggle theme={themeMode} onThemeChange={handleThemeChange} />
              </div>
            </div>

            <button type="button" className="order-5 ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-white lg:hidden" onClick={() => setSearchOpen(true)} aria-label="Open search"><Search className="h-5 w-5" /></button>
            <Button variant="outline" size="icon" className="order-6 h-11 w-11 rounded-full lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"}><Menu className="h-5 w-5" /></Button>
          </div>
        </div>

        {mobileOpen ? <div className="absolute left-2 right-2 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 lg:hidden"><div className="page-shell space-y-3 py-4"><nav className="flex flex-col gap-1" aria-label="Mobile navigation"><MobileLink to="/courses" label="Courses" onClick={() => setMobileOpen(false)} /><MobileLink to="/notes" label="Study Vault" onClick={() => setMobileOpen(false)} /><MobileLink to="/playlists" label="Focus Room" onClick={() => setMobileOpen(false)} />{accessToken ? <MobileLink to={dashboardPath} label="My Learning" onClick={() => setMobileOpen(false)} /> : <><MobileLink to="/login" label="Login" onClick={() => setMobileOpen(false)} /><MobileLink to="/register" label="Register" onClick={() => setMobileOpen(false)} /></>}{accessToken ? <button className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900" onClick={logout}>Logout</button> : null}<div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800"><span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</span><ThemeToggle theme={themeMode} onThemeChange={handleThemeChange} /></div></nav></div></div> : null}
      </header>

      {searchOpen ? <SearchModal inputRef={searchInputRef} query={searchQuery} setQuery={setSearchQuery} results={searchResults} loading={searchLoading} error={searchError} selectedIndex={selectedSearchIndex} onKeyDown={handleSearchKeyDown} onSelect={selectSearchResult} onClose={closeSearch} /> : null}
    </>
  );
}

function ProfileActions({ user, dashboardPath, profilePath, wishlistPath, coursesPath, profileOpen, setProfileOpen, setNotificationsOpen, logout, notificationsOpen, notificationsQuery, unreadCount, markRead, markAllRead }) {
  return <><div className="relative"><Button variant="outline" size="icon" aria-label="Open notifications" onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}><Bell className="h-4 w-4" /></Button>{unreadCount > 0 ? <Badge className="absolute -right-1 -top-1 px-1.5 py-0 text-[10px]">{unreadCount}</Badge> : null}{notificationsOpen ? <Card className="absolute right-0 mt-2 w-80 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="text-sm font-semibold">Notifications</p><Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>Mark all read</Button></div><div className="max-h-80 overflow-auto">{(notificationsQuery.data || []).length === 0 ? <div className="p-4 text-sm text-slate-500">No notifications yet.</div> : (notificationsQuery.data || []).map((note) => <button key={note._id} className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50" onClick={() => markRead.mutate(note._id)}><p className="text-sm font-medium text-slate-900">{note.title}</p><p className="mt-1 text-sm text-slate-500">{note.message}</p></button>)}</div></Card> : null}</div><div className="relative"><Button variant="outline" className="gap-2" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}><Avatar className="h-7 w-7"><AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} /><AvatarFallback>{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="hidden lg:inline">{user?.name || "Account"}</span></Button>{profileOpen ? <Card className="absolute right-0 mt-2 w-56 overflow-hidden"><div className="p-2"><MenuLink to={dashboardPath} icon={LayoutDashboard} label={user?.role === "admin" ? "Admin Dashboard" : user?.role === "instructor" ? "Instructor Dashboard" : "Dashboard"} /><MenuLink to={profilePath} icon={UserCircle2} label="Profile settings" /><MenuLink to={wishlistPath} icon={Heart} label={user?.role === "student" ? "Wishlist" : "Courses"} /><MenuLink to={coursesPath} icon={BookOpen} label="My Courses" /><button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={logout}><LogOut className="h-4 w-4" /> Logout</button></div></Card> : null}</div></>;
}

function SearchModal({ inputRef, query, setQuery, results, loading, error, selectedIndex, onKeyDown, onSelect, onClose }) {
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[14vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950" role="dialog" aria-modal="true" aria-labelledby="global-search-title"><div className="flex items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800"><Search className="h-5 w-5 text-neutral-400" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Search courses, notes, playlists..." className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400 dark:text-white" aria-label="Search Skillnest" /><button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-neutral-900 dark:hover:text-white" aria-label="Close search"><X className="h-4 w-4" /></button></div><div className="p-3"><p id="global-search-title" className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Courses</p>{query.trim().length < 2 ? <p className="px-2 py-8 text-center text-sm text-neutral-500">Type at least two characters to search Skillnest.</p> : loading ? <p className="px-2 py-8 text-center text-sm text-neutral-500">Searching courses...</p> : error ? <p className="px-2 py-8 text-center text-sm text-red-500">We could not load search results.</p> : results.length === 0 ? <p className="px-2 py-8 text-center text-sm text-neutral-500">No courses found.</p> : <div className="space-y-1">{results.map((course, index) => <button type="button" key={course._id || course.slug} onClick={() => onSelect(course)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${index === selectedIndex ? "bg-lime-100 text-neutral-950 dark:bg-lime-300/15 dark:text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold">{course.title}</span><span className="mt-1 block truncate text-xs text-neutral-500 dark:text-neutral-400">{course.instructor?.name || course.instructorName || brand.instructorLabel}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400" /></button>)}</div>}<p className="mt-3 border-t border-neutral-200 px-2 pt-3 text-xs text-neutral-400 dark:border-neutral-800">Use arrow keys to navigate, Enter to select, Escape to close.</p></div></section></div>;
}

function MobileLink({ to, label, onClick }) {
  return <NavLink to={to} onClick={onClick} className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900">{label}</NavLink>;
}

function MenuLink({ to, icon: Icon, label }) {
  return <Link to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><Icon className="h-4 w-4" /><span>{label}</span></Link>;
}

function pillarLinkClass({ isActive }) {
  return `rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-lime-100 text-neutral-950 dark:bg-lime-300/15 dark:text-[#BEF264]" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"}`;
}

function getDashboardPath(role) {
  if (role === "instructor") return "/instructor/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

function getProfilePath(role) {
  if (role === "instructor") return "/instructor/profile";
  if (role === "admin") return "/admin/users";
  return "/student/profile";
}
