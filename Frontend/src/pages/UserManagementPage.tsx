import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTeevo } from '@/store/TeevoContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { userSchema, formatZodErrors } from '@/lib/validation/schemas';
import type { User, UserRole } from '@/types/entities';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'club_admin', label: 'Club Admin' },
  { value: 'player', label: 'Player' },
];

export function UserManagementPage() {
  const { data, createUser, updateUser, deleteUser } = useTeevo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'player' as UserRole,
    clubId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', role: 'player', clubId: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      clubId: user.clubId ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      clubId: form.role === 'superadmin' ? null : form.clubId || null,
    };
    const result = userSchema.safeParse(payload);
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }
    const ok = editing
      ? updateUser(editing.id, result.data)
      : createUser(result.data as Omit<User, 'id'>);
    if (ok) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Add, edit, and manage platform users and club assignments."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-sand-300 bg-fairway-50">
              <tr className="text-left text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Club</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => {
                const club = user.clubId
                  ? data.clubs.find((c) => c.id === user.clubId)
                  : null;
                return (
                  <tr key={user.id} className="border-b border-sand-300/50">
                    <td className="px-5 py-3 font-medium">{user.name}</td>
                    <td className="px-5 py-3 text-muted">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge status={user.role} />
                    </td>
                    <td className="px-5 py-3 text-muted">{club?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(user)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${user.name}?`)) deleteUser(user.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit user' : 'Add user'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole, clubId: '' })
            }
            options={roleOptions.map((r) => ({ value: r.value, label: r.label }))}
          />
          {form.role !== 'superadmin' && (
            <Select
              label="Club"
              value={form.clubId}
              onChange={(e) => setForm({ ...form, clubId: e.target.value })}
              options={[
                { value: '', label: 'Select club…' },
                ...data.clubs.map((c) => ({ value: c.id, label: c.name })),
              ]}
              error={errors.clubId}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
