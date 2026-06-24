import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// import { AuthProvider} from './context/AuthContext'
// import { AuthContext} from './context/AuthContext'
import { AuthProvider} from './context/AuthProvider'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
// import Workouts from './pages/Workout'
// import WorkoutDetail from './pages/WorkoutDetail'
// import Profile from './pages/Profile'

export default function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
        position = "top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color : '#F1F5F9',
            border: '1px solid #334155',
          },
        }}  
        />
        <Routes>
          {/* -------- Routes publiques */}
          {/* Accessible sans être connecté */}
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />

          {/* --------- Routes privé -------
          PrivateRoute vérifie le token JWT; si absent -> redirect /login
          Layout ajoute la sidebar et la zone de contenu principale
          Toutes les pages imbriqués hériten de cette protection */}
          <Route element={<PrivateRoute/>}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={< Dashboard/>}/>
              <Route path="/exercises" element={< Exercises/>}/>
              {/* <Route path="/workouts " element={< Workouts />}/> */}
              {/* :id = paramètre dynamique récupéré avec useParams() dans workoutdetail */}
              {/* <Route path="/workout/:id" element={< WorkoutDetail/>}/> */}
              {/* <Route path="/profile" element={< Profile/>}/> */}
            </Route>
          </Route>

          {/* --------Fallback
          Toute url inconnue redirige vers le dashboard 
          replace évite d'empiler une entrée dans l'historique de navigation */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
