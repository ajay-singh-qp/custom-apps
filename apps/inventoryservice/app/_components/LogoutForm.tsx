"use client";

import React from "react";

interface ILogoutFormProps {
  children: (handleLogout: () => void) => React.ReactNode;
}

export const LogoutForm: React.FC<ILogoutFormProps> = ({ children }) => {
  const handleLogout = (): void => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/logout";
    document.body.appendChild(form);
    form.submit();
  };
  return <>{children(handleLogout)}</>;
};
