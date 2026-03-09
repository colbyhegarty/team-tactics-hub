import { useState } from 'react';
import { Plus, Trash2, UserPlus, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact, getContacts, saveContact, deleteContact } from '@/lib/contactsStorage';
import { useToast } from '@/hooks/use-toast';

interface ContactsManagerProps {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
}

export function ContactsManager({ contacts, onContactsChange }: ContactsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      toast({ title: 'Email or phone is required', variant: 'destructive' });
      return;
    }
    saveContact({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    onContactsChange(getContacts());
    setName('');
    setEmail('');
    setPhone('');
    setIsAdding(false);
    toast({ title: 'Contact added' });
  };

  const handleDelete = (id: string) => {
    deleteContact(id);
    onContactsChange(getContacts());
    toast({ title: 'Contact removed' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Contacts</Label>
        </div>
        {!isAdding && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-xl border border-border bg-secondary/50 p-3 space-y-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name" className="text-xs">Name *</Label>
            <Input id="contact-name" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="text-xs">Email</Label>
            <Input id="contact-email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone" className="text-xs">Phone</Label>
            <Input id="contact-phone" type="tel" placeholder="+1 555 123 4567" value={phone} onChange={e => setPhone(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleAdd}>Save</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setIsAdding(false); setName(''); setEmail(''); setPhone(''); }}>Cancel</Button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !isAdding ? (
        <p className="text-xs text-muted-foreground py-2">No contacts yet. Add people to share sessions with them.</p>
      ) : (
        <div className="space-y-1.5">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-2.5 w-2.5" />{contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />{contact.phone}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDelete(contact.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
