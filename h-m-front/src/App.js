import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";
import Graphic from "./Pages/Graphic";
import About from "./Pages/About";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/graphics" element={<Graphic />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}
