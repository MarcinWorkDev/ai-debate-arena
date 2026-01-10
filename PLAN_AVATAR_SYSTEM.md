# Plan: System Zarządzania Avatarami w Bazie Danych

## Podsumowanie

Implementacja systemu przechowywania definicji agentów/avatarów w Firestore z pełnym workflow zatwierdzania, changeloga i zarządzania przez admina.

---

## 1. Schema Firestore

### Kolekcja `avatars`

```typescript
interface Avatar {
  id: string

  // Podstawowe właściwości agenta
  name: string
  color: string
  model: string
  persona: string
  isModerator?: boolean

  // Własność i widoczność
  authorEmail: string
  authorUid: string
  visibility: 'private' | 'public'

  // Status
  status: 'active' | 'blocked'
  blockedReason?: string
  blockedAt?: Date
  blockedBy?: string

  // Prośba o odblokowanie
  unblockRequested?: boolean
  unblockRequestedAt?: Date
  unblockRequestReason?: string

  // Workflow promocji (private -> public)
  promotionStatus: 'none' | 'pending' | 'approved' | 'rejected'
  promotionRequestedAt?: Date
  promotionApprovedAt?: Date
  promotionApprovedBy?: string
  promotionRejectedAt?: Date
  promotionRejectedBy?: string
  promotionRejectedReason?: string

  // Fork tracking
  forkedFromId?: string
  forkedFromName?: string

  // Migracja
  isMigrated?: boolean
  originalAgentId?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### Subkolekcja `avatars/{id}/changelog`

```typescript
interface AvatarChangelog {
  id: string
  action: 'created' | 'updated' | 'promoted_request' | 'promoted_approved' |
          'promoted_rejected' | 'blocked' | 'unblocked' | 'unblock_requested' |
          'suggestion_submitted' | 'suggestion_approved' | 'suggestion_rejected' | 'forked'
  actorEmail: string
  actorUid: string
  changes?: { field: string, oldValue: string, newValue: string }[]
  reason?: string
  timestamp: Date
}
```

### Subkolekcja `avatars/{id}/suggestions`

```typescript
interface AvatarSuggestion {
  id: string
  suggestedChanges: { name?: string, color?: string, model?: string, persona?: string }
  submitterEmail: string
  submitterUid: string
  submissionReason?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
  createdAt: Date
}
```

---

## 2. Nowe Pliki

### Typy i DB
- `src/lib/types/avatar.ts` - interfejsy TypeScript
- `src/lib/avatarDb.ts` - operacje CRUD na avatarach

### Store i Hook
- `src/stores/avatarStore.ts` - stan Zustand
- `src/hooks/useAvatars.ts` - hook do operacji

### Strona użytkownika
- `src/pages/AvatarsPage.tsx` - strona `/avatars`

### Komponenty avatarów
- `src/components/avatars/AvatarList.tsx` - lista avatarów
- `src/components/avatars/AvatarCard.tsx` - karta avatara
- `src/components/avatars/AvatarForm.tsx` - formularz tworzenia/edycji
- `src/components/avatars/AvatarDetailModal.tsx` - szczegóły + changelog
- `src/components/avatars/PromotionWarningModal.tsx` - ostrzeżenie przy promocji
- `src/components/avatars/SuggestionForm.tsx` - formularz sugestii
- `src/components/avatars/ForkConfirmModal.tsx` - potwierdzenie forka
- `src/components/avatars/AvatarStatusBadge.tsx` - badge statusu
- `src/components/avatars/ChangelogView.tsx` - widok historii zmian

### Komponenty admina
- `src/components/admin/AdminAvatarList.tsx` - wszystkie avatary
- `src/components/admin/PromotionRequestList.tsx` - prośby o promocję
- `src/components/admin/SuggestionReviewList.tsx` - sugestie do review
- `src/components/admin/UnblockRequestList.tsx` - prośby o odblokowanie
- `src/components/admin/BlockAvatarModal.tsx` - blokowanie z powodem

---

## 3. Modyfikacje Istniejących Plików

| Plik | Zmiany |
|------|--------|
| `src/App.tsx` | Dodanie route `/avatars`, auto-migracja |
| `src/components/ui/DebatersModal.tsx` | Ładowanie avatarów z Firestore |
| `src/hooks/useDebate.ts` | Używanie avatarów z bazy |
| `src/components/admin/AdminPanel.tsx` | Nowe zakładki: Avatars, Promotions, Suggestions, Unblock |
| `src/lib/agents.ts` | Dodanie funkcji `avatarToAgent()` do konwersji |

---

## 4. Funkcje w avatarDb.ts

### CRUD
- `createAvatar()` - tworzenie (domyślnie prywatny)
- `getAvatar()` - pobieranie pojedynczego
- `getUserVisibleAvatars()` - prywatne użytkownika + publiczne aktywne
- `getUserAvatars()` - tylko własne
- `updateAvatar()` - aktualizacja (z changelog)
- `deleteAvatar()` - usuwanie (tylko prywatne)

### Promocja
- `requestPromotion()` - prośba o upublicznienie
- `approvePromotion()` - admin zatwierdza
- `rejectPromotion()` - admin odrzuca z powodem

### Blokowanie
- `blockAvatar()` - admin blokuje z powodem
- `unblockAvatar()` - admin odblokowuje
- `requestUnblock()` - autor prosi o odblokowanie

### Sugestie (dla publicznych)
- `submitSuggestion()` - zgłoszenie zmiany
- `getAvatarSuggestions()` - lista sugestii
- `getAllPendingSuggestions()` - admin: wszystkie pending
- `approveSuggestion()` - admin zatwierdza (aplikuje zmiany)
- `rejectSuggestion()` - admin odrzuca z powodem

### Fork
- `forkAvatar()` - kopia publicznego do prywatnego

### Changelog
- `getAvatarChangelog()` - historia zmian
- `addChangelogEntry()` - wewnętrzna funkcja

### Admin
- `getAllAvatars()` - wszystkie avatary
- `getPendingPromotions()` - oczekujące na promocję
- `getUnblockRequests()` - prośby o odblokowanie

### Migracja
- `checkMigrationNeeded()` - czy potrzebna migracja
- `migrateHardcodedAgents()` - migracja z agents.ts

---

## 5. Migracja Hardcoded Agentów

Przy starcie aplikacji (w App.tsx):
1. Sprawdź czy kolekcja `avatars` zawiera agentów z `isMigrated: true`
2. Jeśli nie - uruchom migrację
3. Dla każdego agenta z `agents.ts`:
   - Utwórz dokument w `avatars` z `visibility: 'public'`
   - Ustaw `authorEmail: 'marcin93li@gmail.com'`
   - Ustaw `promotionStatus: 'approved'`
   - Dodaj wpis do changelog: `action: 'created'`

---

## 6. Flow Użytkownika

### Tworzenie avatara
1. User → `/avatars` → "Utwórz nowy"
2. Wypełnia formularz (name, color, model, persona)
3. Avatar tworzony jako `private`, `status: active`
4. Dodawany wpis changelog

### Promocja do public
1. User klika "Awansuj na public"
2. Modal z ostrzeżeniem (operacja jednostronna)
3. Po potwierdzeniu: `promotionStatus: 'pending'`
4. Admin widzi w zakładce "Promotions"
5. Admin approve → `visibility: 'public'`, `promotionStatus: 'approved'`
6. Admin reject → `promotionStatus: 'rejected'` z powodem
7. User może ponowić próbę

### Edycja publicznego
1. User otwiera publiczny avatar (nie swój)
2. Opcje: "Zaproponuj zmianę" lub "Utwórz fork"
3. Sugestia → admin review → approve/reject
4. Fork → nowy prywatny avatar z `forkedFromId`

### Blokowanie
1. Admin widzi avatar w liście
2. Klika "Zablokuj" → podaje powód
3. Autor widzi status "Zablokowany" z powodem
4. Autor może wysłać prośbę o odblokowanie
5. Admin widzi prośbę → może odblokować

---

## 7. Weryfikacja

### Testy manualne
1. **Migracja**: Uruchom app, sprawdź czy agenci są w Firestore
2. **Tworzenie**: Utwórz prywatny avatar, sprawdź w bazie
3. **Promocja**: Poproś o promocję, zatwierdź jako admin
4. **Sugestia**: Zaproponuj zmianę publicznego, zatwierdź
5. **Fork**: Utwórz fork, sprawdź czy ma `forkedFromId`
6. **Blokowanie**: Zablokuj, sprawdź czy autor widzi powód
7. **Debata**: Sprawdź czy avatary z bazy działają w debacie

### Komendy
```bash
npm run dev          # Uruchom aplikację
# Sprawdź konsolę Firestore czy kolekcja avatars istnieje
# Przetestuj flow przez UI
```

---

## 8. Kolejność Implementacji

1. Typy (`src/lib/types/avatar.ts`)
2. DB functions (`src/lib/avatarDb.ts`)
3. Store + Hook
4. Migracja + trigger w App.tsx
5. Strona AvatarsPage + komponenty podstawowe
6. Workflow promocji
7. Sugestie + fork
8. Panel admina
9. Integracja z DebatersModal
10. Testy + poprawki
