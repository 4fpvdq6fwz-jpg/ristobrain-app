'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import AppLayout from '@/components/AppLayout';
import KpiCard from '@/components/KpiCard';
import AiAssistant from '@/components/AiAssistant';
import { useLang } from '@/components/LanguageProvider';
import { salesApi, menusApi, ingredientsApi, recipesApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { t, lang } = useLang();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      salesApi.list().catch(() => ({ data: [] })),
      menusApi.list().catch(() => ({ data: [] })),
      ingredientsApi.list().catch(() => ({ data: [] })),
      recipesApi.list().catch(() => ({ data: [] })),
    ]).then(([s, m, i, r]) => {
      setSalesData(s.data || []);
      setMenus(m.data || []);
      setIngredients(i.data || []);
      setRecipes(r.data || []);
      setLoading(false);
    });
  }, []);

  const totalRevenue = salesData.reduce((s: number, p: any) => s + parseFloat(p.total_revenue || 0), 0);
  const activeMenu = menus.find((m: any) => m.is_current);
  const avgFc = activeMenu ? parseFloat(activeMenu.avg_fc_pct || 0) : 0;

  const onboardingSteps = [
    { done: ingredients.length > 0, labelKey: 'dashboard.stepIngredients', href: '/ingredients', icon: '🥬' },
    { done: recipes.length > 0, labelKey: 'dashboard.stepRecipes', href: '/recipes', icon: '📖' },
    { done: menus.length > 0, labelKey: 'dashboard.stepMenus', href: '/menus', icon: '🍽️' },
    { done: salesData.length > 0, labelKey: 'dashboard.stepSales', href: '/sales', icon: '🛒' },
  ];
  const setupComplete = onboardingSteps.every((s) => s.done);

  const chartData = salesData.slice(0, 6).map((p: any) => ({
    name: p.name?.replace('Novembre', 'Nov').replace('Ottobre', 'Ott') || 'Periodo',
    revenue: parseFloat(p.total_revenue || 0),
    covers: parseInt(p.total_covers || 0),
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-dark-200 text-sm mt-1">{t('dashboard.subtitle')}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">{t('common.loading')}</div>
        ) : (
          <>
            {/* Onboarding guidato (nuovo workspace) */}
            {!setupComplete && (
              <div className="card-dark mb-6 border border-brand-600/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={18} className="text-brand-400" />
                  <h2 className="text-base font-semibold text-white">{t('dashboard.onboardingTitle')}</h2>
                </div>
                <p className="text-dark-300 text-sm mb-4">{t('dashboard.onboardingSubtitle')}</p>

                {/* Percorso veloce: carica una fattura */}
                <Link
                  href="/fatture"
                  className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/15 transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-brand-400" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{t('dashboard.fastPathTitle')}</p>
                    <p className="text-xs text-dark-300">{t('dashboard.fastPathDesc')}</p>
                  </div>
                  <ChevronRight size={16} className="text-brand-400" />
                </Link>

                <p className="text-xs text-dark-400 mb-2">{t('dashboard.orStepByStep')}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {onboardingSteps.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors',
                        s.done ? 'border-green-600/30 bg-green-500/5' : 'border-dark-600 hover:bg-dark-700'
                      )}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className={clsx('flex-1 text-sm', s.done ? 'text-dark-300 line-through' : 'text-white')}>{t(s.labelKey)}</span>
                      {s.done
                        ? <CheckCircle2 size={18} className="text-green-400" />
                        : <ChevronRight size={16} className="text-dark-400" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                title={t('dashboard.totalRevenue')}
                value={`€${totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`}
                subtitle={`${salesData.length} ${t('dashboard.periodsAnalyzed')}`}
                icon="💶"
                color="green"
              />
              <KpiCard
                title={t('dashboard.foodCost')}
                value={avgFc > 0 ? `${avgFc.toFixed(1)}%` : 'N/D'}
                subtitle={`${t('dashboard.target')}: ≤ 30%`}
                icon="📊"
                color={avgFc > 0 && avgFc <= 30 ? 'green' : avgFc > 35 ? 'red' : 'orange'}
              />
              <KpiCard
                title={t('dashboard.ingredients')}
                value={ingredients.length}
                subtitle={t('dashboard.inDatabase')}
                icon="🥬"
                color="blue"
              />
              <KpiCard
                title={t('dashboard.activeMenus')}
                value={menus.filter((m: any) => m.is_current).length}
                subtitle={activeMenu?.name || t('dashboard.noActiveMenu')}
                icon="📋"
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue chart */}
              <div className="card-dark">
                <h2 className="text-base font-semibold text-white mb-4">{t('dashboard.revenueByPeriod')}</h2>
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
                    {lang === 'en' ? 'No sales data yet. Add data from the Sales section.' : 'Nessun dato vendite. Carica i dati dalla sezione Vendite.'}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="card-dark">
                <h2 className="text-base font-semibold text-white mb-4">{t('dashboard.lastPeriods')}</h2>
                {salesData.length > 0 ? (
                  <div className="space-y-3">
                    {salesData.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-dark-300">{p.total_covers} {t('dashboard.covers')}</p>
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
                    <p>{lang === 'en' ? 'No data yet.' : 'Nessun dato ancora.'}</p>
                    <p>{lang === 'en' ? 'Go to Sales to get started.' : 'Vai su Vendite per iniziare.'}</p>
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
