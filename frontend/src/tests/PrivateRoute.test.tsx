//=====================================================================================
//tests/PrivateRoute.test.tsx / tests du composant PrivateRoute
//
// PrivateRoute est une "route gardienne" : son comportement dépend
// de l"etat d 'identification . On teste 3 etatas distincts:
// - loading: true -> affiche un spinner
// - user; null -> redirige vers /login
// - user: défini -> rend le contenu protégé (Outlet)
//
// On doit configurer l arbre de routes complet (routes + route)
// pour que react router puisse simuler la navigation
// =====================================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from '@testing-library/react'
// MemoryRouter + route + routes : nécessaire pour simuler les routes imbriquées
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from "../components/PrivateRoute";
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    weight: null,
    goal: 'maintain',
    created_at: '2024-01-01T00:00:000Z',
}

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
user: null,     // Non connecté par défaut
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// --- Rendu avec arbre de route complet ---
// Strcture reproduite: 
// <Route element={<PrivateRoute />}>  <- garde l acces
//  <Route path="/dashboard" element={ <- contenu protégé
//      <div>Contenu Dashboard</div>
// }
// </Route>
// <Route path="/login" element= { <- destination de redirection
// <div>Page Login</div>
//} />
const renderWithRoutes = (ctx: AuthContextType, initialPath = '/dashboard') =>
    render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    {/* PrivateRoute comme element parent: agit comme un garde */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/dashboard" element= {<div> Contenu Dashbord</div>} />
                    </Route>
                        <Route path="/login" element= {<div> Page Login</div>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    )

    describe('PrivateRoute', () => {
        it('affiche le spinner pendant le chargement initial', () => {
            // loading: true -> PrivateRoute retourne <LoadindSpinner />
            renderWithRoutes(makeAuthContext({ loading: true }))

            //LoadingSpinner utilise la classe 'animate-spin' / on cherche ds le DOM
            const spinner = document.querySelector('.animate-spin')
            expect(spinner).toBeInTheDocument()
        })

        it('redirige vers /login si non connecté', () => {
            // user: null  + loading:  false -> <Navigate to"/login" replace/>
            renderWithRoutes(makeAuthContext({ user: null, loading: false}))

            // Apres la redirection on doit voir la page login
            expect(screen.getByText('Page Login')).toBeInTheDocument()
            //queryByText (au lieu de GetByText) : retourne null si non trouvé, sans erreur
            expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
        })

        it('Affiche le contenu protégé si connecté', () => {
             // user: null  + loading:  false -> Outlet /> rend le composant enfant
            renderWithRoutes(makeAuthContext({user: mockUser, loading: false})) 

            expect(screen.getByText('Contenu Dashboard')).toBeInTheDocument()
            expect(screen.queryByText('Page Login')).not.toBeInTheDocument()
        })

        it('n affiche pas le contenu pendant le chargement', () => {
            // Meme si user est défini, loading: true bloque l affichage (spinner d abord)
            renderWithRoutes(makeAuthContext({loading: true, user: mockUser})) 

             expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
        })
    })