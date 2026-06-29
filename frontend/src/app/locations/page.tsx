'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { locationsApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { MapPin, Pencil, X, Check } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  seats?: number;
  cuisine_type?: string;
  target_fc_default: number;
}

interface EditForm {
  name: string;
  address: string;
  city: string;
  seats: string;
  cuisineType: string;
  targetFcDefault: string;
}

export default function LocationsPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', address: '', city: '', seats: '', cuisineType: '', targetFcDefault: '30',
  });
  const [saving, setSaving] = useState(false);

  // Stato per aggiunta nuovo locale
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>({
    name: '', address: '', city: '', seats: '', cuisineType: '', targetFcDefault: '30',
  });
  const [addingSaving, setAddingSaving] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await locationsApi.list();
      setLocations(res.data || []);
    } catch {
      toast.error(en ? 'Error loading locations' : 'Errore nel caricamento dei locali');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name || '',
      address: loc.address || '',
      city: loc.city || '',
      seats: loc.seats?.toString() || '',
      cuisineType: loc.cuisine_type || '',
      targetFcDefault: loc.target_fc_default?.toString() || '30',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim()) {
      toast.error(en ? 'Location name is required' : 'Il nome del locale è obbligatorio');
      return;
    }
    setSaving(true);
    try {
      await locationsApi.update(id, {
        name: editForm.name,
        address: editForm.address || null,
        city: editForm.city || null,
        seats: editForm.seats ? parseInt(editForm.seats) : null,
        cuisineType: editForm.cuisineType || null,
        targetFcDefault: parseFloat(editForm.targetFcDefault) || 30,
      });
      toast.success(en ? 'Location updated' : 'Locale aggiornato');
      setEditingId(null);
      await loadLocations();
    } catch {
      toast.error(en ? 'Error saving' : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const addLocation = async () => {
    if (!addForm.name.trim()) {
      toast.error(en ? 'Location name is required' : 'Il nome del locale è obbligatorio');
      return;
    }
    setAddingSaving(true);
    try {
      await locationsApi.create({
        name: addForm.name,
        address: addForm.address || null,
        city: addForm.city || null,
        seats: addForm.seats ? parseInt(addForm.seats) : null,
        cuisineType: addForm.cuisineType || null,
        targetFcDefault: parseFloat(addForm.targetFcDefault) || 30,
      });
      toast.success(en ? 'Location added' : 'Locale aggiunto');
      setShowAddForm(false);
      setAddForm({ name: '', address: '', city: '', seats: '', cuisineType: '', targetFcDefault: '30' });
      await loadLocations();
    } catch {
      toast.error(en ? 'Error saving' : 'Errore nel salvataggio');
    } finally {
      setAddingSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{en ? 'Locations' : 'Locali'}</h1>
            <p className="text-dark-200 text-sm mt-1">{en ? 'Manage your outlets' : 'Gestisci i tuoi punti vendita'}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {en ? '+ New location' : '+ Nuovo locale'}
          </button>
        </div>

        {showAddForm && (
          <div className="card-dark mb-6 border border-brand-500/30">
            <h3 className="text-sm font-semibold text-white mb-4">{en ? 'New location' : 'Nuovo locale'}</h3>
            <LocationForm
              en={en}
              form={addForm}
              onChange={setAddForm}
              onSave={addLocation}
              onCancel={() => { setShowAddForm(false); setAddForm({ name: '', address: '', city: '', seats: '', cuisineType: '', targetFcDefault: '30' }); }}
              saving={addingSaving}
              saveLabel={en ? 'Add location' : 'Aggiungi locale'}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="card-dark">
                {editingId === loc.id ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">{en ? 'Edit location' : 'Modifica locale'}</span>
                      <button onClick={cancelEdit} className="text-dark-400 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <LocationForm
                      en={en}
                      form={editForm}
                      onChange={setEditForm}
                      onSave={() => saveEdit(loc.id)}
                      onCancel={cancelEdit}
                      saving={saving}
                      saveLabel={en ? 'Save changes' : 'Salva modifiche'}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-600/20 rounded-lg">
                      <MapPin size={18} className="text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{loc.name}</h3>
                      {(loc.address || loc.city) && (
                        <p className="text-sm text-dark-300 mt-0.5">
                          {[loc.address, loc.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-dark-300">
                        {loc.seats && <span>🪑 {loc.seats} {en ? 'seats' : 'coperti'}</span>}
                        {loc.cuisine_type && <span>🍽️ {loc.cuisine_type}</span>}
                        <span>Target FC: {loc.target_fc_default}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(loc)}
                      className="p-1.5 text-dark-400 hover:text-brand-400 transition-colors rounded"
                      title={en ? 'Edit' : 'Modifica'}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {locations.length === 0 && !showAddForm && (
              <div className="col-span-2 text-center py-16 text-dark-300">
                <div className="text-5xl mb-3">🏪</div>
                <p className="mb-2">{en ? 'No location configured.' : 'Nessun locale configurato.'}</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {en ? 'Add your first location →' : 'Aggiungi il tuo primo locale →'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function LocationForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  saveLabel,
  en,
}: {
  form: EditForm;
  onChange: (f: EditForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel: string;
  en: boolean;
}) {
  const field = (key: keyof EditForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-dark-300 mb-1 block">{en ? 'Location name *' : 'Nome locale *'}</label>
        <input
          type="text"
          {...field('name')}
          placeholder={en ? 'e.g. Downtown Restaurant' : 'es. Ristorante Centro'}
          className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-dark-300 mb-1 block">{en ? 'Address' : 'Indirizzo'}</label>
          <input
            type="text"
            {...field('address')}
            placeholder="Via Roma, 1"
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-dark-300 mb-1 block">{en ? 'City' : 'Città'}</label>
          <input
            type="text"
            {...field('city')}
            placeholder="Milano"
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-dark-300 mb-1 block">{en ? 'Seats' : 'Coperti'}</label>
          <input
            type="number"
            {...field('seats')}
            placeholder="40"
            min="0"
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-dark-300 mb-1 block">Target Food Cost %</label>
          <input
            type="number"
            {...field('targetFcDefault')}
            placeholder="30"
            min="1"
            max="100"
            step="0.5"
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-dark-300 mb-1 block">{en ? 'Cuisine type' : 'Tipo cucina'}</label>
        <input
          type="text"
          {...field('cuisineType')}
          placeholder={en ? 'e.g. Italian, Fusion, Japanese...' : 'es. Italiana, Fusion, Giapponese...'}
          className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Check size={14} />
          {saving ? (en ? 'Saving...' : 'Salvo...') : saveLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-dark-300 hover:text-white text-sm transition-colors"
        >
          {en ? 'Cancel' : 'Annulla'}
        </button>
      </div>
    </div>
  );
}
