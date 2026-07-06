//================================================================================
//tests/sidebar.test?tsx / Test du composant Sidebar
//
// La sidebar utilise useAuth (contexte) et useNavigate (router)
// On mocke les deux pour controler leur comportement et verifier 
// les interactions (clic sur Deconnexion -> logout -> navigation).
//================================================================================

import {describe, it, expect, vi, beforeEach } from 'vitest'
import {render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/Layout/Sidebar'
import {AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual, useNavigate: () => mockNavigate,
    }
})

// utilisateur factice pour les tests
const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    weight: null,
    goal: 'maintain',
    created_at: '2024-01-01T00:00:000Z',
}

const mockLogout = vi.fn()

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: mockLogout, //On espionnera cet appel
    ...overrides,
})

// MemoruRouter avec InitialEntries: simule une URL de depart
// utile pour que NavLink puisse calculer les classes actives
const renderSidebar = (ctx = makeAuthContext()) =>
    render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter initialEntries={['/dashboard']}>
                <Sidebar />
            </MemoryRouter>
        </AuthContext.Provider>
    )
    describe('Sidebar', () =>{
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('affiche tous les liens de navigation', () =>{
            renderSidebar()

            // getByText: cherche un élément par texte exact
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
            expect(screen.getByText('Exercices')).toBeInTheDocument()
            expect(screen.getByText('Deconnexion')).toBeInTheDocument()
        })

        it("affiche le nom d'utilisateur et l email", () =>{
            renderSidebar()

            expect(screen.getByText('testuser')).toBeInTheDocument()
            expect(screen.getByText('test@example.com')).toBeInTheDocument()
        })

        it("affiche les initiales de l'utilisateur (2 premières lettres en Majuscules)", () =>{
            renderSidebar()
            //"testuser".slice(0, 2).toUpperCase() = "TE"
            expect(screen.getByText('TE')).toBeInTheDocument()
        })
        it("Affiche FT si aucun utilisateur n 'est connecté", () =>{
            renderSidebar(makeAuthContext({ user: null }))

            expect(screen.getByText('FT')).toBeInTheDocument()
        })

        it("appelle logout et redirige vers /login au cli sur deconnexion", () =>{
            renderSidebar()

            // fireevent.click: simule un clic(synchrone , contrairement a userEvent)
            // Préférer userEvent pour les interactions complexes , fireEvent pour les clics simples
            fireEvent.click(screen.getByText('Deconnexion'))
    
            // les deux assertions doivent être vraies APRES le clic
            expect(mockLogout).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })

        it("affiche le logo FitTrack", () => {
            renderSidebar()
            
            expect(screen.getByText('FitTrack')).toBeInTheDocument()
        })
    })
