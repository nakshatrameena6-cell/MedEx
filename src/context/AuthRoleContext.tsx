import React, { createContext, useContext, useState } from 'react';
import { Role } from '../types/api';

interface AuthRoleContextType {
  role: Role;
  district: string;
  user: string;
  isMockMode: boolean;
  setRole: (role: Role) => void;
  setDistrict: (district: string) => void;
  setUser: (user: string) => void;
  setIsMockMode: (mock: boolean) => void;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

export const AuthRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>('DISTRICT');
  const [district, setDistrict] = useState<string>('TN-D01');
  const [user, setUser] = useState<string>('meenachi.dev');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Automatically switch district to ALL when role is STATE or AUDITOR
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'STATE' || newRole === 'AUDITOR') {
      setDistrict('ALL');
    } else if (district === 'ALL') {
      setDistrict('TN-D01');
    }
  };

  return (
    <AuthRoleContext.Provider
      value={{
        role,
        district,
        user,
        isMockMode,
        setRole,
        setDistrict,
        setUser,
        setIsMockMode,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
};

export const useAuthRole = (): AuthRoleContextType => {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
};
