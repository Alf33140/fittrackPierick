//==========================================================================
// tests/Register.test.tsx / Tests du composant Register
//
// Structyure identique à login.test.jsx
// On teste les spécificités de Register : champs supplémentaires,
// sélecteur d'objectif et soumission avec les bonnes données
//==========================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// MemoryRouter : routeur den mémoire (pas d 'url réelle ) nécessaire car Login utilise <Link>
import { MemoryRouter, } from 'react-router-dom'
import Register from '../pages/Register'
import { AuthContext,AuthContextType } from '../context/AuthContext'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return{ ...actual, useNavigate: () => mockNavigate }
})

vi.mock('react-hot-toast', () => ({
    default: {error: vi.fn(), success: vi.fn() },
}))

const mockRegister = vi.fn()

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    loading: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    ...overrides,
})

const renderRegister = (ctx = makeAuthContext()) =>
    render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        </AuthContext.Provider>
    )
     describe('Register',  () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('affiche tous les champs du formulaire', () => {
            renderRegister()

            //Verfication quett les placeholders sont présent dan,s le DOM
            expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('ton@email.com')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('6 caractères minimume')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /créé ton compte/i})).toBeInTheDocument()
        })

        it('affiche le sélecteur d objectifs avec la valeur par défaut', () => {
            renderRegister()

            // getByDisplayValue: cherche un select/input par sa valeur affichée
            // 'Maintenir' = l'option affichée pour goal: 'maintain' (valeur par défaut)

            expect(screen.getByDisplayValue('Maintenir',)).toBeInTheDocument() 
        })

        it('contient les 3 options d objectifs', () => {
            renderRegister()
            // getByRole('OPTIONS') : cherche les balises <option> dans le DOM
            expect(screen.getByRole('option', { name: 'Perdre'})).toBeInTheDocument()
            expect(screen.getByRole('option', { name: 'Maintenir'})).toBeInTheDocument()
            expect(screen.getByRole('option', { name: 'prendre'})).toBeInTheDocument()
        })

        it('appelle Register avec les données correctes', async () => {
            const user = userEvent.setup()
            mockRegister.mockResolvedValue(undefined)
            renderRegister()

            await user.type(screen.getByPlaceholderText('John Doe'), 'testuser')
            await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
            await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
            await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

            await waitFor(() => {
                // expext.objetContaining : verifie que l objet contiens AU MOINS CES PROPRIETES
                // (il peut y en avoir d autres comme weight)
                expect(mockRegister).toHaveBeenCalledWith(
                    expect.objectContaining({
                        username: 'testuser',
                        email: 'test@exmaple.com',
                        password: 'password123',
                        goal: 'maintain', //valeur par defaut du sélecteur
                    })
                )
            })
        })
        it('redirige vers /dashboard après inscription reussie', async () => {
            const user = userEvent.setup()
            mockRegister.mockResolvedValue(undefined)
            renderRegister()

            await user.type(screen.getByPlaceholderText('John Doe'), 'testuser')
            await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
            await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
            await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

            await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
            })
        })

        it('affiche un lien vers la page de connexion', () => {
            renderRegister()
            
            expect(screen.getByRole('link', { name: / se connecter/i })).toBeInTheDocument()
        })

        it('Affiche une erreur Toast en cas d echec d inscription', async () => {
            const toast = (await import('react-hot-toast' )).default
            const user = userEvent.setup()

            //simule une erreur 409: email deja utilisé
            mockRegister.mockRejectedValue({ response: { data: { error: 'Email already in use'} } })
            renderRegister()

            await user.type(screen.getByPlaceholderText('John Doe'), 'testuser')
            await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
            await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
            await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

            await waitFor(() => {
            expect (toast.error).toHaveBeenCalled()    
            })
        })
     })
