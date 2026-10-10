import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

/** Catalog (categories, sizes, conditions, cities) loaded once from the API. */
const MetaContext = createContext(null);

const EMPTY = { categories: [], conditions: [], sizes: [], audiences: [], cities: [], brandTiers: [] };

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(EMPTY);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/listings/meta')
      .then(setMeta)
      .catch((e) => setError(e.message));
  }, []);

  return <MetaContext.Provider value={{ ...meta, metaError: error }}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  return useContext(MetaContext) || EMPTY;
}
