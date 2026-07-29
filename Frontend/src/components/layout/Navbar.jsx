import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, LayoutDashboard, LogOut, Menu, Search, UserCircle2, X } from "lucide-react";
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
  const isHomePage = location.pathname === "/";
  const isWorkspaceRoute = /^\/(student|instructor|admin)(\/|$)/.test(location.pathname);
  const showGlobalCourses = !isWorkspaceRoute;
  const unreadCount = useMemo(() => (notificationsQuery.data || []).filter((item) => !item.read).length, [notificationsQuery.data]);

  useEffect(() => {
    const isDark = themeMode === "dark" || (themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [themeMode]);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleThemeChange = (nextTheme) => {
    const isNextDark = nextTheme === "dark" || (nextTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setThemeMode(nextTheme);
    document.documentElement.classList.toggle("dark", isNextDark);
    localStorage.setItem("coursify_theme", nextTheme);
  };

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
    if (course?.slug) {
      navigate(`/courses/${course.slug}`);
    } else if (course?._id) {
      navigate(`/courses/${course._id}`);
    } else {
      toast.info("This course is not ready to open yet.");
    }
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
      <header className={`sticky relative inset-x-0 top-0 z-40 bg-transparent px-4 py-3 ${isHomePage ? "-mb-[80px]" : ""}`}>
        <div className="page-shell">
          <div className="mx-auto flex min-h-[56px] w-full items-center gap-3 rounded-full border border-neutral-800/80 bg-neutral-950/90 px-3 py-1.5 text-neutral-300 shadow-lg backdrop-blur-md sm:px-4 lg:gap-4 lg:px-4">
            <Link to="/" onClick={handleBrandClick} className="group order-1 flex shrink-0 items-center gap-2 font-semibold text-neutral-950 dark:text-white">
              <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-sm ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105"><img src={fireLogo} alt="" className="h-full w-full object-contain" /></span>
              <span className="text-[15px] font-semibold tracking-tight text-white transition-colors duration-200 group-hover:text-[#BEF264]">{brand.name}</span>
            </Link>

            <nav className="order-2 hidden items-center gap-2 lg:ml-32 lg:flex" aria-label="Primary navigation">
              <NavLink to="/" end className={pillarLinkClass}>Home</NavLink>
              {showGlobalCourses ? <NavLink to="/courses" className={pillarLinkClass}>Courses</NavLink> : null}
              <button type="button" className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white" onClick={() => toast.info("Proto 1 is ready to be connected.")} aria-label="Open Proto 1">Proto 1</button>
              <button type="button" className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white" onClick={() => toast.info("Proto 2 is ready to be connected.")} aria-label="Open Proto 2">Proto 2</button>
              {accessToken && user?.role === "student" ? <NavLink to={dashboardPath} className={pillarLinkClass}>My Learning</NavLink> : null}
              {!accessToken || (user?.role !== "instructor" && user?.role !== "admin") ? <NavLink to="/register?role=instructor" className={pillarLinkClass}>Become an Instructor</NavLink> : null}
            </nav>

            <button ref={searchTriggerRef} type="button" className="order-3 hidden min-w-[180px] flex-1 items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/80 px-3.5 py-1.5 text-left text-sm text-neutral-400 transition-colors hover:border-neutral-600 hover:bg-neutral-800/80 lg:flex lg:max-w-[240px] xl:max-w-[280px]" onClick={() => setSearchOpen(true)} aria-label="Open global search"><Search className="h-4 w-4 shrink-0 opacity-70" /><span className="truncate">Search</span><kbd className="ml-auto hidden rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-block">Ctrl K</kbd></button>

            <div className="order-4 ml-auto hidden shrink-0 items-center gap-1.5 lg:flex">
              {!accessToken ? (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-10 rounded-full px-4" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button className="h-10 rounded-full px-4" onClick={() => navigate("/register")}>
                    Register
                  </Button>
                </div>
              ) : null}
              {accessToken ? (
                <ProfileActions
                  user={user}
                  dashboardPath={dashboardPath}
                  profilePath={profilePath}
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
                <ThemeToggle className="h-9 w-9 rounded-full border-transparent bg-transparent text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white" theme={themeMode} onThemeChange={handleThemeChange} />
              </div>
            </div>

            <button ref={searchTriggerRef} type="button" className="order-5 ml-auto flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white lg:hidden" onClick={() => setSearchOpen(true)} aria-label="Search"><Search className="h-4 w-4" /></button>
            <Button variant="ghost" size="icon" className="order-6 h-9 w-9 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"}><Menu className="h-5 w-5" /></Button>
          </div>
        </div>

        {mobileOpen ? <div className="absolute left-2 right-2 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl lg:hidden"><div className="page-shell space-y-3 py-4"><nav className="flex flex-col gap-1" aria-label="Mobile navigation"><MobileLink to="/" end label="Home" onClick={() => setMobileOpen(false)} />{showGlobalCourses ? <MobileLink to="/courses" label="Courses" onClick={() => setMobileOpen(false)} /> : null}<button type="button" className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white" onClick={() => toast.info("Proto 1 is ready to be connected.")}>Proto 1</button><button type="button" className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white" onClick={() => toast.info("Proto 2 is ready to be connected.")}>Proto 2</button>{accessToken ? <><MobileLink to={dashboardPath} label={user?.role === "instructor" ? "Instructor Dashboard" : user?.role === "admin" ? "Admin Dashboard" : "My Learning"} onClick={() => setMobileOpen(false)} /><MobileLink to={profilePath} label="Profile settings" onClick={() => setMobileOpen(false)} /></> : null}{!accessToken || (user?.role !== "instructor" && user?.role !== "admin") ? <MobileLink to="/register?role=instructor" label="Become an Instructor" onClick={() => setMobileOpen(false)} /> : null}{!accessToken ? <><MobileLink to="/login" label="Login" onClick={() => setMobileOpen(false)} /><MobileLink to="/register" label="Register" onClick={() => setMobileOpen(false)} /></> : null}{accessToken ? <div className="mt-2 flex items-center gap-1 border-t border-neutral-800 pt-3"><ProfileActions user={user} dashboardPath={dashboardPath} profilePath={profilePath} profileOpen={profileOpen} setProfileOpen={setProfileOpen} setNotificationsOpen={setNotificationsOpen} logout={logout} notificationsOpen={notificationsOpen} notificationsQuery={notificationsQuery} unreadCount={unreadCount} markRead={markRead} markAllRead={markAllRead} /></div> : null}{accessToken ? <button type="button" className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-800" onClick={logout}>Logout</button> : null}<div className="flex items-center justify-between border-t border-neutral-800 pt-3"><span className="text-sm font-medium text-neutral-300">Theme</span><ThemeToggle className="border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-white" theme={themeMode} onThemeChange={handleThemeChange} /></div></nav></div></div> : null}
      </header>

      {searchOpen ? <SearchModal inputRef={searchInputRef} query={searchQuery} setQuery={setSearchQuery} results={searchResults} loading={searchLoading} error={searchError} selectedIndex={selectedSearchIndex} onKeyDown={handleSearchKeyDown} onSelect={selectSearchResult} onClose={closeSearch} /> : null}
    </>
  );
}

function ProfileActions({ user, dashboardPath, profilePath, profileOpen, setProfileOpen, setNotificationsOpen, logout, notificationsOpen, notificationsQuery, unreadCount, markRead, markAllRead }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;
      if (notificationsOpen && !target.closest("button")) setNotificationsOpen(false);
      if (profileOpen && !target.closest("button[aria-haspopup='menu']") && !target.closest("[role='menu']")) setProfileOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (notificationsOpen) setNotificationsOpen(false);
        if (profileOpen) setProfileOpen(false);
        return;
      }
      if (!profileOpen || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
      const items = Array.from(document.activeElement?.closest(".relative")?.querySelectorAll("[role=menuitem]") || []);
      if (!items.length) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex = event.key === "ArrowDown" ? (currentIndex + 1) % items.length : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex].focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, profileOpen, setNotificationsOpen, setProfileOpen]);

  const handleNotificationClick = (note) => {
    markRead.mutate(note._id);
    setNotificationsOpen(false);
    const destination = note.link || note.route || note.url || note.href;
    if (!destination) return;
    if (destination.startsWith("/")) navigate(destination);
    else window.location.assign(destination);
  };

  return <><div className="relative"><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white" aria-label="Notifications" aria-haspopup="dialog" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}><Bell className="h-4 w-4" /></Button>{unreadCount > 0 ? <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-400 px-1 text-[10px] font-bold text-neutral-950">{unreadCount > 9 ? "9+" : unreadCount}</Badge> : null}{notificationsOpen ? <Card className="absolute right-0 mt-2 w-80 overflow-hidden border-neutral-800 bg-neutral-950 text-white"><div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3"><p className="text-sm font-semibold">Notifications</p><Button variant="ghost" size="sm" className="text-neutral-300 hover:bg-neutral-800 hover:text-white" onClick={() => markAllRead.mutate()}>Mark all read</Button></div><div className="max-h-80 overflow-auto">{notificationsQuery.isLoading ? <div className="p-4 text-sm text-neutral-400" role="status">Loading notifications...</div> : (notificationsQuery.data || []).length === 0 ? <div className="p-4 text-sm text-neutral-400">No notifications yet.</div> : (notificationsQuery.data || []).map((note) => <button type="button" key={note._id} className="block w-full border-b border-neutral-800 px-4 py-3 text-left hover:bg-neutral-900" onClick={() => handleNotificationClick(note)}><p className="text-sm font-medium text-white">{note.title}</p><p className="mt-1 text-sm text-neutral-400">{note.message}</p></button>)}</div></Card> : null}</div><div className="relative"><Button variant="ghost" className="h-9 gap-2 rounded-full py-1 pl-1 pr-2.5 text-white hover:bg-neutral-800" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}><Avatar className="h-8 w-8 bg-lime-400"><AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} /><AvatarFallback className="bg-lime-400 text-sm font-semibold text-neutral-950">{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="hidden text-sm font-medium xl:inline">{user?.name || "Account"}</span></Button>{profileOpen ? <Card role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden border-neutral-800 bg-neutral-950"><div className="p-2"><MenuLink to={dashboardPath} icon={LayoutDashboard} label={user?.role === "admin" ? "Admin Dashboard" : user?.role === "instructor" ? "Instructor Dashboard" : "Dashboard"} /><MenuLink to={profilePath} icon={UserCircle2} label="Profile settings" /><button type="button" role="menuitem" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-neutral-900" onClick={logout}><LogOut className="h-4 w-4" /> Logout</button></div></Card> : null}</div></>;
}

function SearchModal({ inputRef, query, setQuery, results, loading, error, selectedIndex, onKeyDown, onSelect, onClose }) {
  useEffect(() => {
    const input = inputRef.current;
    const dialog = input?.closest('[role="dialog"]');
    input?.focus();
    if (!dialog) return undefined;
    const handleDialogKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll("button, input, [href], [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", handleDialogKeyDown);
    return () => dialog.removeEventListener("keydown", handleDialogKeyDown);
  }, [inputRef, onClose]);

  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[14vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950" role="dialog" aria-modal="true" aria-labelledby="global-search-title"><div className="flex items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800"><Search className="h-5 w-5 text-neutral-400" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Search courses..." className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400 dark:text-white" aria-label="Search Skillnest" /><button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-neutral-900 dark:hover:text-white" aria-label="Close search"><X className="h-4 w-4" /></button></div><div className="p-3"><p id="global-search-title" className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Courses</p>{query.trim().length < 2 ? <p className="px-2 py-8 text-center text-sm text-neutral-500">Type at least two characters to search courses.</p> : loading ? <p className="px-2 py-8 text-center text-sm text-neutral-500">Searching courses...</p> : error ? <p className="px-2 py-8 text-center text-sm text-red-500">We could not load search results.</p> : results.length === 0 ? <p className="px-2 py-8 text-center text-sm text-neutral-500">No courses found.</p> : <div className="space-y-1">{results.map((course, index) => <button type="button" key={course._id || course.slug} onClick={() => onSelect(course)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${index === selectedIndex ? "bg-lime-100 text-neutral-950 dark:bg-lime-300/15 dark:text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold">{course.title}</span><span className="mt-1 block truncate text-xs text-neutral-500 dark:text-neutral-400">{course.instructor?.name || course.instructorName || brand.instructorLabel}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400" /></button>)}</div>}<p className="mt-3 border-t border-neutral-200 px-2 pt-3 text-xs text-neutral-400 dark:border-neutral-800">Use arrow keys to navigate, Enter to select, Escape to close.</p></div></section></div>;
}

function MobileLink({ to, label, onClick, end = false }) {
  return <NavLink to={to} end={end} onClick={onClick} className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white">{label}</NavLink>;
}

function MenuLink({ to, icon: Icon, label }) {
  return <Link to={to} role="menuitem" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"><Icon className="h-4 w-4" /><span>{label}</span></Link>;
}

function pillarLinkClass({ isActive }) {
  return `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-lime-400/15 text-lime-400" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"}`;
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
