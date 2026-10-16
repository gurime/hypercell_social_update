import Footer from "./components/footer";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-blue-950">
    <Navbar/>
    <div className="grid grid-cols-3 gap-4">
<div className="col-span-2 border-r border-white/10 pr-4"> 
  <h1 className="text-6xl font-bold text-white">
    Welcome to <span className="text-blue-500">Hypercell Social!</span>
  </h1>
  </div>
<div className="col-span-2 border-r border-white/10 pr-4"> 
  <h1 className="text-6xl font-bold text-white">
    Welcome to <span className="text-blue-500">Hypercell Social!</span>
  </h1>
  </div>
<div className="col-span-2 border-r border-white/10 pr-4"> 
  <h1 className="text-6xl font-bold text-white">
    Welcome to <span className="text-blue-500">Hypercell Social!</span>
  </h1>
  </div>
</div>
    <Footer/>
    
    </main>
  );
}
