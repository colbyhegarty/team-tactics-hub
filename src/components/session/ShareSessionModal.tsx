import { useState } from 'react';
import { Mail, MessageSquare, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Contact, getContacts } from '@/lib/contactsStorage';
import { Session } from '@/types/session';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShareSessionModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareSessionModal({ session, isOpen, onClose }: ShareSessionModalProps) {
  const [contacts] = useState<Contact[]>(() => getContacts());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleContact = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleShare = (method: 'email' | 'text') => {
    const selectedContacts = contacts.filter(c => selected.has(c.id));
    if (selectedContacts.length === 0) {
      toast({ title: 'Select at least one contact', variant: 'destructive' });
      return;
    }

    // For now, show a toast since actual sending requires a backend
    const names = selectedContacts.map(c => c.name).join(', ');
    toast({
      title: `Share via ${method === 'email' ? 'Email' : 'Text'}`,
      description: `Session PDF for "${session.title}" would be sent to ${names}. Enable Lovable Cloud to activate sending.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Share Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select contacts to share <span className="font-medium text-foreground">"{session.title}"</span> with:
          </p>

          {contacts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No contacts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add contacts in your profile settings first</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {contacts.map(contact => {
                const isSelected = selected.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors border ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-secondary/50'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isSelected ? <Check className="h-4 w-4" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {contact.email || contact.phone}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {contacts.length > 0 && (
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleShare('email')}
                disabled={selected.size === 0}
              >
                <Mail className="h-4 w-4 mr-2" /> Email PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleShare('text')}
                disabled={selected.size === 0}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Text PDF
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
