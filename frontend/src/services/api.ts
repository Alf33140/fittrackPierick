// ============================================================
// services/api.ts — Instance Axios centralisée
//
// Axios est une librairie pour faire des requêtes HTTP depuis le navigateur.
// Plutôt que de créer une nouvelle instance à chaque appel, on en configure
// une seule ici avec les réglages communs (baseURL, token JWT, gestion 401).
// Tous les fichiers du frontend importent cette instance au lieu d'axios directement.
// ============================================================

import axios from 'axios'

// axios.create() retourne une instance Axios préconfigurée
// baseURL : toutes les requêtes seront relatives à /api
// Ex : api.get('/auth/me') envoie GET /api/auth/me
// Le proxy Vite (vite.config.ts) redirige /api → http://backend:5000
const api = axios.create({
  baseURL: '/api',
})

// ============================================================
// INTERCEPTEUR DE REQUÊTE (avant envoi)
// ============================================================
// Un intercepteur s'exécute automatiquement avant chaque requête.
// Ici, on y ajoute le token JWT dans le header Authorization
// pour ne pas avoir à l'écrire manuellement à chaque appel API.
api.interceptors.request.use((config) => {
  // Le token est stocké dans localStorage après le login
  const token = localStorage.getItem('token')
  if (token) {
    // Format attendu par le backend : "Bearer eyJhbGci..."
    config.headers.Authorization = `Bearer ${token}`
  }
  return config // On retourne la config modifiée pour continuer la requête
})

// ============================================================
// INTERCEPTEUR DE RÉPONSE (après réception)
// ============================================================
// Gère les erreurs HTTP de façon centralisée.
// Premier argument : callback appelé si la réponse est un succès (2xx)
// Deuxième argument : callback appelé si la réponse est une erreur
api.interceptors.response.use(
  (response) => response, // Succès : on laisse passer la réponse sans modification

  (error) => {
    // 401 = token expiré ou invalide → on déconnecte l'utilisateur
    // Sans cet intercepteur, il faudrait gérer ce cas dans chaque composant
    if (error.response?.status === 401) {
      localStorage.removeItem('token')       // Supprime le token périmé
      window.location.href = '/login'        // Redirige vers la page de connexion
    }
    // On propage l'erreur pour que les composants puissent aussi la gérer si besoin
    return Promise.reject(error)
  }
)

export default api