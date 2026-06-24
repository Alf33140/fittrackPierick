import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, Dumbbell, Calendar, User, LogOut } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'},
    { to: '/exercises', icon: Dumbbell, label: 'Exercices'},
    { to: '/workouts', icon: Calendar, label: 'Séances'},
    { to: '/profile', icon: User, label: 'Profil'},
]

export default function Sidebar(){
    const {user, logout} =useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'FT'

    return (
    <aside className="w-60 bg-[#0D1117] border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="px-5 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-centerjustify">
                    <Dumbbell size={16} className="text-white"/>
                </div>
                <span className="text-lg font-bold text-slate-100 tracking-tight"> FitTrack </span >
            </div>
        </div>

        {/* Nav*/}
        <nav className="flex-1 px-3 py-4 space-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                key = {to}
                to = {to}
                className={({ isActive})=>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                    ?'bg-indigo-500/15 text-indigo-400'
                    :'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
            }
        >
            <Icon size={17} />
            {label}
            </NavLink>
            ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-slate-800 space-y-1">
            <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors group"
            >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
            </div>
            <div className="min-w">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            </NavLink>
            <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-colors">
                <LogOut size={17} />
                Déconnexion
            </button>
        </div>
    </aside>
    )
}