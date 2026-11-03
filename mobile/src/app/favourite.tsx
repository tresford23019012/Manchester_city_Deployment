import GuesthouseList from '../components/GuesthouseList';
import { useFavourites } from '../context/FavouritesContext';
import { useAuth } from '../context/AuthContext';
export default function Favourites() { const { favourites, error }=useFavourites(); const {isAuthenticated, syncError}=useAuth(); return <GuesthouseList title="Favourites" items={favourites} message={syncError || error || (!isAuthenticated ? 'Sign in to see your favourites.' : favourites.length ? '' : 'No saved guesthouses yet.')} />; }
