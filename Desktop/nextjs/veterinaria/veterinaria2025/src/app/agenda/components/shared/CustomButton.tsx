// src/app/agenda/componentes/shared/CustomButton.tsx
import React from 'react';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  children,
  className = 'flex w-full items-center justify-center',
  ...props
}) => {
  const baseClasses = 'px-4  py-2 rounded-lg transition-colors font-medium';
  
  const variantClasses = {
    primary: 'bg-green-vet  hover:bg-green-700 text-white',
    secondary: 'bg-gray-200  hover:bg-gray-300 text-black'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >

      {children}
  
    </button>
  );
};