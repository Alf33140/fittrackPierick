//========================================================================
//tests/useFetch.test.tsx / Tests du hook useFetch
//
// useFetch est un hook asynchrone : il declenche un appel API 
// et met a jour son etat(loading/data/error) selon le resultat.
// On mocke api.get pour contrôler les réponses sans vrai serveur.
// 
// Outils spécifiques:
//  - waitFor: attends qu une assertion devienne vraie (async)
//  - act : wrapping obligatoire pour les mises a jour d'état ds les tests
//========================================================================

import { describe, it, expect, vi, beforeEach } from "vitest"
// act: enveloppe les actions qui declenchent des mises a jour d'état React
import { renderHook, waitFor } from "@testing-library/react"
import { useFetch } from "../hooks/useFetch"
import api from '../services/api'

// --- Mock de l instance Axios ---
// On remplace api.get par un mock pour eviter  de vraies requetes HTTP
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
    },
}))

// vi.mocked() : typage Typescript du mock (infère les types  corrects)
const mockGet = vi.mocked(api.get)

describe('useFetch', () =>{
    beforeEach(() =>{
        vi.clearAllMocks()
    })

    it('démarre en état de chargement  (loading: true, data: null, error: null)', () => {
        // new Promise(() => {}) : promesse qui ne se résout jamais
        // -> le hook reste bloqué ds l etat loading
        mockGet.mockReturnValue(new Promise(() => {}))

        const { result } = renderHook(() => useFetch<{ items: number[] }> ('/test'))

        // Vérification SYNCHRONE : pas besoin de waitFor car on test l'etat initial
        expect(result.current.loading).toBe(true) 
        expect(result.current.data).toBeNull() 
        expect(result.current.error).toBeNull() 
       })

     it('retourne les données apres un appel API réussi', async () => {
        const responseData = { items: [1, 2, 3] }
        // mockResolvedValue : la  promesse se résout avec { data: responseData }
        mockGet.mockResolvedValue({ data: responseData})

        const { result } = renderHook(() => useFetch<{ items: number[] }> ('/test'))
        
        //waitFor: boucle jusqu' a ce que l assertion soit vraie ( ou timeOut)
        //Nécessaire car useFetch est asynchrone
        await waitFor(() => {
            expect(result.current.loading).toBe(true) 
        })
            expect(result.current.data).toEqual(responseData) 
            expect(result.current.error).toBeNull() 
            // Verifie que api.get a bien été appelé avec la bonne URL
            expect(mockGet).toHaveBeenCalledWith('/test')
        })
        it("retourne une erreur en cas d'echec de l appel API", async () => {
            //mockRejectedValue: la promesse est rejetée (simule une erreur reseau/API)
            mockGet.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useFetch<unknown> ('/test'))

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })
            
            // le hook retourne le msg d erreur générique défini ds useFetch
            expect(result.current.error).toBe("impossible de charger les données") 
            expect(result.current.data).toBeNull() 
        })

        it("refetch declenche un nouvel appel API", async () => {
            mockGet.mockResolvedValue({ data: { count: 1 } })

            const { result } = renderHook(() => useFetch<{ count: number }> ('/test'))
            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            // Premier appel au montage
            expect(mockGet).toHaveBeenCalledTimes(1)

            // On appelle refetch() directement / waitFot()gere  l attente des mises a jour
            result.current.refetch()

            //Attend le 2eme appel
            await waitFor(() => {
                expect(mockGet).toHaveBeenCalledTimes(2)

            })
        })
