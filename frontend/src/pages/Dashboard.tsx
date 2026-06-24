// ============================================================
// pages/Dashboard.tsx — Tableau de bord
//
// Page principale après connexion. Elle affiche les statistiques
// de l'utilisateur via le hook useFetch (appel GET /api/stats/progression).
// Illustre : chargement asynchrone, rendu conditionnel, graphiques Recharts,
// et composant interne (StatCard).
// ============================================================

import { Link } from 'react-router-dom'
//
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Activity, Clock, Dumbbell, TrendingUp, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ProgressionStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

//Mapping valeur BDD -> label lisible
const GOAL_LABELS: Record<string, string > = {
    lose: 'Perte de poids',
    maintain: 'Maintien du poids',
    gain: 'Prise de masse',
}

//Mapping numéro de mois -> abréviation française
const MONTH_LABELS: Record<string, string> = {
    '01':'Jan', '02':'Fev', '03':'Mar', '04':'Avr',
    '05':'Mai', '06':'Juin', '07':'Juillet', '08':'Août',
    '09':'Sept', '10':'Oct', '11':'Nov', "12": 'Déc', 
}

// converti 2024-01 en -> "jan 24"
function formatMonth(m: string){
    const [year, month] = m.split('-')
    return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`
}

// Convertit  "2024-01-15" en date locale FR sans décalage horaire
// (new Date ('2024-01-15)' interprète en UTC -> problème de fuseau horaire)
function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Style du tooltip (info-bulle) du graphique Recharts
const tooltipStyle = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#F1F5F9'
}

export default function Dashboard() {
    const { user } = useAuth()

    //
    //
    const { data, loading} = useFetch<ProgressionStats>('/stats/progression')
    // rendu conditionnel: on attend la fin du chargement avant d'afficher
    if (loading) return <LoadingSpinner/>

    const stats = data?.stats // 

    // Préparation des données pour Recharts :
    // [...stats.monthly].reverse() remet les mois dans l'ordre chronologique
    // (l'API les retourne du plus récent au plus ancien)
    const chartData = stats
        ? [...stats.monthly].reverse().map((m) => ({
            name: formatMonth(m.month),
            Séances: m.workout_count,
            Minutes: m.total_minutes,
        }))
        :[]

        // Total pour calculer le pourcentage de chaque catégorie dans les barres
        const totalCategory = stats?.byCategory.reduce((acc, c) => acc + c.exercise_count, 0) || 1

return (
    <div className="space-y-6">
      {/* Header de bienvenue */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Bonjour, {user?.username} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Objectif : {GOAL_LABELS[user?.goal ?? 'maintain']}
          {user?.weight ? ` · ${user.weight} kg` : ''}
        </p>
      </div>

      {/* 4 cartes de statistiques — composant StatCard défini plus bas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={18} className="text-indigo-400" />}
          label="Séances totales"
          value={stats?.summary.total_workouts ?? 0}
          // ?? 0 : opérateur nullish coalescing, retourne 0 si null/undefined
          iconBg="bg-indigo-500/10"
        />
        <StatCard
          icon={<Clock size={18} className="text-violet-400" />}
          label="Minutes d'entraînement"
          value={stats?.summary.total_minutes ?? 0}
          iconBg="bg-violet-500/10"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          label="Durée moyenne"
          value={`${Math.round(stats?.summary.avg_duration ?? 0)} min`}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={<Dumbbell size={18} className="text-amber-400" />}
          label="Exercices différents"
          value={stats?.summary.unique_exercises ?? 0}
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Graphique mensuel + répartition par catégorie */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* BarChart Recharts — rendu conditionnel si données disponibles */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Séances par mois</h2>
          {chartData.length > 0 ? (
            // ResponsiveContainer adapte le graphique à la largeur du conteneur
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                {/* dataKey="Séances" doit correspondre à la clé dans chartData */}
                <Bar dataKey="Séances" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-16">
              Aucune donnée — commence ta première séance !
            </p>
          )}
        </div>

        {/* Barres de progression par catégorie */}
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Par catégorie</h2>
          {stats?.byCategory.length ? (
            <div className="space-y-4">
              {stats.byCategory.map((cat) => {
                // Calcul du pourcentage pour la largeur de la barre
                const pct = Math.min(100, (cat.exercise_count / totalCategory) * 100)
                const colors: Record<string, string> = {
                  Musculation: '#6366F1',
                  Cardio: '#F59E0B',
                  Flexibilité: '#10B981',
                }
                const color = colors[cat.category] ?? '#94A3B8'
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{cat.category}</span>
                      <span className="text-slate-300 font-medium">{cat.exercise_count}</span>
                    </div>
                    {/* Barre de progression avec largeur dynamique via style inline */}
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Liste des 5 dernières séances */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Dernières séances</h2>
          <Link to="/workouts" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Voir tout →
          </Link>
        </div>
        {stats?.recent.length ? (
          <div className="divide-y divide-slate-700/50">
            {stats.recent.map((w) => (
              // Chaque séance est un lien cliquable vers son détail
              <Link key={w.id} to={`/workouts/${w.id}`} className="flex items-center justify-between py-3 group">
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {w.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(w.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {w.duration && (
                    <span className="text-xs text-slate-500">{w.duration} min</span>
                  )}
                  <ChevronRight size={15} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">
            Aucune séance.{' '}
            <Link to="/workouts" className="text-indigo-400 hover:underline">
              Commence maintenant →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
// ============================================================
// StatCard — Composant interne réutilisable
// Défini dans le même fichier car utilisé uniquement ici.
// React.ReactNode : n'importe quel contenu React (JSX, string, number...)
// ============================================================
function StatCard({
  icon, label, value, iconBg,
}: {
  icon: React.ReactNode
  label: string
  value : number | string
  iconBg: string
}){
  return (
    <div className="bg-[#1E293B] border border-slate-700/50 rounded-2x1 p-5">
      <div className={`inline-flex p-2 rounded-lg ${iconBg} mb-3`}>{icon}</div>
      <p className="text-x1 font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )

}
