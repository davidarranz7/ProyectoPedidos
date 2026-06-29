import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import CocinaHamburguesasPagina from './paginas/CocinaHamburguesasPagina';
import HdInternoPagina from './paginas/HdInternoPagina';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navegacion">
          <Link to="/cocina/hamburguesas">Cocina hamburguesas</Link>
          <Link to="/hd-interno">HD interno</Link>
        </nav>

        <Routes>
          <Route path="/" element={<CocinaHamburguesasPagina />} />
          <Route
            path="/cocina/hamburguesas"
            element={<CocinaHamburguesasPagina />}
          />
          <Route path="/hd-interno" element={<HdInternoPagina />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;