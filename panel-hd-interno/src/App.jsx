import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HdInternoPagina from './paginas/HdInternoPagina';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HdInternoPagina />} />
          <Route path="/hd-interno" element={<HdInternoPagina />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;