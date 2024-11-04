"use client";

import React, { createContext, useContext, useState } from "react";

const IdContext = createContext<{ id: string | null; setId: (id: string) => void } | undefined>(undefined);

export const IdProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setId] = useState<string | null>(null);

  return <IdContext.Provider value={{ id, setId }}>{children}</IdContext.Provider>;
};

export const useId = () => {
  const context = useContext(IdContext);
  if (!context) {
    throw new Error("useId must be used within an IdProvider");
  }
  return context;
};
