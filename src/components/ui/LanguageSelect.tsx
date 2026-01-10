import { useDebateStore, type DebateLanguage } from '../../stores/debateStore'

const languages: { value: DebateLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
]

export function LanguageSelect() {
  const { language, setLanguage, status } = useDebateStore()
  const disabled = status !== 'idle'

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-sm">Language:</span>
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              language === lang.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={lang.label}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
