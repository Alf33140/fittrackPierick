//=======================================================================================
//tests.login.test.tsx / Test du composant login
//
// Outils utilisés :
// - vitest : framework de test (describe/it/expect/vi)
// - React Testing Library (RTL) : render, screen, waitFor
// - userEvent : simule les interactions utilisateur (frape, clic)
// 
// Philosophie RTL: tester comme un utilisateur (ce qu'il voit et fait)
// âs l'implémentation interne. On cherche par Placeholder, rôme,
// texte visible / pas par data-testid ou sélecteur css.
//========================================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// MemoryRouter : routeur den mémoire (pas d 'url réelle ) nécessaire car Login utilise <Link>
import { MemoryRouter, } from 'react-router-dom'
import Login from '../pages/Login'
import { AuthContext,AuthContextType } from '../context/AuthContext'

// --- Mock de useNavigate ---
// vi.mock() remplace un module par un mock pour toute la suite des tests
// on garde tous les exports réels ( via vi.importActual) et on remplace
// seulement useNavigate par une fonction espioqu on peux inspecter.

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {...actual, useNavigate: () => mockNavigate }

})

// --- Mock de react-hot-toast ---
// on mocke toast pour pouvoir verifier qu il a ete appele sans afficher de vraies modifications

vi.mock('react-hot_toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}))

// fonction espion pour la fonction login du contexte
const mockLogin = vi.fn()

// fabrique un contexte d'auth avec des valeurs par defaut modifiables
// overides permet de  presonnaliser les valeurs de certains tests

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
})

// Fonction utilitaire pour rre Login dans son contexte nécessaire
// (AuthContext.Provider + MemoryRouter pour React Router)
const renderLogin = (ctx = makeAuthContext()) =>
    render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        </AuthContext.Provider>
    )

describe('Login', () => {
    // Réinitialise tt les mocks avanat chaque test
    beforeEach(() => {
        vi.clearAllMocks()
    })

    //--- Test de rendu ( ce que l'utilisateur voit)
    it('Affiche le formulaire avec les champs email et mot de passe', () => {
        renderLogin()

        //screen.getByPlaceholderText: cherche un input par son placeholder
        //(getBy: lève une erreur si non trouvée / assertif, pas besoin d'expect supplémentaire)
        expect(screen.getByPlaceholderText("ton@email.com")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("********")).toBeInTheDocument()
        //getByRole: cherche par role ARIA + texte accessible
        expect(screen.getByRole('button', { name: /se connecter/i})).toBeInTheDocument()
        // /se connecter/i = regex insensible a la casse (i)

    })

    it("affiche un lien vers la page d'inscription", () => {
    renderLogin()

    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  // --- Test d'interaction ---
  it('appelle login avec les bons identifiants à la soumission', async () => {
    //userEvent.setup() crée un utilisateur virtuel (recommandé vs fireEvent)
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined) // login réussit son erreur

    renderLogin()

    // user.type() simule la frappe caractere par caractere (avec evenements complets)
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('********'), 'password123')
    await user.click(screen.getByRole('button', {name: /se connecter/i}))

    //waitFor: attend que l assertion soit vraie (utile pour appels async)
    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com','password123')
    })
  })

  it('redirige vers /dashboard apres connexion reussie', async () => {
    //userEvent.setup() crée un utilisateur virtuel (recommandé vs fireEvent)
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined) // login réussit son erreur

    renderLogin()

    // user.type() simule la frappe caractere par caractere (avec evenements complets)
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('********'), 'password123')
    await user.click(screen.getByRole('button', {name: /se connecter/i}))

    await waitFor(() => {
        //mockNavigate doit avoir été appeklé avec '/dashboard' après le login
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
  it("affiche une erreur toast en cas d'echec de connexion", async () => {
    //import dynamique du mock pour verifier l 'appeld e toast.error
    const toast = (await import('react-hot-toast')).default
    const user = userEvent.setup()
    //mockRejectedValue: simule une erreur de l'API (ex: identifiants incorrects)
    mockLogin.mockRejectedValue({ response: { data:{ error: 'Invalid credentials.'}}})
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('********'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
    })
  })

  it('désactive le bouton pendant le chargement', async () => {
    const user =userEvent.setup()
    // new Promise(() =>{}) : promesse qui ne se resout jamais _ simule un chargement infini
    mockLogin.mockImplementation(() => new Promise(() => {}))
    renderLogin()
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('********'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i}))

    await waitFor(() => {
        //le texte change et le bouton est désactivé pendant l appel
        expect(screen.getByRole('button', { name: /connexion\.\.\./i})).toBeDisabled()
    })
  })
})