import { create } from "zustand";

export interface DashboardFilterState {
  organization: string;
  setOrganization: (org: string) => void;
  period: "7d" | "30d" | "90d";
  setPeriod: (period: "7d" | "30d" | "90d") => void;
  environment: "all" | "aws" | "azure" | "gcp" | "on_prem" | "others";
  setEnvironment: (env: "all" | "aws" | "azure" | "gcp" | "on_prem" | "others") => void;
}

export const useDashboardFilter = create<DashboardFilterState>((set) => ({
  organization: "Acme Healthcare",
  setOrganization: (organization) => set({ organization }),
  period: "30d",
  setPeriod: (period) => set({ period }),
  environment: "all",
  setEnvironment: (environment) => set({ environment }),
}));
