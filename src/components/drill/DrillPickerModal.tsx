import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { fetchDrills } from '@/lib/api';
import { Drill } from '@/types/drill';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DrillPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (drillId: string) => void;
}

export function DrillPickerModal({ isOpen, onClose, onSelect }: DrillPickerModalProps) {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDrills();
    }
  }, [isOpen]);

  const loadDrills = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDrills({});
      setDrills(data);
    } catch (error) {
      console.error('Failed to load drills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDrills = drills.filter((drill) =>
    drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drill.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Drill to Modify</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Drills Grid */}
          <ScrollArea className="h-[50vh]">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredDrills.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No drills found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-4">
                {filteredDrills.map((drill) => (
                  <button
                    key={drill.id}
                    onClick={() => onSelect(drill.id)}
                    className="group p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-field rounded overflow-hidden mb-2">
                      {drill.svgUrl ? (
                        <img
                          src={drill.svgUrl}
                          alt={drill.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : drill.svg ? (
                        <img
                          src={`data:image/svg+xml;base64,${drill.svg}`}
                          alt={drill.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No preview</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {drill.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {drill.category}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
