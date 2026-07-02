//==========================================================================
//tests/Dashboard.test.tsx / Tests du composant Dashboard
//
// Dashboard est asynchrone : il appelle useFetch (-> api.get)
// puis affiche les données reçues . On mocke api.get ET Recharts
// ( les graphiques svg complexes cassent ds jsdom, l'environnement de test).
// 
// Pattern : mockResolvedValue -> render -> waitFor (attends le chargement)
//==========================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { ProgressionStats, User } from '../types'
import api from '../services/api'