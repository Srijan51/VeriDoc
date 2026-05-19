import { useContext } from "react";
import { AuthContext } from "@/lib/context/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
