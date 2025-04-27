import { BrowserRouter } from "react-router-dom";
import RoutesRender from './components/RoutesRender';
import './index.css'
function App() {

  return (
    <BrowserRouter>
      <RoutesRender />
    </BrowserRouter>
  )
}

export default App
