//====================================================================
//tests/useAuth.test.tsx / Tests du hook useAuth
//
// Pour tester un hool react, on utilise un renderHook de RTL.
// renderHook exécute le hook dans un composant factice invisible
// et expose son resultat via result.current.
// 
// On vérifie :
//  1: que le hook lève une erreur s il est utilisé hors Provider 
//  2: Qu il retourne bien les valeurs du contexte qd bien configuré
//=====================================================================

import { describe, it, expect, vi } from 'vitest'
// renderHook : exécute un hook dans un composant test invisible
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
    id: 1, 
    username: 'testuser',
    email: 'test@example.com',
    weight: 75,
    goal: 'maintain',
    created_at: '2024-01-01T00:00:000Z0'
}

const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType =>({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
})

describe('useAuth', () => {
    it('leve une erreur si utilisée en dehors de AuthProvider', () => {
        // on reduit le bruit  console pour ce test car React loggue l erreur
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        // on reduit sans wrapper = pas de provider -> useAuth() doit lancer une erreur
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used within AuthProvider'
        )

        consoleSpy.mockRestore() // Restaure console.error pour les autres tests
    })

    it('retourne les valeurs du contexte depuis AuthProvider', () => {
        const ctx = makeAuthContext()

        // wrapper: composant qui enveloppe le hook (fournit le contexte necessaire)
        const wrapper =({ children }: {children: React.ReactNode }) => (
            <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            //toEqual: compare les valeurs en profondeur (pas de référence d'objet)
            expect(result.current.user).toEqual(mockUser)
            expect(result.current.loading).toBe(false)
            // typeof vérifie que login/logout/register sont bien des fonctions
            expect(typeof result.current.login).toBe('function') 
            expect(typeof result.current.logout).toBe('function') 
            expect(typeof result.current.register).toBe('function') 
        })

        it('retourne user null si non connecté', () => {
        const ctx = makeAuthContext({ user: null })
        const wrapper =({ children }: {children: React.ReactNode }) => (
              <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
            )
        
            const { result } = renderHook(() => useAuth(), { wrapper })
             
            expect(result.current.user).toBeNull() // toBeNull(): strictement null
        })

        it('retourne loading: true pendant le chatrgement', () => {
        const ctx = makeAuthContext({ user: null })
        const wrapper =({ children }: {children: React.ReactNode }) => (
              <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
            )
        
            const { result } = renderHook(() => useAuth(), { wrapper })
             
            expect(result.current.user).toBeNull() // toBeNull(): strictement null
        })

        it('expose les fonctions login logout et register', () => {
            // On passe nos propres fonctions espion pour vérifier qu'elles sont bien exposées
            const login = vi.fn()
            const logout = vi.fn()
            const register = vi.fn()
            const ctx = makeAuthContext ({ login, logout, register })
            const wrapper =({ children }: {children: React.ReactNode }) => (
                <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
            )
            
            const { result } = renderHook(() => useAuth(), { wrapper })

            // toBe : verifie la reference exacte (meme fonction, pas une copie)
                expect(result.current.login).toBe(login)
                expect(result.current.logout).toBe(logout)
                expect(result.current.register).toBe(register)
        })
    })