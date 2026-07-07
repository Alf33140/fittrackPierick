// ===============================
// hooks/useFetch.ts — Hook générique pour les appels API GET
//
// Ce hook centralise la logique répétitive de tout appel API :
//   - état de chargement (loading)
//   - données reçues (data)
//   - gestion d'erreur (error)
//   - possibilité de relancer la requête (refetch)
//
// Le <T> est un générique TypeScript : il permet de typer le résultat
// à l'usage. Ex: useFetch<{ exercises: Exercise[] }>('/exercises')
// ================================

import { useState, useEffect, useCallback } from "react";
import api from '../services/api'

// interface décrivant ce que retourne le hook
interface UseFetchResult <T> {
    data: T | null          // null avant la première réponse
    loading: boolean        // true pendant la requête en cours
    error: string | null
    refetch: () => void     //Fonction pour relancer la requete manuellement
}

export function useFetch<T>(url: string): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

  // useCallback mémoïse la fonction fetchData pour éviter qu'elle soit
  // recréée à chaque render. Sans ça, le useEffect ci-dessous se déclencherait
  // en boucle infinie car fetchData serait une nouvelle référence à chaque fois.
    const fetchData = useCallback(()=>{
        // Promise.resolve()
        //     .then(() => {
                setLoading(true)
                setError(null)            
        //     })
        //     .then(() => api.get<T>(url) )
        //     .then((res: {data: T}) => setData(res.data))
        //     .catch(() => setError('Impossible de charger les données'))
        //     .finally(() => setLoading(false))
        // }, [url])        
        api
            .get<T>(url)
            .then((res: {data: T}) => setData(res.data))
            .catch(() => setError('Impossible de charger les données'))
            .finally(() => setLoading(false))
    }, [url])

    // useEffect déclenche fetchData au montage du composant,
    // et de nouveau si fetchData change (c'est-à-dire si url change)
    useEffect(()=> {
        fetchData()
    }, [fetchData])


    // refetch expose fetchData : les composants peuvent rappeler manuellement
    // la requête après une création/modification pour actualiser l'affichage
    return {data, loading, error, refetch: fetchData}
}