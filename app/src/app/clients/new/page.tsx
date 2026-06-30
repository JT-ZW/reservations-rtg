'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth/auth-context';

interface ClientFormState {
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  is_active: boolean;
}

const initialFormState: ClientFormState = {
  organization_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Zimbabwe',
  notes: '',
  is_active: true,
};

export default function NewClientPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<ClientFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ClientFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      setError('You must be signed in to create a client.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          country: form.country.trim() || 'Zimbabwe',
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }

      router.push('/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Access required</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to create a client.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Client</h1>
            <p className="mt-1 text-sm text-gray-500">Create a new client profile for future bookings.</p>
          </div>
          <Link href="/clients">
            <Button variant="secondary" type="button">
              Back to Clients
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Organization Name"
              placeholder="Acme Holdings"
              required
              value={form.organization_name}
              onChange={(event) => handleChange('organization_name', event.target.value)}
            />
            <Input
              label="Contact Person"
              placeholder="Jane Doe"
              required
              value={form.contact_person}
              onChange={(event) => handleChange('contact_person', event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="client@example.com"
              required
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
            />
            <Input
              label="Phone"
              placeholder="+263 771 234 567"
              required
              value={form.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
            />
            <Input
              label="Address"
              placeholder="10 Main Street"
              value={form.address}
              onChange={(event) => handleChange('address', event.target.value)}
            />
            <Input
              label="City"
              placeholder="Harare"
              value={form.city}
              onChange={(event) => handleChange('city', event.target.value)}
            />
            <Input
              label="Country"
              placeholder="Zimbabwe"
              value={form.country}
              onChange={(event) => handleChange('country', event.target.value)}
            />
          </div>

          <Input
            label="Notes"
            placeholder="Any special notes for this client"
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
          />

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => handleChange('is_active', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            Active client
          </label>

          <div className="flex justify-end gap-2">
            <Link href="/clients">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
