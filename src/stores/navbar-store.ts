"use client";

import { create } from "zustand";

type NavbarState = {
  catalogSearch: string;
  setCatalogSearch: (value: string) => void;
};

export const useNavbarStore = create<NavbarState>((set) => ({
  catalogSearch: "",
  setCatalogSearch: (catalogSearch) => set({ catalogSearch }),
}));
