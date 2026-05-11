'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { locationsApi, suppliersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, MapPin, Truck } from 'lucide-react';

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    locationsApi.list().then(res => {
      setLocations(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Locali</h1>
            <p className="text-dark-200 text-sm mt-1">Gestisci i tuoi punti vendita</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-dark-300">Caricamento...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locations.map((loc: any) => (
              <div key={loc.id} className="card-dark">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-600/20 rounded-lg">
                    <MapPin size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{loc.name}</h3>
                    {loc.address && <p className="text-sm text-dark-300 mt-0.5">{loc.address}, {loc.city}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-dark-300">
                      {loc.seats && <span>🪑 {loc.seats} coperti</span>}
                      {loc.cuisine_type && <span>🍽️ {loc.cuisine_type}</span>}
                      <span>Target FC: {loc.target_fc_default}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="col-span-2 text-center py-16 text-dark-300">
                <div className="text-5xl mb-3">🏪</div>
                <p>Nessun locale configurato.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
