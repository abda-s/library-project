import { BrowserRouter } from "react-router-dom"; // Link removed as it's not used here directly
import { useAuth } from "./context/AuthContext";
import './index.css';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify

// Components
import RoutesRender from "./components/RoutesRender"; // Import RoutesRender

function App() {
  const { loading: authLoading } = useAuth(); // user and logout are not directly used here anymore

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading application...</div>;
  }

  return (
    <BrowserRouter>
      {/* RoutesRender will now handle all routing logic */}
      <RoutesRender />
      {/* ToastContainer for displaying notifications */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Using colored theme for better visual distinction of success/error
      />
    </BrowserRouter>
  );
}

export default App;
