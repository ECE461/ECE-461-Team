"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const IdContext = createContext<{ id: string | null; setId: (id: string) => void } | undefined>(undefined);

export const IdProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setIdState] = useState<string | null>(null);

  const setId = (newId: string) => {
    localStorage.setItem("id", newId); // Save `id` to localStorage
    setIdState(newId);
  };

  // Load `id` from localStorage when the provider mounts
  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setIdState(storedId);
    }
  }, []);
  return <IdContext.Provider value={{ id, setId }}>{children}</IdContext.Provider>;
};

export const useId = () => {
  const context = useContext(IdContext);
  if (!context) {
    throw new Error("useId must be used within an IdProvider");
  }
  return context;
};
