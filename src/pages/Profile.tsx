import { useState, useEffect } from 'react';
import { User, Settings, Trash2, LogOut, Save, BookmarkX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { getUserProfile, saveUserProfile, getSavedDrills, removeDrill, clearAllData } from '@/lib/storage';
import { UserProfile, Drill, AgeGroup, SkillLevel } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ageGroups: AgeGroup[] = [
  'U8', 'U10', 'U12', 'U14', 'U16', 'U18',
  'College', 'Semi-Pro', 'Professional', 'Recreational Adult', 'Not Specified',
];

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Not Specified'];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [savedDrills, setSavedDrills] = useState<Drill[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSavedDrills(getSavedDrills());
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

  const handleClearAllData = () => {
    clearAllData();
    setProfile(getUserProfile());
    setSavedDrills([]);
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your settings and saved drills
          </p>
        </div>
      </header>

      <div className="container max-w-2xl py-6 px-4 space-y-8">
        {/* User Info Section */}
        <div className="form-section">
          <div className="form-section-title">
            <User className="h-4 w-4" />
            Profile Information
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {profile.name || 'Coach'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile.teamName || 'No team set'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
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

        {/* Default Settings Section */}
        <div className="form-section">
          <div className="form-section-title">
            <Settings className="h-4 w-4" />
            Default Settings
          </div>
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
              Save Defaults
            </Button>
          </div>
        </div>

        {/* Saved Drills Section */}
        <div className="form-section">
          <div className="form-section-title">
            <BookmarkX className="h-4 w-4" />
            Saved Drills ({savedDrills.length})
          </div>

          {savedDrills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No saved drills yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save drills from the Library or after generating them.
              </p>
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
        </div>

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
                    This action cannot be undone. This will permanently delete your profile settings and all saved drills.
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
    </div>
  );
}
