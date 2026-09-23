import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";

export type WorkspaceMode = "member" | "staff";

type WorkspaceValue = {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
};

const WorkspaceContext = createContext<WorkspaceValue>({
  mode: "member",
  setMode: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<WorkspaceMode>("member");

  useEffect(() => {
    if (!isAdmin) {
      setMode("member");
      return;
    }

    if (window.localStorage.getItem("alumniconnect_workspace_mode") === "staff") {
      setMode("staff");
    }
  }, [isAdmin]);

  function updateMode(nextMode: WorkspaceMode) {
    if (nextMode === "staff" && !isAdmin) return;
    setMode(nextMode);
    window.localStorage.setItem("alumniconnect_workspace_mode", nextMode);
  }

  return (
    <WorkspaceContext.Provider value={{ mode, setMode: updateMode }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
