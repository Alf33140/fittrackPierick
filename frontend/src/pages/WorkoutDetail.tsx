//=========================================================================
//pages/workoutDetail.tsx  Detail d'une seance avec edition inline
//
//Page la plus avancée du projet. elle illustre:
// - useParams: récupération de l'id depuis l'URL (/workouts/id)
// - Promise.all: chargement parallele des donnees 
// - Edition inline (par exercice) sans rechargement de page
// - Etat par identifiant: Record<number, ...> pour gérer plusieurs
// etats independants (édition,*/sauvegarde/suppression par exercice)
//========================================================================

import {useEffect, useState, ChangeEvent } from 'react'
// useParams: lit les segments dynamiques de l'url (/workout/:id -> params.id)
//useNavigate: redirection programmatique
import {useParams, useNavigate, Link } from 'react-router-dom'
import {
   ArrowLeft, Calendar, Clock, FileText, Dumbbell,
    Plus, Pencil, Trash2, Check, X, Loader2,

} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Workout, Exercise, WorkoutExercise } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import { setScale } from 'recharts/types/state/layoutSlice'

const CAT_COLORS: Record<string, string> ={
    Musculation: 'bg-indigo-500/15 text-indigo-300',
    Cardio: 'bg-amber-500/15 text-amber-300',
    Flexibilité: 'bg-emerald-500/15 text-emerald-300',
}
const CAT_TEXT: Record<string, string> ={
    Musculation: 'text-indigo-400',
    Cardio: 'text-amber-400',
    Flexibilité: 'text-emerald-400',
}
function formatDate(d: string) {
    const [y, mo, day] =d.slice(0, 10).split('-').map(Number)
    return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',

    })
}

{/* Convertit des secindes en "X min Y s" */}
function formatDuration(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60
  return m > 0 ? `${m} min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

// Type pour l'etat d'edition d'un exercice (tous strings pour les input)
type EditState = { sets: string; reps: string; weight_used: string; duration: string }

const miniInput = 
    'w-full px-2 bg-slate-900 border border-slate-600 rounded text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export default function WorkoutDetail() {
    // useParams extrait l'id de l'URL : /workouts/42 → id = "42"
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [workout, setWorkout] = useState<Workout | null>(null)
    const [allExercises, setAllExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState <number | null>(null)

    // etat par exercise (keyed by weId = WorkoutExercise.id)
    // Record<number, T > = objet indéxé par un nombre
    // Permet de gérer l etat d'edition de CHAQUE exercice indépendémment
    // sans que la modification d'un n affecte les autres

    const [editing, setEditing ] = useState<Record<number, EditState>>({})
    const [saving, setSaving ] = useState<Record<number, boolean>>({})
    const [deleting, setDeleting] = useState<number | null>(null) // un seul a la fois

    //Etat du panel d ajout d exercice
    const [addOpen, setAddOpen ] = useState(false)
    const [addForm, setAddForm  ] = useState({ exercise_id: 0, sets: '', reps: '', weight_used: '', duration: ''})
    const [addSaving, setAddSaving ] = useState(false)

    // chargement de la seance + liste d exercices disponibles
    // Promise.all attends que les deux requetes soient terminées avant de mettre à jour l etat
    useEffect(() => {
        if(!id) return
        Promise.all([
            api.get(`/workouts/${id}`),
            api.get(`/exercises`),
        ])

        .then(([wRes, eRes]) => {
            setWorkout(wRes.data.workout)
            setAllExercises(eRes.data.exercises)
            // Pre selectionne le premier exercice  disponible ds le formulaire d'ajout
            setAddForm((f) => ({ ...f, exercise_id: eRes.data.exercises[0]?.id ?? 0 }))
        })
        .catch(() => { toast.error('seance introuvable'); navigate('/workouts') })
        .finally(() => setLoading(false))

}, [id, navigate]) //se re decle,che si id change (navigation entre seances)

//  Gestion de l edition inline
// 
// Passe un exercice en mode edition (remplit l etat editing[ex.id])
const startEdit = (ex: WorkoutExercise) => {
    setEditing((prev) => ({
        ...prev, // On conserve les autres exercices en cours d edition
        [ex.id]: {
            sets:   ex.sets  !=null ?String(ex.sets) : '',
            reps:   ex.reps  !=null ?String(ex.reps) : '',
            weight_used:   ex.weight_used  !=null ?String(ex.weight_used) : '',
            duration:   ex.duration  !=null ?String(ex.duration) : '',
        },
    }))
}

// Annule l'edition en supprimant l entrée de editing
const cancelEdit = (weId: number) => {
    setEditing((prev) => {
        const n = { ...prev}
        delete n[weId] // Supprime la clé -> l'exercice repasse en mode lecture
        return n
    })
}

// Met a jour un champs de l etat d'edition d un exercice spécifique 
const changeEdit = (weId: number, field: keyof EditState, value: string) => {
    setEditing((prev) => ({ ...prev, [weId]: { ...prev[weId], [field]: value } }))
}

// Sauvegarde les modifications d'un exercice  (PATCH /workouts/:id/exercises/:weId)
const savEdit = async (weId: number) => {
    if (!id) return
    setSaving((prev) => ({ ...prev, [weId]: true })) //Active le spinner pour cezt exercice
    try {
        const f = editing[weId]
        const res = await api.patch(`/workouts/${id}/exercises/${weId}`, {
            sets: f.sets ? Number(f.sets) : null,
            reps: f.reps ? Number(f.reps) : null,
            weight_used: f.weight_used ? Number(f.weight_used) : null,
            duration: f.duration ? Number(f.duration) : null,
        })

        setWorkout(res.data.workout) // Met a jour l affichage avec les nouvelles valeurs
        cancelEdit(weId) // Repasse en mode Lecture
        toast.success('exercice mis a jour')
    } catch {
        toast.error('erreur lors de la mise a jour')

    } finally {
        setSaving((prev) => ({ ...prev, [weId]: false}))
    }
}
// ---- Suppression d'un exercice de la séance ----
  const confirmDelete = async (weId: number) => {
    if (!id) return
    setDeleting(weId) // Affiche le spinner sur cet exercice
    try {
      const res = await api.delete(`/workouts/${id}/exercises/${weId}`)
      setWorkout(res.data.workout) // L'API retourne la séance mise à jour
      toast.success('Exercice retiré')
    } catch {
      toast.error("Impossible de retirer l'exercice")
    } finally {
      setDeleting(null)
    }
  }

  // ---- Ajout d'un exercice à la séance ----
  const selectedEx = allExercises.find((e) => e.id === addForm.exercise_id)
  const isCardioAdd = selectedEx?.category === 'Cardio'

  const handleAddChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // exercise_id est un nombre (id), les autres champs sont des strings
    const val = e.target.name === 'exercise_id' ? Number(e.target.value) : e.target.value
    setAddForm((f) => ({ ...f, [e.target.name]: val }))
  }

  const submitAdd = async () => {
    if (!id || !addForm.exercise_id) return
    setAddSaving(true)
    try {
        const res = await api.post(`/workouts/${id}/exercises`, {
            exercise_id: addForm.exercise_id,
            sets: addForm.sets ? Number(addForm.sets) :null,
            reps: addForm.reps ? Number(addForm.reps) :null,
            weight_used: addForm.weight_used ? Number(addForm.weight_used) :null,
            duration: addForm.duration ? Number(addForm.duration) :null,
        })
        setWorkout(res.data.workout)
        // On reinitialise les champs mais on garde le selecteur d'exercice
        setAddForm((f) => ({...f, sets: '', reps: '', weight_used: '', duration: ''}))
        setAddOpen(false)
        toast.success('Exercice ajouté')

    } catch{
        toast.error("impossible d'ajouter l exerciceé")

    } finally {
        setAddSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!workout) return null // cas improbable mais typeScript l'exige

const Exercises = workout.exercises ?? []

return (
    <div className="space-y-5 max-w-2xl">
        {/* Lien retour */}
        <Link to="/workouts" className='inline-flex  items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors'>
            <ArrowLeft size={15} /> Retour aux séences
        </Link>
        {/* En-tete de seance */}
        <div className='bg-[1E293B] border border-slate-700/50 rounded-2xl p-6 space-y-4'>
            <h1 className='text-xl font-bold text-slate-100'>{workout.title}</h1>
                <div className='flex flex-xrap gap-4'>
                    <span className='flex items-center gap-2 text-sm text-slate-400'>Calendar size={14} className="text-slate-500" /> {formatDate(workout.date)}</span>
                    {workout.duration && <span className="flex items-center gap-2 text-sm text-slate-400"><Clock size={14} className="text-slate-500" />{workout.duration} minutes</span>}
                    </div>
                    
                    {workout.notes && [
                        <div className='flex itels-start gap-2 pt-3 border-t border-slate-700/50'>
                                <FileText size={14} className='text-slate-500 mt-0.5 shrink-0' />
                                <p className='text-sm text-slate-400'> {workout.notes}</p>
                        </div>
                    ]}
     {/* Section Exercises */}
                    <div className='bg-["1E293 border border-slate-700/50 rounded-2xl p-6 '>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center gap-2'>
                                <Dumbbell size={16} className='text-slate-500 '/>
                                <h2 className='text-sm  font-semibold text-slate-500'>
                                Exercices
                                {Exercises.length > 0 && <span className='ml-2 text-xs font-normal text-slate-500'> ({Exercises.length })</span>}
                            </h2>
                            </div>
                         {/* Toggle du panel d ajout */}
                         <button onClick={() => { setAddOpen((v) => !v)}} className='flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors '>
                            <Plus size={13} />
                            Ajouter 
                         </button>
                        </div>
                           {/* Panel d'jout d un exercice  (toggle)  */}
                           {addOpen && (
                            <div className='mb-4 bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-3'>
                                <p className='text-xs font-medium text-slate-300'>Nouvel exercice</p>
                                <select name="exercise_id" value={addForm.exercise_id} onChange={handleAddChange} className='w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ouline-none focus:ring-1 focus:ring-indigo-500 '>
                                    {allExercises.map((ex) => (<option key={ex.id} value={ex.id}>{ex.name} - {ex.category}</option> ))} 
                                </select>
                            </div>
                            {selectedEx && <p className={`text-xs font-medium ${CAT_TEXT[selectedEx.category] ?? 'text-slate-400'}`}>{selectedEx.category}{selectedEx.muscle_group ?  · ${selectedEx.muscle_group} : ''}</p>}


                            {/* Champs adapté selon la category */}

                            {isCardioAdd ?(
                                <div>
                                    <label className='text-xs text-slate-500'> Durée (secondes)</label>
                                    <input type="number" name={name} onVolumeChangeCapture={(adForm as Record<string, string | number>)[name] as string} onChange={handleAddChange} placeholder={ph} className='{`mt-1 ${miniInput}`} />
                                </div>

                            ) : (

                           ))}
                        </div>
                    )}
                    
                    <div 
                    </div>

        </div>
    </div>
)