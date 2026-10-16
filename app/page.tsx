import Footer from "./components/footer";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <>
    <Navbar/>
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
<div >hyoec</div>
  <h1 className="text-6xl font-bold text-white">
    Welcome to <span className="text-blue-500">Hypercell Social!</span>
  </h1>
    </div>
    <Footer/>
    
    </>
  );
}
