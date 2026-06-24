// ============================================================
// context/AuthContext.tsx — Contexte d'authentification React
//
// Le Context API de React permet de partager des données entre composants
// sans passer par les props à chaque niveau (prop drilling).
// Ici, il expose l'utilisateur connecté et les fonctions login/register/logout
// à n'importe quel composant de l'arbre, via le hook useAuth.
// ============================================================

import api from '../services/api.ts'
import { type User } from '../types/index'
import { useState, useEffect, type ReactNode } from 'react'
// import { createContext, useState, useEffect, type ReactNode } from 'react'
import { AuthContext, RegisterData} from './AuthContext'

// ------- Type TypeScript ---------
// Interface décrivant les données que le contexte expose
// interface RegisterData {
//     username: string
//     email: string 
//     password: string 
//     weight?: number // ? = optionnelon timescript
//     goal?: string
// }

// export interface AuthContextType {
//     user: User | null //null = non connecté
//     loading: boolean //true pendant la vérification initiale du token
//     login: (email: string, password: string) => Promise<void>
//     register: (data: RegisterData)=>Promise<void>
//     logout: () => void
// }

// ---- Création du contexte ----
// createContext(null) : valeur par défaut = null (sans Provider)
// Le type générique <AuthContextType | null> permet à TypeScript de savoir
// ce que contient le contexte (null = en dehors du Provider)
// export const AuthContext = createContext<AuthContextType | null>(null)

//===========================================
//
//===========================================
//
//React node : type TypeScript pour n'importe quel contenu React rendable
export function AuthProvider({ children }: {children: ReactNode}) {
    // user: l'utilisateur coonnnecté, null si non authentifié
    const [user, setUser] = useState<User | null>(null)

    //loading: empeche d'afficher une page avant de savoir si l'user est connecté
    // Evite le "flash" de la page login avant la redirection vers le dashboard
    const [loading, setLoading] = useState(()=>{
        return !!localStorage.getItem('token')
    })

    // --------  Vérification d token au démarrage de l'app -------
    // useEffect avec [] en dépendance = s'execute une seule fois au montage
    // si un token est déjà stpck" (sesion précédente), on vérifie sa validité
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            // GET /api/auth/me : retourne le profil si le token est valide
            api
                .get('/auth/me')
                .then((res) => setUser(res.data.user))
                // Si le token est expiré, l'intercepteur axios le supprime (voir api.ts)
                .catch(()=> localStorage.removeItem('token'))
                .finally(() => setLoading(false)) // Fin du chargement dans tous les cas
        } 
        // else {
        //     setLoading(false) //Pas de token -> on sait déjà qu'il n'est pas connecté
        // }
    }, [])


// ------ LOGIN ------
// async/await : on att la rep avt de continuer
// lance une exceptipn si la requete échoue (catch géré dans composant login)
const login = async(email: string, password: string) => {
    const res = await api.post('/auth/login', {email, password})
    localStorage.setItem('token', res.data.token) // Persiste le token entre les sessions'
    setUser(res.data.user)
}

    // register
    //mm logique que login: le backend crée le compte et retounre un token
    const register = async (data: RegisterData) => {
        const res = await api.post('/auth/register', data)
        localStorage.setItem('token', res.data.token)
        setUser(res.data.user)
    }

    // -------- Logout
    //coté client on supprime le token et on vide l'état
    // coté serveur: les JNT sont stateless (pas de session à invalider)
    const logout = () => {
        localStorage.removeItem('token')
        setUser(null) // React re-rend les composants -> PrivateRoute vers /login
    }

    // rendu du provider
    // AuthContexxt.Provider rend les valeur accessibles à tous les composants enfants
    // via useContext(AuthContext) ou le hook useAuth (hooks/useAuth.ts)
    return (
        <AuthContext.Provider value = {{ user, loading, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    )
}