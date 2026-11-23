'use client';

import { createContext, useContext } from 'react';

const CatalogContext = createContext({ catalog: [], categories: {}, brands: [], unavailable: false });

export function CatalogProvider({ value, children }) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
