import CallToAction from "./components/agenda";
import Agenda from "./components/agenda";
import Comentar from "./components/comentar";
import Comentarios from "./components/comentario";
import Contacto from "./components/contacto";
import Footer from "./components/footer";
import Nav from "./components/header";
import Home_page from "./components/hero_section";
import PreguntasFrecuentes from "./components/preguntaFrecuente";
import PromoSection from "./components/promoSection";
import ServicesSection from "./components/servicio";


export default function Home() {
  return (
    <div className="w-full flex flex-col h-full bg-gray-200">
       
      <Nav /> 
     
       <section id="inicio">  
      <div className="w-full h-screen relative top-0  md:p-5 md:h-[93vh]  flex bg-gray-200" > 
        <Home_page />
      </div>

       </section>
      <section className="w-full h-full flex items-center justify-center pt-5" id="servicios">
      <ServicesSection />
      </section>
      <section className="w-full  h-full flex items-center justify-center pt-5" id="promos">
        <PromoSection />
      </section>
      
       <section className="w-full h-full flex items-center justify-center pt-5" id="agenda">
        <CallToAction/>
       </section>
      <section className="w-full h-full flex items-center justify-center pt-5 " id="resenas">
        <Comentarios />
        
       </section>
      <section className="w-full h-full flex items-center justify-center pt-5 pb-20" id="comentar">
        <Comentar />
      </section>
      <section className="w-full h-full items-center justify-center pt-5 flex" id="contacto">
      <Contacto />
      </section>
      <section className="w-full h-full flex items-center justify-center pt-5" id="pregunta_frecuente">
        <PreguntasFrecuentes />
      </section>
      <section className="w-full h-full flex">
        <Footer/>
        </section> 
       
     </div>



  );
}
