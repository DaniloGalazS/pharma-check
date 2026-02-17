'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Suggestion {
  id: string
  genericName: string
  commercialName: string | null
  activePrinciple: string | null
}

interface SearchBoxProps {
  initialQuery?: string
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function SearchBox({
  initialQuery = '',
  placeholder = 'Busca un medicamento...',
  className,
  autoFocus,
}: SearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debouncedQuery = useDebounce(query, 250)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/medications/suggest?q=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) setSuggestions(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuggestions(debouncedQuery) }, [debouncedQuery, fetchSuggestions])

  function handleSelect(suggestion: Suggestion) {
    setOpen(false)
    router.push(`/medications/${suggestion.id}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      handleSelect(suggestions[activeIdx])
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    if (e.key === 'Escape')    { setOpen(false); setActiveIdx(-1) }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={activeIdx >= 0 ? `suggestion-${activeIdx}` : undefined}
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'h-14 w-full rounded-2xl border border-gray-300 bg-white pl-12 pr-12 text-base text-gray-900',
              'shadow-sm placeholder:text-gray-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              'transition-shadow hover:shadow-md'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && (suggestions.length > 0 || loading) && (
        <ul
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {loading && (
            <li className="px-4 py-3 text-sm text-gray-400">Buscando...</li>
          )}
          {!loading && suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => handleSelect(s)}
              className={cn(
                'flex cursor-pointer flex-col px-4 py-3 text-sm',
                'hover:bg-emerald-50',
                i === activeIdx && 'bg-emerald-50'
              )}
            >
              <span className="font-medium text-gray-900">
                {s.commercialName ?? s.genericName}
              </span>
              {s.activePrinciple && s.activePrinciple !== s.genericName && (
                <span className="text-xs text-gray-500">{s.activePrinciple}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
