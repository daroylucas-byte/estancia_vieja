import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center px-8 py-4 w-full gap-4">
      <div className="flex items-center gap-6">
        <span className="text-xs font-public-sans text-slate-500 text-center md:text-left">
          © {new Date().getFullYear()} Municipalidad - Sistema de Gestión de Compras
        </span>
      </div>
      <nav className="flex gap-6">
        <a className="text-xs font-public-sans text-slate-500 hover:text-primary transition-colors" href="#">Privacidad</a>
        <a class="text-xs font-public-sans text-slate-500 hover:text-primary transition-colors" href="#">Términos</a>
        <a class="text-xs font-public-sans text-slate-500 hover:text-primary transition-colors" href="#">Contacto</a>
      </nav>
    </footer>
  );
};
