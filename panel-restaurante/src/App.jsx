import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CocinaHamburguesasPagina from './paginas/CocinaHamburguesasPagina';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<CocinaHamburguesasPagina />} />

          <Route
            path="/cocina/hamburguesas"
            element={<CocinaHamburguesasPagina />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;