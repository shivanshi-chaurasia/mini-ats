import { useState, useEffect, useRef } from 'react'

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// Re-runs when deps change or reload() is called. Stale responses are ignored.
export function useFetch(fetchFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  useEffect(() => {
    let cancelled = false
    setState(prev => ({ ...prev, loading: true, error: null }))
    fetchRef.current()
      .then(res => { if (!cancelled) setState({ data: res.data, loading: false, error: null }) })
      .catch(error => { if (!cancelled) setState(prev => ({ ...prev, loading: false, error })) })
    return () => { cancelled = true }
  }, [...deps, tick])

  return { ...state, reload: () => setTick(t => t + 1) }
}
