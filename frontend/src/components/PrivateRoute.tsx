// ============================================================
// components/PrivateRoute.tsx — Protection des routes authentifiées
//
// Ce composant agit comme un "garde" devant les pages privées.
// Il est utilisé dans App.tsx pour envelopper les routes qui
// nécessitent d'être connecté (Dashboard, Workouts, etc.).
// ============================================================

import {Navigate, Outlet} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute() {
    // user = null si non connecté, loading = true pendant la vérification du token
    const {user, loading}= useAuth()


    // Pendant que AuthContext vérifie le token (GET /auth/me),
    // on affiche un spinner pour éviter une redirection prématurée vers /login
    if(loading) return <LoadingSpinner />

    // Si pas d'utilisateur connecté, on redirige vers /login
    // `replace` remplace l'entrée dans l'historique du navigateur :
    // appuyer "retour" après la redirection ne revient pas à la page privée
    if (!user) return <Navigate to="/login" replace />

    // Outlet rend le composant enfant correspondant à la route active.
    // C'est le mécanisme de React Router v6 pour les routes imbriquées.
    // Ex: <Route element={<PrivateRoute />}><Route path="/dashboard" .../></Route>
    return <Outlet/>
}