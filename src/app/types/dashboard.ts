import type { RepairRecord } from "../data/processData";

export interface DashboardFilters {
  engineer: string;
  location: string;
  damageType: string;
  client: string;
}

export interface DashboardOutletContext {
  filters: DashboardFilters;
  data: RepairRecord[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}