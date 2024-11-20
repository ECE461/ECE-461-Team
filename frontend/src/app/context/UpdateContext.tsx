// app/context/UpdateContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface UpdateContextType {
  name: string | null;
  version: string | null;
  id: string | null;
  setUpdateData: (name: string, version: string, id: string) => void;
  clearUpdateData: () => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider = ({ children }: { children: ReactNode }) => {
  const [updateData, setUpdateData] = useState<{ name: string | null; version: string | null; id: string | null }>({
    name: null,
    version: null,
    id: null,
  });

  const setUpdateDataHandler = (name: string, version: string, id: string) => {
    setUpdateData({ name, version, id });
  };

  const clearUpdateData = () => {
    // Reset only if any data exists to prevent unnecessary updates
    if (updateData.name || updateData.version || updateData.id) {
      setUpdateData({ name: null, version: null, id: null });
    }
  };

  return (
    <UpdateContext.Provider value={{ ...updateData, setUpdateData: setUpdateDataHandler, clearUpdateData }}>
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdateData = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdateData must be used within an UpdateProvider");
  }
  return context;
};
