//==========================================================================
//tests/Dashboard.test.tsx / Tests du composant Dashboard
//
// Dashboard est asynchrone : il appelle useFetch (-> api.get)
// puis affiche les données reçues . On mocke api.get ET Recharts
// ( les graphiques svg complexes cassent ds jsdom, l'environnement de test).
// 
// Pattern : mockResolvedValue -> render -> waitFor (attends le chargement)
//==========================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { ProgressionStats, User } from '../types'
import api from '../services/api'


// --- Mock de l instance Axios --- 

vi.mock('../services/api', () => ({
    default: { get: vi.fn() },
}))

// --- Mock de Recharts ---
// Les commposants SVG Recharts (responsiveContainer, BarChart...) ne fonctionnent
// pas ds jsdom (pas de vrai moteur de rendu). On les remplace par de simples div.
// Cela permet de tester le contenu texte du Dashboard sans les graphiques.

vi.mock('recharts', () => ({
    BarChart: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({children}: {children:React.ReactNode}) => (
        <div data-testid="ResponsiveContainer">{children}</div>
    ),
    CartesianGrid: () => null,
}))

const mockGet = vi.mocked(api.get)

const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    weight: 75,
    goal: 'maintain',
    created_at: '2024-01-01T00:00:00.000Z',
}

// Données de stats completes pour simuler une reponse de l'API
const mockStats: ProgressionStats = {
    user: { username: 'testuser', weight:25, goal:'maintain', member_since: '2024-01-01' },
    stats: {
        summary: {
            total_workouts: 12,
            total_minutes: 720,
            avg_duration: 45, // valeur unique : facilite les assertions
            unique_exercises: 9, // Different de exercice_count des categories
        },
        monthly: [
            {month: '2024-01', workout_count: 4, total_minutes: 240 },
            {month: '2024-02', workout_count: 8, total_minutes: 480 },
        ],
        byCategory:[
            {category: 'Musculation', exercise_count: 8, total_reps: 320 },
        ],
        recent: [
            { id: 1, title: 'Séance du lundi', date: '2024-01-15', duration: 90 },
        ],
    }
}
    const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
        user: mockUser,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        ...overrides,
    })

    const renderDashboard = (ctx = makeAuthContext()) =>
        render (
        <AuthContext.Provider value={ctx}>
            {/* MemoryRouter necessaire car Dashboard contient des <link> */}
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        </AuthContext.Provider>
        )
    describe('Dashboard', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('affiche le spinner pendant le chargement', () => {
            //promesse infinie -> Dashboard reste bloqué  sur "loading: true"
            mockGet.mockReturnValue(new Promise(() => {}))
            renderDashboard()

            // le spinner utilise la classe animate-spin (pas de data-testid)
            const spinner = document.querySelector('.animate-spin')
            expect(spinner).toBeInTheDocument()
        })

        it('affiche le message de bienvenu avec le nom utilisateur', async () => {
            mockGet.mockResolvedValue({ data: mockStats })
            renderDashboard()

            //waitFor: attends que le chargement se termine et que le DOM soit mis a jour
            await waitFor(() => {
                // /bonjour, testuser/i : regex insensible a la casse pour trouver le texte
                expect(screen.getByText(/bonjour, testuser/i)).toBeInTheDocument()
            })
        })

        it('affiche les 4 cards de statistiques avec les bonnes valeurs', async () => {
            mockGet.mockResolvedValue({ data: mockStats })
            renderDashboard()

        // On attends que le premier élément soit visible avant de vérifier les valeurs
            await waitFor(() => {
                expect(screen.getByText('Séances totales')).toBeInTheDocument()
                expect(screen.getByText("Minutes d'entraînement")).toBeInTheDocument()
                expect(screen.getByText('Durée moyenne')).toBeInTheDocument()
                expect(screen.getByText('Exercices différents')).toBeInTheDocument()
            })
        // Vérification des valeurs numériques des cards
                expect(screen.getByText('12')).toBeInTheDocument() //total_workouts
                expect(screen.getByText('720')).toBeInTheDocument() //total_minutes
                expect(screen.getByText('45 min')).toBeInTheDocument() //avg_duration formatée
                expect(screen.getByText('9')).toBeInTheDocument() //unique exercises
            })

            it('affiche les dernières séances', async () => {
                mockGet.mockResolvedValue({ data: mockStats })
                renderDashboard()

                await waitFor(() => {
                    // le titre de la séance récente doit apparaitre
                    expect(screen.getByText('Séance du lundi')).toBeInTheDocument()
                })
            })

            it("affiche 0 pour les stats quand il n'y a pas de données", async () => {
                // Stats vides pour suler un nouvel utilisateur sans activité
                const emptyStats: ProgressionStats = {
                    ...mockStats,
                    stats: {
                        ...mockStats.stats,
                    summary: { total_workouts: 0, total_minutes: 0, avg_duration: 0, unique_exercises: 0 },
                    recent: [],
                    byCategory: [], 
                },
            }

            mockGet.mockResolvedValue({ data: emptyStats})
            renderDashboard()

            await waitFor(() => {
                // Quand recent est vide, le message d'etat vide s'affiche
                expect(screen.getByText('Aucune séance.')).toBeInTheDocument()
            })
        })

        it("affiche l'objectif de l'utilisateur", async () => {
            mockGet.mockResolvedValue({ data: mockStats })
            renderDashboard()

            await waitFor(() => {
                // goal: 'maintain' -> GOAL_LABELS[] = 'Maintien du poids'
                expect(screen.getByText(/Maintien du poids/)).toBeInTheDocument()
            })
        })
    })