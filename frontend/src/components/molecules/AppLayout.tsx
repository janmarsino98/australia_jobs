import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import useAuthStore from '../../stores/useAuthStore';

const AppLayout: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Transform user data to match NavbarProps user type
  const navbarUser = user ? {
    name: user.name || '',
    profileImage: user.profileImage
  } : undefined;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={navbarUser} />
      <Outlet />
    </div>
  );
};

export default AppLayout; 