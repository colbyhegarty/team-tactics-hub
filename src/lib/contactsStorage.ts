export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const CONTACTS_KEY = 'drillforge_contacts';

export function getContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(CONTACTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveContact(contact: Omit<Contact, 'id'>): Contact {
  const contacts = getContacts();
  const newContact: Contact = { ...contact, id: crypto.randomUUID() };
  contacts.push(newContact);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  return newContact;
}

export function updateContact(contact: Contact): void {
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === contact.id);
  if (idx >= 0) {
    contacts[idx] = contact;
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }
}

export function deleteContact(id: string): void {
  const contacts = getContacts().filter(c => c.id !== id);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function clearContacts(): void {
  localStorage.removeItem(CONTACTS_KEY);
}
