// ============================================================
// types/index.ts — Interfaces TypeScript partagées de FitTrack
//
// Ce fichier centralise tous les types métier de l'application.
// Chaque interface reflète exactement la structure retournée par l'API REST,
// ce qui garantit la cohérence entre le backend et le frontend.
// Importez ces types dans n'importe quel composant ou service avec :
//   import { User, Workout, ... } from '../types'
// ============================================================

// ---- User ----
// Correspond à la table `User` en base (sans le champ password, jamais exposé)
export interface User {
    id: number
    username: string
    email: string
    weight: number | null //null si l'utilisateur n'a pas renseigné son poids
    goal: 'lose' | 'maintain' | 'gain' // Objectif fitness (union littérale = valeurs fixes)
    created_at: string //ISO8601, ex: "2024-01-15T10:30:00.000Z"
}

//----- Exercise ------
// Exercice de la bibliothèque partagée (accessible à tous les utilisateurs)
export interface Exercise {
    id : number
    name: string
    category: 'Musculation' | 'Cardio' | 'Flexibilité' // ENUM côté mySQL
    muscle_group: string | null
    description: string | null
    created_at: string
}

// ------- WorkoutExercise -------
// Représente un exercice tel qu'il a été réalisé dans une séance spécifique.
//C'est la table de jointure WorkoutExercice enrichie des infos de l'exercice source
// Les champs sets/reps/weight_used/duration sont tous optionnels (null) selon le type :
// Musculation : sets + reps + weight_used
// Cardio : duration (secondes)
export interface WorkoutExercise {
    id: number
    workout_id: number //Clé étrangère vers Workout.id
    exercise_id: number //Clé étrangère vers Exercise.id
    name: string //Dénormalisé depuis Exercise pour affichage immédiat
    category: string
    muscle_group : string | null
    sets: number | null
    reps: number | null
    weight_used: number | null //Poids en kg
    duration: number | null // Durée en secondes (cardio)
}

// ------- Workout ---------
//séance d'entraïnement appartenant à un utilisateur.
// Les champs marqué ? sont optionnels: ils ne sont présents que dans certain
//endpoints (e: exercises est inclus dans GET /Workoits/:id mais pas dans un GET /workouts)
export interface Workout {
    id: number
    user_id: number
    title: string
    date: string // FOrmat DATE MySQL :"YYY-MM-DD"
    duration: number | null // durée totale en minute
    notes: string | null
    created_at: string
    updated_at: string
    exercise_count? :number //Nombre d'exercices, fourni par la liste (agrégat SQL)
    exercises?: WorkoutExercise[] //détail complet, fourni uniqement par GET /:id
}

// ============= Progression stats =====
// Réponse complète de GET /api/stats/progression.
// Regroupe le profil utilisateur et quatre jeu de statistique calculé coté backend.
export interface ProgressionStats{
    user: {
        username: string
        weight: number | null
        goal: 'lose' | 'maintain' | 'gain'
        member_since: string // date d'inscription (created_at du User)
    }
    stats: {
        // totaux globaux  depuis la création du compte
        summary : {
            total_workouts: number
            total_minutes: number
            avg_duration: number // moyenne en minute par séance
            unique_exercises: number // Nombre d'exercices distinct réalisés
        }
        //Activité par mois (12 derniers), utilisée pour le graphique du dashboard
        monthly: Array<{
            month: string // format "YYYY-MM", ex "2024-03"
            workout_count: number
            total_minutes: number
        }>
        // répartition par catégorie d'exercice (Muscu/ cardio/ Flexi)
        byCategory: Array <{
            category: string
            exercise_count: number
            total_reps: number // total des réps sur toutes les séances
        }>
        // Dernière séances (pour las section activité récent du dashboard)
        recent: Array<{ 
            id: number
            title: string 
            date: string 
            duration: number | null
        }>
    }
}