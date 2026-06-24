// ============================================================
// hooks/useAuth.ts — Hook personnalisé pour accéder au contexte d'auth
//
// Un hook React est une fonction qui commence par "use" et peut appeler
// d'autres hooks (useState, useContext, useEffect...).
// Celui-ci encapsule useContext(AuthContext) pour deux raisons :
//   1. Interface plus propre : useAuth() au lieu de useContext(AuthContext)
//   2. Sécurité : lève une erreur claire si utilisé hors du Provider
// ============================================================

import { useContext } from "react";
import { AuthContext, AuthContextType } from "../context/AuthContext"; 

// Le type de retour AuthContextType (jamais null) grâce à la vérification ci-dessous
export function useAuth(): AuthContextType{
    const context = useContext(AuthContext)


  // Si context est null, c'est qu'on a appelé useAuth() dans un composant
  // qui n'est pas enveloppé par <AuthProvider> dans l'arbre React.
  // Cette erreur aide à détecter les bugs de configuration tôt.
    if (!context) throw new Error('useAuth must be used within AuthProvider')

        return context
}