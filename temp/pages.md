# Moistello V1 — All 113 Pages

## Legend
- ✅ = Exists
- ❌ = Missing (needs build)

---

## User Profile & Identity (8 pages)

### 1. /profile ❌
- Avatar (uploadable), display name, username, join date
- Stats bar: total circles joined, completed, total contributed, current streak
- Bio, social links (GitHub, Twitter)
- Badges (early adopter, 10 circles completed, etc.)
- Recent activity feed (last 10 actions)
- Edit button → /profile/edit

### 2. /profile/edit ❌
- Avatar upload with crop preview
- Display name input, username with availability check + URL preview
- Bio textarea with char counter
- Social links (Twitter, GitHub, website)
- Save / Cancel buttons

### 3. /settings/account ❌
- Username (editable, validated)
- Display name (editable)
- Language dropdown (English, French, Spanish, etc.)
- Timezone dropdown (auto-detect option)
- Save button with success feedback

### 4. /settings/notifications ❌
- Per-category toggles: contributions, payouts, invitations, disputes, announcements, circle activity
- Channel: in-app only (no email/push for V1)
- Frequency: immediately, digest (daily), off
- Save button

### 5. /settings/privacy ❌
- Profile visibility: Public / Members only / Private (radio group)
- Show on leaderboard: toggle
- Allow friend requests: toggle
- Allow messages from: Everyone / Friends only / Nobody
- Save button

### 6. /settings/sessions ❌
- Active sessions table: device, browser, OS, IP, last active, "current device" badge
- Revoke button per session (with confirmation)
- "Revoke all other sessions" button
- Empty state if only current session

### 7. /settings/delete ❌
- Warning explaining consequences (circles orphaned, data removed)
- Confirmation: type "DELETE" to enable the button
- Destructive red delete button
- Second confirmation modal

### 8. /settings/theme ❌
- Theme selector: Light / Dark / System (cards with preview)
- Density: Comfortable / Compact
- Accent color: preset picker (4-6 options)
- Font size: Small / Medium / Large
- Auto-save (no button)

### 9. /settings/payment ❌
- Saved bank accounts list: bank name, account number, account name
- Add bank account form: bank selector, account number, account name fields
- Set default withdrawal bank: radio selector per account
- Remove bank account: with confirmation
- Preferred currency: NGN / USDC selector
- Save button

---

## Circles (18 pages total, 11 missing)
- Tabs: Active / Completed / Pending
- Grid of circle cards (name, member count, your position, status, next action badge)
- Empty state per tab
- Quick stats: total circles, active count, completion rate

### 10. /circles/organizing ❌
- Tabs: Active / Completed / Drafts
- Grid of circles user organizes + member count, round progress
- Quick actions: invite members, manage, close circle
- Create new circle button (prominent CTA)

### 11. /circles/saved ❌
- Grid of bookmarked circles (name, contribution amount, frequency, member count)
- Unsave button per card
- Empty state with link to browse circles

### 12. /circles/templates ❌
- Template cards: pre-built configs (e.g. "Monthly Savings - 10 members")
- Name, description, member count, contribution range, frequency, payout type badges
- "Use template" button → pre-fills create wizard
- Empty state

### 13. /circles/featured ❌
- Curated/admin-picked featured circles
- Featured badge on cards
- Spotlight section at top
- Pagination

### 14. /circles/create/templates/:id ❌
- Same 4-step wizard as /circles/create but pre-filled from template
- Template badge showing source
- All steps populated, user can edit before submitting

### 15. /circles/compare ❌
- Checkbox selector (pick 2-4 circles)
- Comparison table: rows = attributes, columns = circles
- Highlight differences between them
- Share comparison link

### 16. /circles/:id/activity ❌
- Chronological activity feed (member joined, contributed, payout, dispute, late report)
- Filter by type dropdown
- Each item: icon, description, timestamp, user avatar
- Load more / pagination
- Empty state

### 17. /circles/:id/export ❌
- Export options: CSV or JSON
- Scope: Members, Contributions, Payouts, Full (checkboxes)
- Date range picker (optional)
- Export button → downloads file
- Previous exports list

### 18. /circles/:id/analytics ❌
- Contribution completion rate bar chart (per round)
- Member activity heatmap
- Payout distribution pie/bar chart
- Round timeline with status indicators
- Stats cards: total contributed, paid out, average time, late rate

### 19. /circles/:id/schedule ❌
- Monthly calendar view with payout dates and deadlines
- Round markers: contribution deadline, payout date
- Current round highlighted with countdown
- Legend: deadline, payout, completed, missed

### 20. /circles/:id/comments ❌
- Single-threaded comments per round (not free-form chat)
- Only circle members can post
- System auto-posts: "Round 3 completed", "Member joined"
- Moderate: circle organizer can delete inappropriate comments
- No typing indicators, no read receipts, no emoji picker

### ✅ Already exist
- /circles (browse/discover)
- /circles/create
- /circles/:id (detail)
- /circles/:id/settings
- /circles/:id/members
- /circles/:id/rounds

---

## People & Community (9 pages)

### 21. /people ❌
- Search bar (by name or username)
- Filters: recently active, most circles, highest reputation
- Results grid: avatar, name, badges, circles count, join date
- Pagination
- Empty state

### 22. /people/:id ❌
- Profile header: avatar, display name, username, join date
- Stats: circles joined, completed, current streak
- Bio (if public)
- Circles they're in (public circles only)
- Badges
- Actions: Add friend / Message / Block / Report

### 23. /people/:id/circles ❌
- Grid of public circles the user belongs to
- Filter: active / completed
- Each card: circle name, member count, role badge (organizer/member)
- Empty state

### 24. /people/:id/activity ❌
- Public activity feed (circles completed, contributions with amounts hidden, payouts received)
- Chronological timeline
- Respects user's privacy settings

### 25. /friends ❌
- Tabs: All Friends / Pending / Sent Requests
- Friends grid: avatar, name, friends-since date, message button
- Unfriend button with confirmation
- Empty state + invite CTA

### 26. /friends/requests ❌
- Incoming requests: avatar, name, Accept / Decline buttons
- Outgoing requests: avatar, name, "Sent" badge, Cancel button
- Empty state per tab

### 27. /friends/invite ❌
- Shareable invite link (copy button)
- Native share API button
- QR code (scannable)
- Recent invites list (pending / joined)

### 28. /people/search ❌
- Advanced search: name, username, tags
- Results table: avatar, name, circles count, join date, add friend button
- Pagination

### 29. /people/suggested ❌
- Grid of suggested members (based on shared circles, same frequency/currency)
- "Why suggested" label per card
- Add friend button
- Dismiss button ("Not interested")

---

## Dashboard & Insights (4 pages)

### 30. /dashboard/customize ❌
- Widget list: stats, circles, activity, chart
- Drag to reorder
- Toggle visibility per widget
- Save layout button

### 31. /dashboard/quick-actions ❌
- Large action tiles: Create Circle, Join Circle, View Contributions, View Payouts
- Recent actions (last 5, one-click repeat)
- Edit / customize shortcuts

### 32. /insights/contributions ❌
- Time chart: contributions over time (line/bar, filterable by week/month/all)
- Frequency heatmap (which days contribute most)
- Per-circle breakdown (stacked bars)
- Summary stats: total contributed, average per round, longest streak

### 33. /insights/activity ❌
- All platform actions across all circles (timeline)
- Summary cards: circles completed, contributions, payouts on-time average
- Current streak (consecutive on-time contributions)
- Badge progress indicator

### ✅ Already exist
- /dashboard
- /contributions
- /payouts

---

## Wallet (4 pages)

### 34. /wallet/transactions ❌
- Transaction table: date, type, amount, status, circle name, Stellar txn link
- Filters: by type, circle, date range
- Search by memo / transaction hash
- Pagination
- Export CSV button

### 35. /wallet/transactions/:id ❌
- Full transaction detail: txn hash, date, amount, circle, counterparty, fee, memo, status, block
- Stellar.expert link
- Copy hash button
- Related transactions (same circle/round)

### 36. /wallet/verification ❌
- Purpose: prove wallet ownership
- Sign message prompt ("Sign this nonce to verify")
- Verified badge (after successful signing)
- Next steps (optional links)

### 37. /wallet/addresses ❌
- Connected addresses list: public key, wallet type, nickname, connected date
- Primary badge on one address
- Add / remove address UI
- Copy address button per row

### ✅ Already exist
- /wallet (overview)

---

## Notifications & Communication (2 pages)

### 38. /notifications/archive ❌
- Same layout as /notifications but shows all read notifications
- Sort: newest / oldest
- Filter by type badges
- Clear all archive button

### 39. /notifications/settings ❌
- Per-category toggles (same as settings/notifications)
- Frequency per category
- Links back to main settings

### ✅ Already exist
- /notifications

---

## Moderator Tools (8 pages)

### 40. /mod/users ❌
- User table: avatar, name, username, status, circles count, flags count, join date
- Search by name/username/wallet
- Filters: status, date range
- Actions: view, suspend, add note
- Pagination

### 41. /mod/users/:id ❌
- Full user details, wallet addresses, join date
- Activity log (chronological)
- Flagged content / reports against this user
- Mod notes section (add note form)
- Actions: Suspend / Reinstate / Delete

### 42. /mod/users/:id/notes ❌
- Internal mod notes list (newest first)
- Add note textarea + submit
- Author + timestamp per note
- Delete own note

### 43. /mod/users/:id/suspend ❌
- Reason dropdown: spam, abuse, suspicious activity, other
- Duration: hours / days / permanent
- Internal note (optional)
- Preview: what user sees when suspended
- Confirm / Reinstate buttons

### 44. /mod/circles ❌
- Circle table: name, organizer, member count, status, created date, flags count
- Search by name
- Filters: status, type
- Actions: view, force-close
- Pagination

### 45. /mod/circles/:id ❌
- Full circle info, member list, round progress, recent activity
- Flags/reports against this circle
- Actions: force-close, remove member, add mod note
- Mod notes section

### 46. /mod/reports ❌
- Reports queue table: reported item, reporter, reason, date, status
- Filters: status, reason type
- Actions: view, resolve, dismiss
- Pagination

### 47. /mod/reports/:id ❌
- Report details: reporter, reported user/circle, reason, description, evidence, date
- Embedded view of reported content
- Resolution: Dismiss / Issue warning / Suspend user
- Resolution notes

---

## Platform Management (12 pages)
**Scope**: Controls platform health (UI/content layer only). Never touches smart contracts or user funds. Powers: suspend bad actors, force-close stuck circles (emergency break-glass), toggle features, view read-only metrics. The smart contracts remain the canonical source of truth for all financial state.

### 48. /admin ❌
- Dashboard: total users, active circles, new today, circles created today, contributions
- Quick links: users, circles, announcements, feature flags
- Recent activity (last 10 events)
- System health: API status, DB status, last migration

### 49. /admin/users ❌
- User table: avatar, name, username, wallet, status, circles count, created, last active
- Search by name/username/wallet
- Filters: status, date range
- Bulk actions: suspend, delete, export selected
- Pagination

### 50. /admin/users/:id ❌
- Full context: profile, wallets, circles, contributions, payouts, activity log, mod notes, flags, sessions
- Quick actions: suspend, delete, change role (user/mod/admin)
- Override fields (display name, role)

### 51. /admin/circles ❌
- Circle table: name, organizer, status, type, member count, created date, last round
- Search by name
- Filters: status, type
- Actions: view, force-close
- Pagination

### 52. /admin/circles/:id ❌
- Full circle view, member list, round timeline, contributions, payouts, activity
- Actions: force-close, change status (pause/resume), remove member
- Mod notes

### 53. /admin/circles/:id/force-close ❌
- Warning with consequences
- Reason text input
- Type circle name to confirm
- Destructive force-close button

### 54. /admin/feature-flags ❌
- Flag list: name, description, current state, toggle
- Flags: registration_open, circle_creation_open, new_circle_types, experimental_ui, maintenance_mode
- Audit log of changes

### 55. /admin/announcements ❌
- Announcement list: title, body, created, sent, read count
- Create: title, body, target (all, active only, specific), schedule date
- Send button

### 56. /admin/audit-log ❌
- Log table: timestamp, user, action, resource, details (expandable JSON)
- Filters: user, action type, date range, resource type
- Export CSV
- Pagination

### 57. /admin/metrics ❌
- Charts: new users, circles created, contributions, active users (daily/weekly/monthly)
- Date range selector: 7d / 30d / 90d / custom
- Summary cards: total users, total circles, total contributions, DAU, MAU
- Export chart data (CSV)

### 58. /admin/tags ❌
- Tag list: name, usage count, created date
- Create tag: name, color, save
- Edit tag: rename, recolor
- Delete tag (confirmation, removes from circles)
- Drag to reorder

### 59. /admin/branding ❌
- Platform name input
- Logo upload + preview
- Favicon upload + preview
- Primary color picker
- Custom CSS (optional)
- Live preview
- Save / Reset to defaults

---

## Help & Support (7 pages)

### 60. /help/circles ❌
- Explains ROSCA model, how circles work, rounds, contributions, deadlines, payout types
- Visual diagram of flow
- Related links

### 61. /help/wallet ❌
- Stellar wallet explanation, Freighter, Passkey, security tips
- Troubleshooting common wallet issues

### 62. /help/troubleshooting ❌
- Accordion: stuck transaction, wallet connection, contribution not recorded, circle stuck on pending
- Each: cause, solution steps, when to contact support

### 63. /help/glossary ❌
- A-Z searchable glossary
- Terms: Circle, Round, Contribution, Payout, Frequency, Collateral, Late Fee, Strike, Default, Dispute, ROSCA, MoiScore, etc.

### 64. /support/tickets ❌
- Ticket list: ID, subject, status, date, last update
- Filters: status
- Create ticket button
- Empty state
- Pagination

### 65. /support/tickets/create ❌
- Category: account, circle issue, technical, feature request, other
- Subject input
- Description textarea
- File upload (optional)
- Submit → redirects to ticket detail

### 66. /support/tickets/:id ❌
- Header: ID, subject, status badge, category
- Conversation: staff + user replies (chronological)
- Reply form: textarea + submit
- Close ticket button
- Status indicators: open, waiting, resolved, closed

### ✅ Already exist
- /help (currently /support)
- /help/faq (/faq)

---

## Onboarding & Education (8 pages)

### 67. /onboarding/welcome ❌
- Step 1/5: welcome message, logo, brief intro
- "Get Started" button → step 2
- Skip link → dashboard

### 68. /onboarding/connect-wallet ❌
- Step 2/5: wallet connection prompt
- Options: Freighter / Passkey / WalletConnect
- Visual guide with icons
- Success state with wallet address
- "Next" after connection

### 69. /onboarding/first-circle ❌
- Step 3/5: join or create first circle
- Browse featured circles / Create your own / Skip
- Recommendation for new users

### 70. /onboarding/profile ❌
- Step 4/5: complete profile
- Avatar (optional)
- Display name (required)
- Bio (optional)
- "Continue" button

### 71. /tour ❌
- Interactive overlay highlighting UI elements
- Steps: sidebar, header, dashboard, circles, notifications, profile
- Progress indicator
- Dismiss / skip

### 72. /tutorials ❌
- Cards grid: thumbnail, title, duration, difficulty badge
- Categories: Getting Started, Circles, Wallet, Advanced
- Search
- Empty state

### 73. /tutorials/:id ❌
- Video embed
- Steps list below
- Related tutorials sidebar
- Mark complete button

### 74. /changelog ❌
- Chronological entries with version tag
- Bullet changes (new features, fixes, improvements)
- RSS / Atom feed link
- Load older button

---

## Developer (2 pages)

### 75. /developers/api-keys ❌
- Keys table: name, preview, created, last used, permissions
- Create key: name, permission checkboxes
- Reveal key modal (shown once)
- Revoke with confirmation
- Empty state

### 76. /developers/webhooks ❌
- Webhooks table: URL, events, status, last delivery
- Create: URL, event checkboxes
- Test button → send test payload
- Delivery log per webhook
- Disable / Delete

### ✅ Already exist
- /developers
- /developers/docs (/docs/api)

---

## Platform (3 pages)

### 77. /roadmap ❌
- Timeline by quarter/month
- Columns: Planned / In Progress / Shipped
- Feature cards with status badge
- Vote/upvote (requires login)
- Submit idea link

### 78. /blog ❌
- Cards grid: image, title, excerpt, author, date, read time, tags
- Load more button
- Category filter
- Search

### 79. /blog/:slug ❌
- Featured image, title, author, date, read time
- Body rendered from markdown
- Share buttons
- Related articles
- Comments (optional)

---

## Extras (5 pages)

### 80. /history ❌
- Unified activity timeline across all features (circles, contributions, payouts, wallet, referrals)
- Filter by type: circles, contributions, payouts, wallet, referrals
- Date range filter
- Search by keyword
- Each item: icon, title, description, timestamp, related resource link
- Export as CSV
- Infinite scroll / pagination
- Empty state

### 81. /settings/language ❌
- Language picker: searchable list of available languages
- Region selector (affects date, time, number formats)
- Auto-detect from browser toggle
- Preview section showing how dates, times, and currencies look in selected locale
- Save button

### 82. /settings/savings ❌
- Savings goals list: name, target amount, current progress, target date
- Create goal form: name, target amount, target date, circle auto-join toggle
- Auto-contribute rules: frequency (daily/weekly/monthly), amount, source wallet
- Round-up toggle: automatically round up contributions to nearest thousand
- Savings streak tracker and rewards badge
- Save button per section

### 83. /promos ❌
- Active promotions carousel: banner with image, title, description, CTA
- Referral rewards section: referral code, share buttons, QR code, earnings summary
- Referral history table: referred user, date, reward status, amount
- Bonus history: date, type (welcome bonus, referral, streak reward, circle completion), amount, status
- Promo code entry: text input + redeem button
- Empty state per section

### 84. /support ❌
- Unified support landing page
- Quick actions: search knowledge base, create ticket, view my tickets, live chat (if available)
- Knowledge base search bar (prominent, centered)
- Popular articles grid: thumbnail, title, read time
- My tickets section: last 5 tickets with status badge, "View All" link
- Contact options: email, live chat hours, estimated response time
- FAQ accordion: most common questions collapsed/expandable

## Already Existing (30 pages)

| # | Page | Notes |
|---|------|-------|
| — | / | Landing page |
| — | /login | Auth |
| — | /register | Auth |
| — | /dashboard | Dashboard |
| — | /circles | Browse circles |
| — | /circles/create | Create wizard |
| — | /circles/:id | Circle detail |
| — | /circles/:id/settings | Circle settings |
| — | /circles/:id/members | Member list |
| — | /circles/:id/rounds | Round timeline |
| — | /contributions | My contributions |
| — | /payouts | My payouts |
| — | /wallet | Wallet overview |
| — | /notifications | Notifications |
| — | /settings | User settings (shell) |
| — | /about | Static |
| — | /how-it-works | Static |
| — | /faq | Static |
| — | /privacy | Static |
| — | /terms | Static |
| — | /status | Static |
| — | /developers | Developer hub |
| — | /discover | Redirects to /circles |
| — | /support | Static/shell |
| — | /bad-request | Error page |
| — | /access-denied | Error page |
| — | /internal-error | Error page |
| — | /auth-required | Error page |
| — | /not-found | Built-in |
| — | /global-error | Error boundary |

---

**Total: 84 pages to build + 30 existing = 114**

> Note: 84 numbered items in the file. 30 existing pages counted from the table below. 84 + 30 = 114.
