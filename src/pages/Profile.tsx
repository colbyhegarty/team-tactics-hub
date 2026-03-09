import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Save, BookmarkX, PenTool, Plus, Camera, Users as UsersIcon, Moon, Sun, CalendarDays, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { CustomDrillCard } from '@/components/drill/CustomDrillCard';
import { CustomDrillDetailModal } from '@/components/drill/CustomDrillDetailModal';
import { getUserProfile, saveUserProfile, getSavedDrills, removeDrill, clearAllData } from '@/lib/storage';
import { getCustomDrills, deleteCustomDrill, clearCustomDrills } from '@/lib/customDrillStorage';
import { getContacts, clearContacts } from '@/lib/contactsStorage';
import { Contact } from '@/lib/contactsStorage';
import { ContactsManager } from '@/components/profile/ContactsManager';
import { getSessions } from '@/lib/sessionStorage';
import { Session } from '@/types/session';
import { SessionCard } from '@/components/session/SessionCard';
import { UserProfile, Drill } from '@/types/drill';
import { CustomDrill } from '@/types/customDrill';
import { useToast } from '@/hooks/use-toast';
import { deleteSession, duplicateSession } from '@/lib/sessionStorage';
import { exportSessionToPDF } from '@/lib/sessionPdf';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [savedDrills, setSavedDrills] = useState<Drill[]>([]);
  const [customDrills, setCustomDrills] = useState<CustomDrill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [selectedCustomDrill, setSelectedCustomDrill] = useState<CustomDrill | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [savedGridCols, setSavedGridCols] = useState<1 | 2>(2);
  const [customGridCols, setCustomGridCols] = useState<1 | 2>(2);
  const [sessionGridCols, setSessionGridCols] = useState<1 | 2>(2);
  const [activeSavedOverlay, setActiveSavedOverlay] = useState<string | null>(null);
  const [activeCustomOverlay, setActiveCustomOverlay] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedDrills(getSavedDrills());
    setCustomDrills(getCustomDrills());
    setSessions(getSessions().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    setContacts(getContacts());
  }, []);

  const handleToggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('drillforge_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('drillforge_theme', 'light');
    }
  };

  const handleProfileChange = (key: keyof UserProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveProfile = () => {
    saveUserProfile(profile);
    setHasChanges(false);
    setSheetOpen(false);
    toast({
      title: 'Profile Saved',
      description: 'Your settings have been updated.',
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleViewDrill = (drill: Drill) => setSelectedDrill(drill);

  const handleRemoveDrill = (drill: Drill) => {
    removeDrill(drill.id);
    setSavedDrills(prev => prev.filter(d => d.id !== drill.id));
    toast({ title: 'Drill Removed', description: 'Removed from your saved drills.' });
  };

  const handleDeleteCustomDrill = (id: string) => {
    deleteCustomDrill(id);
    setCustomDrills(prev => prev.filter(d => d.id !== id));
    toast({ title: 'Drill Deleted', description: 'Your custom drill has been deleted.' });
  };

  const handleViewCustomDrill = (drill: CustomDrill) => setSelectedCustomDrill(drill);

  const handleDeleteSession = (id: string) => {
    if (!confirm('Delete this session?')) return;
    deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Session deleted' });
  };

  const handleDuplicateSession = (id: string) => {
    const dup = duplicateSession(id);
    if (dup) {
      setSessions(prev => [dup, ...prev]);
      toast({ title: 'Session duplicated' });
    }
  };

  const handleClearAllData = () => {
    clearAllData();
    clearCustomDrills();
    clearContacts();
    setContacts([]);
    setProfile(getUserProfile());
    setSavedDrills([]);
    setCustomDrills([]);
    setSessions([]);
    toast({ title: 'Data Cleared', description: 'All your data has been deleted.', variant: 'destructive' });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DF';

  const ColumnToggle = ({ cols, setCols }: { cols: 1 | 2; setCols: (v: 1 | 2) => void }) => (
    <div className="flex items-center gap-1">
      <Button variant={cols === 1 ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setCols(1)}>
        <LayoutList className="h-3.5 w-3.5" />
      </Button>
      <Button variant={cols === 2 ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setCols(2)}>
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Profile</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Manage your settings and saved drills
              </p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={profile.email} onChange={(e) => handleProfileChange('email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team / Organization</Label>
                    <Input id="teamName" placeholder="Your team name" value={profile.teamName} onChange={(e) => handleProfileChange('teamName', e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {isDarkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                      <Label htmlFor="dark-mode" className="cursor-pointer">Dark Mode</Label>
                    </div>
                    <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleToggleDarkMode} />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={!hasChanges} className="w-full">
                    <Save className="h-4 w-4" /> Save Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-6 px-4 space-y-6">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="text-center sm:text-left pb-1 flex-1">
                <h3 className="text-xl font-bold text-foreground">{profile.name || 'Coach'}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <UsersIcon className="h-3.5 w-3.5" /> {profile.teamName || 'No team set'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{customDrills.length}</p>
                <p className="text-xs text-muted-foreground">My Drills</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{savedDrills.length}</p>
                <p className="text-xs text-muted-foreground">Saved</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 py-2">
              <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Drills ({customDrills.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 py-2">
              <BookmarkX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Saved ({savedDrills.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 py-2">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sessions ({sessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="mt-4">
            {customDrills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <PenTool className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No custom drills yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first drill with our visual editor</p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  <Plus className="h-4 w-4 mr-2" /> Create Drill
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{customDrills.length} drills</span>
                  <ColumnToggle cols={customGridCols} setCols={setCustomGridCols} />
                </div>
                <div className={customGridCols === 2 ? 'grid gap-3 grid-cols-2' : 'grid gap-4 grid-cols-1'}>
                  {customDrills.map(drill => (
                    <CustomDrillCard
                      key={drill.id}
                      drill={drill}
                      onDelete={handleDeleteCustomDrill}
                      onView={handleViewCustomDrill}
                      compactOverlay={customGridCols === 2}
                      isOverlayActive={activeCustomOverlay === drill.id}
                      onOverlayToggle={(id) => setActiveCustomOverlay(prev => prev === id ? null : id)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            {savedDrills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <BookmarkX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No saved drills yet</p>
                <p className="text-sm text-muted-foreground mt-1">Save drills from the Library to access them here</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/library')}>Browse Library</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{savedDrills.length} saved</span>
                  <ColumnToggle cols={savedGridCols} setCols={setSavedGridCols} />
                </div>
                <div className={savedGridCols === 2 ? 'grid gap-3 grid-cols-2' : 'grid gap-4 grid-cols-1'}>
                  {savedDrills.map(drill => (
                    <DrillCard
                      key={drill.id}
                      drill={drill}
                      isSaved={true}
                      onView={handleViewDrill}
                      onSave={handleRemoveDrill}
                      compactOverlay={savedGridCols === 2}
                      isOverlayActive={activeSavedOverlay === drill.id}
                      onOverlayToggle={(id) => setActiveSavedOverlay(prev => prev === id ? null : id)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No sessions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create a training session to see it here</p>
                <Button className="mt-4" onClick={() => navigate('/sessions/new')}>
                  <Plus className="h-4 w-4 mr-2" /> New Session
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{sessions.length} sessions</span>
                  <ColumnToggle cols={sessionGridCols} setCols={setSessionGridCols} />
                </div>
                <div className={sessionGridCols === 2 ? 'grid gap-3 grid-cols-2' : 'grid gap-4 grid-cols-1'}>
                  {sessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onView={(id) => navigate(`/sessions/${id}`)}
                      onEdit={(id) => navigate(`/sessions/${id}/edit`)}
                      onDuplicate={handleDuplicateSession}
                      onDelete={handleDeleteSession}
                      onExportPDF={exportSessionToPDF}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DrillDetailModal
        drill={selectedDrill}
        isOpen={selectedDrill !== null}
        onClose={() => setSelectedDrill(null)}
        isSaved={true}
        onSave={handleRemoveDrill}
      />
      <CustomDrillDetailModal
        drill={selectedCustomDrill}
        isOpen={selectedCustomDrill !== null}
        onClose={() => setSelectedCustomDrill(null)}
      />
    </div>
  );
}
