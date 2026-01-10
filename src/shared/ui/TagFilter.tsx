import { useMemo } from 'react'
import type { Avatar } from '../../lib/types/avatar'

interface TagFilterProps {
  avatars: Avatar[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  className?: string
}

export function TagFilter({ avatars, selectedTags, onTagsChange, className = '' }: TagFilterProps) {
  // Extract all unique tags from avatars
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    avatars.forEach((avatar) => {
      if (avatar.tags) {
        avatar.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [avatars])

  if (availableTags.length === 0) {
    return null
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        Filter by Tags
      </label>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }
              `}
            >
              {tag}
              {isSelected && (
                <span className="ml-1.5 text-xs">✓</span>
              )}
            </button>
          )
        })}
      </div>
      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={() => onTagsChange([])}
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

