//==================================================================================
//pages.Register.tsx - Page d inscription
// 
// Similaire à Login.tsx avec un formulaire multi-champs
// Utilise un état objet unique (form) plutot qu un useState par champs
// ce qui simplifie la gestion quand le nb de champs est élevé
//==================================================================================

// FormEvent : type de l'événement <form onSubmit>
// ChangeEvent : type de l'événement onChange d'un input/select
import { useState, FormEvent, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

// ---- Classes CSS réutilisables ----
// On extrait les classes Tailwind répétées dans des constantes
// pour éviter la duplication et faciliter la maintenance.
const inputCls =
  'w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'

const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // ---- État unique pour tout le formulaire ----
  // Un seul useState avec un objet plutôt que 5 useState séparés.
  // handleChange met à jour n'importe quel champ via le name de l'input.
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    weight: '',
    goal: 'maintain', // Valeur par défaut correspondant à l'ENUM en BDD
  })

  // handleChange générique : e.target.name identifie le champ modifié
  // Le spread { ...form } crée une copie, puis [e.target.name] met à jour le champ
  // Cette technique évite d'écrire un handler par champ (setUsername, setEmail, etc.)
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        // weight est une chaîne dans le formulaire HTML → on la convertit en nombre
        // Si vide, on envoie undefined (le backend accepte weight optionnel)
        weight: form.weight ? Number(form.weight) : undefined,
        goal: form.goal,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(message || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FitTrack</h1>
          <p className="text-slate-400 text-sm mt-1">Crée ton compte gratuitement</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nom d'utilisateur</label>
              {/* name="username" est utilisé par handleChange pour identifier le champ */}
              <input
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className={inputCls}
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className={inputCls}
                placeholder="ton@email.com"
              />
            </div>

            <div>
              <label className={labelCls}>Mot de passe</label>
              {/* minLength={6} : validation HTML native (doublée côté backend) */}
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className={inputCls}
                placeholder="6 caractères minimum"
              />
            </div>

            {/* Grille 2 colonnes : poids et objectif côte à côte */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Poids (kg)</label>
                {/* step="0.1" : permet des valeurs décimales (ex: 75.5 kg) */}
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={form.weight}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="75"
                />
              </div>
              <div>
                <label className={labelCls}>Objectif</label>
                {/* select contrôlé : même pattern que les inputs */}
                <select
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="lose">Perdre</option>
                  <option value="maintain">Maintenir</option>
                  <option value="gain">Prendre</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}