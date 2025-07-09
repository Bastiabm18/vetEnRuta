import Link from 'next/link';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaSignOutAlt, 
  FaHome, 
  FaPaw 
} from 'react-icons/fa';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  isLogout?: boolean;
  showBorderTop?: boolean;
}

export default function AccountMenu() {
  const menuItems: MenuItem[] = [
    {
      name: 'Perfil',
      path: '/cuenta',
      icon: <FaUser className="text-gray-500" />
    },
    {
      name: 'Agenda',
      path: '/cuenta/agenda',
      icon: <FaCalendarAlt className="text-gray-500" />
    },
    {
      name: 'Mascotas',
      path: '/cuenta/mascotas',
      icon: <FaPaw className="text-gray-500" />
    },
    {
      name: 'Inicio',
      path: '/',
      icon: <FaHome className="text-gray-500" />
    },
    {
      name: 'Cerrar Sesión',
      path: '',
      icon: <FaSignOutAlt className="text-gray-500" />,
      isLogout: true,
      showBorderTop: true
    }
  ];

  return (
    <div className="w-64 text-black bg-white shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Mi Cuenta</h2>
      </div>
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems.flatMap((item, index) => {
            const elements = [];
            
            if (item.showBorderTop) {
              elements.push(
                <li key={`border-${index}`} className="border-t mt-2 pt-2"></li>
              );
            }
            
            elements.push(
              <li key={`item-${index}`}>
                {item.isLogout ? (
                  <form action="/auth/session" method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <button 
                      type="submit"
                      className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                    >
                      {item.icon}
                      {item.name}
                    </button>
                  </form>
                ) : (
                  <Link 
                    href={item.path}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )}
              </li>
            );
            
            return elements;
          })}
        </ul>
      </nav>
    </div>
  );
}