'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import KpiCard from '@/components/KpiCard';
import AiAssistant from '@/components/AiAssistant';
import { salesApi, menusApi, ingredientsApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      salesApi.list().catch(() => ({ data: [] })),
      menusApi.list().catch(() => ({ data: [] })),
      ingredientsApi.list().catch(() => ({ data: [] })),
    ]).then(([s, m, i]) => {
      setSalesData(s.data || []);
      setMenus(m.data || []);
      setIngredients(i.data || []);
      setLoading(false);
    });
  }, []);

  const totalRevenue = salesData.reduce((s: number, p: any) => s + parseFloat(p.total_revenue || 0), 0);
  const activeMenu = menus.find((m: any) => m.is_current);
  const avgFc = activeMenu ? parseFloat(activeMenu.avg_fc_pct || 0) : 0;

  const chartData = salesData.slice(0, 6).map((p: any) => ({
    name: p.name?.replace('Novembre', 'Nov').replace('Ottobre', 'Ott') || 'Periodo',
    revenue: parseFloat(p.total_revenue || 0),
    covers: parseInt(p.total_covers || 0),
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-200 text-sm mt-1">Panoramica del tuo ristorante</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">Caricamento...</div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                title="Revenue totale"
                value={`€${totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`}
                subtitle={`${salesData.length} periodi analizzati`}
                icon="💶"
                color="green"
              />
              <KpiCard
                title="Food Cost %"
                value={avgFc > 0 ? `${avgFc.toFixed(1)}%` : 'N/D'}
                subtitle={`Target: ≤ 30%`}
                icon="📊"
                color={avgFc > 0 && avgFc <= 30 ? 'green' : avgFc > 35 ? 'red' : 'orange'}
              />
              <KpiCard
                title="Ingredienti"
                value={ingredients.length}
                subtitle="Nel database"
                icon="🥬"
                color="blue"
              />
              <KpiCard
                title="Menu attivi"
                value={menus.filter((m: any) => m.is_current).length}
                subtitle={activeMenu?.name || 'Nessun menu attivo'}
                icon="📋"
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue chart */}
              <div className="card-dark">
                <h2 className="text-base font-semibold text-white mb-4">Revenue per Periodo</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: '#242424', border: '1px solid #3a3a3a', borderRadius: 8 }}
                        labelStyle={{ color: '#f5f5f5' }}
                        formatter={(v: any) => [`€${v.toLocaleString('it-IT')}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#f97316' : '#3a3a3a'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-dark-300 text-sm">
                    Nessun dato vendite. Carica i dati dalla sezione Vendite.
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="card-dark">
                <h2 className="text-base font-semibold text-white mb-4">Ultimi Periodi</h2>
                {salesData.length > 0 ? (
                  <div className="space-y-3">
                    {salesData.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-dark-300">{p.total_covers} coperti</p>
                        </div>
                        <p className="text-sm font-semibold text-brand-400">
                          €{parseFloat(p.total_revenue || 0).toLocaleString('it-IT')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-dark-300 text-sm">
                    <div className="text-4xl mb-3">📊</div>
                    <p>Nessun dato ancora.</p>
                    <p>Vai su <strong>Vendite</strong> per iniziare.</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant */}
            <AiAssistant />
          </>
        )}
      </div>
    </AppLayout>
  );
}
