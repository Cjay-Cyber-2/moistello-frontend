# Moistello V1 — Page Plan (Updated)

## Structure
- `/people` = Groups/Communities discover page (browse groups)
- `/people/:id` = Group detail page (members, activity, join)
- `/profile` = User's own profile (view + edit combined, NO separate `/edit`)
- User public profiles via `/users/:id` (future)

## Legend
- ✅ = Exists
- ❌ = Not yet built

---

## Groups & Community (3 pages)

### /people ✅
Groups discover page. Browse communities, search, filter by category, featured groups grid.

### /people/:id ✅
Group detail page. Header, member avatars, stats, tags, activity feed, related groups, join button.

### /people/create ❌
Create a new group/community. Name, description, category, tags form.

---

## User Profile (1 page)

### /profile ✅
User's own profile. Two modes:
- **View** — avatar, display name, wallet, MoiScore, join date, stats, bio, social links
- **Edit** — inline editable fields for display name, bio, social URLs; save/cancel buttons

No separate `/profile/edit` page — edit is integrated into `/profile` via toggle.

---

## Circles (18 pages)

### Already exist (6)
- /circles, /circles/create, /circles/:id, /circles/:id/settings, /circles/:id/members, /circles/:id/rounds

### Missing (12)
- /circles/organizing, /circles/saved, /circles/templates, /circles/featured
- /circles/create/templates/:id, /circles/compare, /circles/:id/activity
- /circles/:id/export, /circles/:id/analytics, /circles/:id/schedule
- /circles/:id/comments

---

## Dashboard & Insights (4 pages)

### Already exist (3)
- /dashboard, /contributions, /payouts

### Missing (1)
- /insights/activity

---

## Wallet (4 pages)

### Already exist (1)
- /wallet

### Missing (3)
- /wallet/transactions, /wallet/transactions/:id, /wallet/addresses

---

## Notifications (2 pages)

### Already exist (1)
- /notifications

### Missing (1)
- /notifications/archive

---

## Settings (9 pages)

### Already exist (9) — all done
- /settings (hub), /settings/account, /settings/notifications, /settings/privacy
- /settings/sessions, /settings/theme, /settings/payment, /settings/language, /settings/savings

---

## Moderator Tools (8 pages) — all missing
- /mod/users, /mod/users/:id, /mod/users/:id/notes, /mod/users/:id/suspend
- /mod/circles, /mod/circles/:id, /mod/reports, /mod/reports/:id

---

## Platform Admin (12 pages) — all missing
- /admin, /admin/users, /admin/users/:id, /admin/circles, /admin/circles/:id
- /admin/circles/:id/force-close, /admin/feature-flags, /admin/announcements
- /admin/audit-log, /admin/metrics, /admin/tags, /admin/branding

---

## Help & Support (5 pages)

### Already exist (2)
- /support, /faq

### Missing (3)
- /help/circles, /help/wallet, /help/glossary

---

## Onboarding & Education (8 pages) — all missing
- /onboarding/welcome, /onboarding/connect-wallet, /onboarding/first-circle
- /onboarding/profile, /tour, /tutorials, /tutorials/:id, /changelog

---

## Developer (3 pages)

### Already exist (1)
- /developers

### Missing (2)
- /developers/api-keys, /developers/webhooks

---

## Platform (3 pages) — all missing
- /roadmap, /blog, /blog/:slug

---

## Extras (3 pages)

### Already exist (1)
- /support (already counted above)

### Missing (2)
- /history, /promos

---

## Static Pages (10 pages) — all exist
- /, /login, /register, /about, /how-it-works, /faq, /privacy, /terms, /status, /developers

---

## Docs (2 pages) — all exist
- /docs (markdown-rendered), /docs/api (Swagger)

---

## Error Pages (6) — all exist
- /not-found, /internal-error, /bad-request, /access-denied, /auth-required, /global-error

---

**Total: ~54 built, ~55 remaining to build**
