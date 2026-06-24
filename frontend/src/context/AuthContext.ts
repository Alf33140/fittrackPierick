// context/AuthContext.ts
import { createContext } from 'react'
// import { type User } from '../types/index' Original
import { User } from '../types' //Davy

export interface RegisterData {
    username: string
    email: string 
    password: string 
    weight?: number
    goal?: string
}

export interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise <void>
    register: (data: RegisterData) => Promise <void>
    logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)