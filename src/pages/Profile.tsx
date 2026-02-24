import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Trash2, Save, BookmarkX, PenTool, Plus, ChevronDown, Mail, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { CustomDrillCard } from '@/components/drill/CustomDrillCard';
import { CustomDrillDetailModal } from '@/components/drill/CustomDrillDetailModal';
import { getUserProfile, saveUserProfile, getSavedDrills, removeDrill, clearAllData } from '@/lib/storage';
import { getCustomDrills, deleteCustomDrill, clearCustomDrills } from '@/lib/customDrillStorage';
import { UserProfile, Drill, AgeGroup, SkillLevel } from '@/types/drill';
import { CustomDrill } from '@/types/customDrill';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ageGroups: AgeGroup[] = [
  'U8', 'U10', 'U12', 'U14', 'U16', 'U18',
  'College', 'Semi-Pro', 'Professional', 'Recreational Adult', 'Not Specified',
];

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Not Specified'];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [savedDrills, setSavedDrills] = useState<Drill[]>([]);
  const [customDrills, setCustomDrills] = useState<CustomDrill[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [selectedCustomDrill, setSelectedCustomDrill] = useState<CustomDrill | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSavedDrills(getSavedDrills());
    setCustomDrills(getCustomDrills());
  }, []);

  const handleProfileChange = (key: keyof UserProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveProfile = () => {
    saveUserProfile(profile);
    setHasChanges(false);
    toast({
      title: 'Profile Saved',
      description: 'Your settings have been updated.',
    });
  };

  const handleViewDrill = (drill: Drill) => {
    setSelectedDrill(drill);
  };

  const handleRemoveDrill = (drill: Drill) => {
    removeDrill(drill.id);
    setSavedDrills(prev => prev.filter(d => d.id !== drill.id));
    toast({
      title: 'Drill Removed',
      description: 'Removed from your saved drills.',
    });
  };

  const handleDeleteCustomDrill = (id: string) => {
    deleteCustomDrill(id);
    setCustomDrills(prev => prev.filter(d => d.id !== id));
    toast({
      title: 'Drill Deleted',
      description: 'Your custom drill has been deleted.',
    });
  };

  const handleViewCustomDrill = (drill: CustomDrill) => {
    setSelectedCustomDrill(drill);
  };

  const handleClearAllData = () => {
    clearAllData();
    clearCustomDrills();
    setProfile(getUserProfile());
    setSavedDrills([]);
    setCustomDrills([]);
    toast({
      title: 'Data Cleared',
      description: 'All your data has been deleted.',
      variant: 'destructive',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'DF';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Profile</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Manage your settings and saved drills
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-6 px-4 space-y-8">
        {/* User Info Section - Enhanced Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
              <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left pb-1 flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {profile.name || 'Coach'}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {profile.teamName || 'No team set'}
                </p>
              </div>
            </div>

            {/* Quick stats */}
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
                <p className="text-lg font-bold text-foreground">{profile.defaultAgeGroup || '—'}</p>
                <p className="text-xs text-muted-foreground">Age Group</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-3 mt-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Team / Organization</Label>
                <Input
                  id="teamName"
                  placeholder="Your team name"
                  value={profile.teamName}
                  onChange={(e) => handleProfileChange('teamName', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Default Settings - Collapsible */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <Settings className="h-4 w-4" />
              Default Settings
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border border-t-0 border-border rounded-b-xl bg-card px-4 pb-4 pt-3 -mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              These will pre-fill the Generate Drill form
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultAgeGroup">Default Age Group</Label>
                  <Select
                    value={profile.defaultAgeGroup}
                    onValueChange={(value) => handleProfileChange('defaultAgeGroup', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroups.map(age => (
                        <SelectItem key={age} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultSkillLevel">Default Skill Level</Label>
                  <Select
                    value={profile.defaultSkillLevel}
                    onValueChange={(value) => handleProfileChange('defaultSkillLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultPlayerCount">Typical Player Count</Label>
                <Input
                  id="defaultPlayerCount"
                  type="number"
                  min={2}
                  max={30}
                  value={profile.defaultPlayerCount}
                  onChange={(e) => handleProfileChange('defaultPlayerCount', parseInt(e.target.value) || 12)}
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={!hasChanges}
                className="w-full"
              >
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Drills Tabs */}
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 py-2">
              <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              My Drills ({customDrills.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 py-2">
              <BookmarkX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Saved ({savedDrills.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="mt-4">

            {customDrills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <PenTool className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No custom drills yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first drill with our visual editor
                </p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Drill
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {customDrills.map(drill => (
                  <CustomDrillCard
                    key={drill.id}
                    drill={drill}
                    onDelete={handleDeleteCustomDrill}
                    onView={handleViewCustomDrill}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Drills Tab */}
          <TabsContent value="saved" className="mt-4">

            {savedDrills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <BookmarkX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No saved drills yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Save drills from the Library to access them here
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/library')}>
                  Browse Library
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedDrills.map(drill => (
                  <DrillCard
                    key={drill.id}
                    drill={drill}
                    isSaved={true}
                    onView={handleViewDrill}
                    onSave={handleRemoveDrill}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Account Section */}
        <div className="form-section border-destructive/30">
          <div className="form-section-title text-destructive">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </div>

          <div className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your profile settings, saved drills, and custom drills.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData}>
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Drill Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        isOpen={selectedDrill !== null}
        onClose={() => setSelectedDrill(null)}
        isSaved={true}
        onSave={handleRemoveDrill}
      />

      {/* Custom Drill Detail Modal */}
      <CustomDrillDetailModal
        drill={selectedCustomDrill}
        isOpen={selectedCustomDrill !== null}
        onClose={() => setSelectedCustomDrill(null)}
      />
    </div>
  );
}
