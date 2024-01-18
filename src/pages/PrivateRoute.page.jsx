import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/user.context.jsx";
import ToDoApp from "../Todo.jsx";
 
const PrivateRoute = () => {
 
    // Fetching the user from the user context.
    const { user } = useContext(UserContext);
    const location = useLocation();
    const redirectLoginUrl = `/login?redirectTo=${encodeURI(location.pathname)}`;

    return !user ? <Navigate to={redirectLoginUrl} /> : <ToDoApp/> ;
}

export default PrivateRoute;