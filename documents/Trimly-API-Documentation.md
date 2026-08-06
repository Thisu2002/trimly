# Trimly API Documentation

**Base URL:** `http://localhost:4000` (default) — production URL depends on Railway deployment
**Content-Type:** `application/json` unless noted (some endpoints use `multipart/form-data` for file uploads)

## Authentication

Most endpoints are authenticated using an **Auth0 ID token**, passed either:
- In the request body as `idToken`, or
- As a query parameter `?idToken=...`

The token is verified server-side (`verifyIdToken`), and the user's role (`admin`, `stylist`, `customer`) is resolved from the token or database to enforce access control.

A few endpoints (`/api/users/*`) instead use a standard `Authorization: Bearer <token>` header.

Endpoints that don't require a token (e.g. public salon listings) are marked **Public**.

---

## Table of Contents
1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Salon (Admin)](#3-salon-admin)
4. [Salon Hours (Admin)](#4-salon-hours-admin)
5. [Services (Admin)](#5-services-admin)
6. [Stylists (Admin)](#6-stylists-admin)
7. [Stylist Dashboard](#7-stylist-dashboard)
8. [Mobile (Consumer)](#8-mobile-consumer)
9. [Appointments](#9-appointments)
10. [Payment](#10-payment)
11. [Reviews](#11-reviews)
12. [Loyalty (Admin)](#12-loyalty-admin)
13. [Loyalty (Customer)](#13-loyalty-customer)
14. [Inventory (Admin)](#14-inventory-admin)
15. [Hair Profile](#15-hair-profile)
16. [Face Photos](#16-face-photos)
17. [Hair Generate (AI)](#17-hair-generate-ai)
18. [Recommendation (AI)](#18-recommendation-ai)
19. [Trending Styles](#19-trending-styles)
20. [Health](#20-health)

---

## 1. Auth
Base path: `/api/auth`

### `POST /api/auth`
Logs a user in (or creates them on first login) based on their Auth0 ID token. Determines role from the token's `https://trimly.app/roles` claim and upserts a `User` row (plus a `Customer` profile if the role is `customer`).

**Body**
```json
{ "idToken": "string" }
```
**Response `200`**
```json
{ "user": { "...": "User record with adminSalon/customerProfile/stylistProfile" }, "isNewUser": true }
```
**Errors:** `400` missing idToken/email, `401` invalid token

### `POST /api/auth/me`
Lightweight variant — fetches or creates a user record without the full include set on customer profile.

**Body:** `{ "idToken": "string" }`
**Response `200`:** `{ "user": { "...": "User with adminSalon" } }`

---

## 2. Users
Base path: `/api/users`
**Auth:** `Authorization: Bearer <idToken>` header (not `idToken` in body/query)

### `GET /api/users/me`
Returns the current user's profile.

**Response `200`**
```json
{ "id": "string", "name": "string", "email": "string", "phone": "string|null", "address": "string|null", "role": "admin|stylist|customer" }
```

### `PATCH /api/users/me`
Updates the current user's `name`, `phone`, and/or `address` (at least one required).

**Body**
```json
{ "name": "string?", "phone": "string?", "address": "string?" }
```
**Response `200`:** updated user object (same shape as above)
**Errors:** `400` no fields provided

---

## 3. Salon (Admin)
Base path: `/api/salon`
**Auth:** admin `idToken`

### `POST /api/salon`
Creates the admin's salon. `multipart/form-data`, field `photos` (up to 5 images).

**Form fields:** `idToken, name, phone, address, about, latitude?, longitude?, photos[]`
**Response `200`:** created `Salon` object
**Errors:** `403` not admin, `400` salon already exists

### `GET /api/salon/me`
Returns the current admin's salon.
**Query:** `idToken`
**Response `200`:** `Salon` object
**Errors:** `404` no salon found

### `PATCH /api/salon/me`
Updates the admin's salon. `multipart/form-data`, field `newPhotos` (up to 5 images).

**Form fields:** `idToken, name, phone, address, about, latitude?, longitude?, keepPhotos (JSON string array of URLs to retain), newPhotos[]`
**Response `200`:** updated `Salon` object (final photo list capped at 5, oldest excess removed)

---

## 4. Salon Hours (Admin)
Base path: `/api/salon-hours`
**Auth:** admin `idToken`

### `POST /api/salon-hours/get`
Returns the salon's weekly business hours (defaults are filled in for any missing day).

**Body:** `{ "idToken": "string" }`
**Response `200`**
```json
{ "salonId": "string", "hours": [{ "dayOfWeek": "monday", "openTime": "09:00", "closeTime": "18:00", "slotDuration": 15, "isClosed": false }, "..."] }
```

### `PUT /api/salon-hours`
Replaces all 7 days of business hours (upsert). Validates time format (`HH:MM`), that open < close, and no duplicate/invalid days.

**Body**
```json
{ "idToken": "string", "hours": [{ "dayOfWeek": "monday", "openTime": "09:00", "closeTime": "18:00", "slotDuration": 15, "isClosed": false }, "... 7 entries"] }
```
**Response `200`:** `{ "message": "Salon hours updated successfully", "hours": [...] }`

---

## 5. Services (Admin)
Base path: `/api/service`
**Auth:** admin `idToken`

### `POST /api/service`
Creates a service. Can create a new category inline via `newCategoryName`/`newCategoryDescription`, or use an existing `categoryId`. The service's `styleId` is auto-detected from the name.

**Body:** `{ "idToken", "name", "description", "durationMin", "priceLkr", "categoryId?", "newCategoryName?", "newCategoryDescription?" }`
**Response `200`:** `{ "service": {...}, "createdCategoryId": "string|undefined" }`

### `GET /api/service/categories`
Lists the admin's service categories.
**Query:** `idToken`
**Response `200`:** array of `Category`

### `GET /api/service/list`
Lists all services for the admin's salon (with category included).
**Query:** `idToken`
**Response `200`:** array of `Service`

### `GET /api/service/:id`
Fetches a single service (for the edit modal).
**Query:** `idToken`
**Response `200`:** `Service` with `category`
**Errors:** `404` not found

### `PUT /api/service/:id`
Updates a service. Re-detects `styleId` if `name` changed.

**Body:** `{ "idToken", "name", "description", "durationMin", "priceLkr", "categoryId" }`
**Response `200`:** updated `Service`

### `DELETE /api/service/:id`
Deletes a service.
**Query:** `idToken`
**Response `200`:** `{ "success": true }`
**Errors:** `409` if the service is linked to existing appointments

---

## 6. Stylists (Admin)
Base path: `/api/stylist`
**Auth:** admin `idToken`

### `POST /api/stylist`
Creates a stylist: registers an Auth0 user (temp password, triggers a password-reset email), then creates matching `User` + `Stylist` records with services and weekly shifts.

**Body**
```json
{
  "idToken": "string", "name": "string", "email": "string", "phone": "string", "address": "string",
  "bio": "string", "yearsOfExperience": 0, "status": "on_duty|off_duty",
  "services": ["serviceId", "..."],
  "weeklyShifts": [{ "dayOfWeek": "monday", "startTime": "09:00", "endTime": "18:00", "isOff": false }]
}
```
**Response `200`:** created `Stylist`
**Errors:** `409` email already exists

### `GET /api/stylist/list`
Lists all stylists for the admin's salon, including services, weekly shifts, and appointment counts.
**Query:** `idToken`
**Response `200`:** array of formatted stylist objects

### `GET /api/stylist/:id`
Fetches a single stylist (for view/edit modal).
**Query:** `idToken`
**Response `200`:** stylist object (same shape as list item, minus `appointmentCount`)
**Errors:** `404` not found

### `PUT /api/stylist/:id`
Updates a stylist's user info, bio/experience/status, and fully replaces their services and weekly shifts.

**Body:** same shape as `POST /api/stylist` minus `email`
**Response `200`:** `{ "success": true }`

### `DELETE /api/stylist/:id`
Removes a stylist.
**Query:** `idToken`
**Response `200`:** `{ "success": true }`
**Errors:** `409` if linked to existing appointments

---

## 7. Stylist Dashboard
Base path: `/api/stylist-dashboard`
**Auth:** stylist `idToken`

### `GET /api/stylist-dashboard/me`
Returns the logged-in stylist's own profile, salon info, services, and weekly shifts.
**Query:** `idToken`

### `PUT /api/stylist-dashboard/me`
Updates the stylist's own profile. `multipart/form-data`, field `photo` (single image).

**Form fields:** `idToken, name, phone, address, bio, yearsOfExperience, removePhoto? ("true"), photo?`
**Response `200`:** `{ "success": true }`

### `GET /api/stylist-dashboard/appointments`
Returns all appointments containing services assigned to this stylist, grouped by appointment.
**Query:** `idToken`

### `GET /api/stylist-dashboard/schedule`
Returns weekly shifts plus today's scheduled services.
**Query:** `idToken`

### `GET /api/stylist-dashboard/calendar`
Returns appointments for a given month, grouped by date.
**Query:** `idToken, month? (YYYY-MM, defaults to current month)`
**Response `200`:** `{ "month": "YYYY-MM", "appointmentsByDate": { "YYYY-MM-DD": [...] } }`

### `GET /api/stylist-dashboard/stats`
Returns today/upcoming/month/total appointment and revenue stats for the stylist.
**Query:** `idToken`
**Response `200`:** `{ "todayAppointments", "upcomingAppointments", "monthCompletedServices", "monthRevenueLkr", "totalCompletedServices" }`

---

## 8. Mobile (Consumer)
Base path: `/api/mobile`
Public browsing endpoints, plus authenticated booking/payment endpoints.

### `GET /api/mobile/salons` — Public
Search/list salons with filtering, sorting, and pagination.

**Query:** `q?, sortBy? (nearest|rating|newest), minRating?, lat?, lng?, radiusKm? (default 50), page? (default 1), limit? (default 20, max 50)`
**Response `200`:** `{ "salons": [...], "meta": { "total", "page", "limit", "totalPages" } }`

### `GET /api/mobile/salons/:salonId` — Public
Salon detail: hours, categories/services, stylists, rating, and up to 20 recent reviews.

### `POST /api/mobile/slots` — Public
Generates available time slots for a salon on a given date, based on business hours.

**Body:** `{ "salonId": "string", "date": "YYYY-MM-DD" }`
**Response `200`:** `{ "slotDuration": 15, "slots": [{ "startTime", "endTime", "disabled", "salonBusy" }] }`

### `POST /api/mobile/stylists/available` — Public
For a chosen date/start time and ordered list of services, returns the eligible stylists per service segment (checking shift hours and conflicts).

**Body**
```json
{ "salonId": "string", "date": "YYYY-MM-DD", "startTime": "HH:MM", "selectedServices": [{ "serviceId": "string", "sequence": 0 }] }
```
**Response `200`:** `{ "items": [{ "serviceId", "serviceName", "sequence", "serviceStartTime", "serviceEndTime", "stylists": [...] }] }`

### `GET /api/mobile/stylists/:stylistId/profile` — Public
Stylist's public profile: bio, experience, services, and aggregate rating.

### `POST /api/mobile/initiate-payment`
Validates a booking (services + stylist availability), creates a `PendingPayment` row, and returns a signed PayHere sandbox payment payload for the client to submit.

**Body**
```json
{
  "idToken": "string", "salonId": "string", "date": "YYYY-MM-DD", "startTime": "HH:MM",
  "serviceAssignments": [{ "serviceId": "string", "stylistId": "string", "sequence": 0 }]
}
```
**Response `200`:** `{ "pendingPaymentId": "string", "paymentData": { "...": "PayHere checkout fields incl. hash" } }`
**Errors:** `400` invalid/unavailable stylist or services, `404` user not found

### `GET /api/mobile/payment-status/:pendingPaymentId`
Polled by the client after checkout to check whether the PayHere webhook has confirmed payment yet.

**Response `200`:** `{ "status": "confirmed", "appointmentId": "string" }` | `{ "status": "failed" }` | `{ "status": "pending" }`

---

## 9. Appointments
Base path: `/api/appointment`

### `GET /api/appointment/list/:userSub`
Customer's own appointment history.
**Path:** `userSub` — Auth0 sub of the customer
**Response `200`:** array of appointments with nested service/stylist details

### `GET /api/appointment/salon`
Admin's view of all appointments for their salon.
**Query:** `idToken`
**Response `200`:** array of appointments with customer + service/stylist details

### `PATCH /api/appointment/:id/complete`
Admin marks an appointment as completed. Triggers loyalty points award (non-fatal on failure).

**Body:** `{ "idToken": "string" }`
**Response `200`:** `{ "ok": true, "appointment": { "id", "status" } }`
**Errors:** `403` not the salon's admin, `400` already cancelled

### `PATCH /api/appointment/:id/cancel`
Cancels an appointment. Allowed for either the salon admin or the customer who booked it.

**Body:** `{ "idToken": "string" }`
**Response `200`:** `{ "ok": true, "appointment": { "id", "status" } }`
**Errors:** `403` not allowed, `400` already completed

---

## 10. Payment
Base path: `/api/payment`

### `POST /api/payment/notify` — PayHere server-to-server webhook
Not called by the client. PayHere posts payment status here (`application/x-www-form-urlencoded`). Verifies the MD5 signature, then — on success (`status_code === "2"`) — re-checks stylist availability and creates the `Appointment` + `Payment` records inside a transaction, linking them to the `PendingPayment`. On failure, marks the pending payment as `failed`.

**Body (form-encoded):** `merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig` (+ other PayHere fields)
**Response:** raw HTTP status only (`200`, `400` bad signature, `404` unknown order, `500` error)

---

## 11. Reviews
Base path: `/api/review`

### `GET /api/review/check/:appointmentId`
Checks whether a given appointment has already been reviewed.
**Query:** `userSub`
**Response `200`:** `{ "reviewed": boolean, "review": {...}|null }`

### `POST /api/review/batch-check`
Bulk version of the above, for a list of appointment IDs.
**Body:** `{ "appointmentIds": ["string"] }`
**Response `200`:** `{ "reviewed": { "<appointmentId>": { "rating", "comment" } } }`

### `POST /api/review`
Submits a review for a completed appointment (once only). Updates the salon's average rating and awards loyalty points.

**Body:** `{ "userSub": "string", "appointmentId": "string", "rating": 1-5, "comment": "string?" }`
**Response `201`**
```json
{ "ok": true, "review": { "id", "rating", "comment" }, "loyalty": { "pointsAdded", "newTotal", "tierChanged", "newTierName" } | null }
```
**Errors:** `403` not your appointment, `400` not completed, `409` already reviewed

### `GET /api/review/salon`
Admin's view of all reviews for their salon.
**Query:** `idToken`
**Response `200`:** array of `{ "id", "customerName", "rating", "comment", "appointmentDate", "createdAt" }`

---

## 12. Loyalty (Admin)
Base path: `/api/loyalty`
**Auth:** admin `idToken`, resolved to the salon's loyalty program via `resolveProgram()`

### `GET /api/loyalty/stats`
**Query:** `idToken`
**Response `200`:** `{ "totalMembers", "activeMembers" (updated in last 90 days), "pointsIssued", "rewardsRedeemed" }`

### `GET /api/loyalty/rules`
**Query:** `idToken` → array of `LoyaltyRule`

### `PATCH /api/loyalty/rules/:id`
**Body:** `{ "idToken", "points" }` → updated `LoyaltyRule`

### `GET /api/loyalty/tiers`
**Query:** `idToken` → array of `LoyaltyTier`

### `PATCH /api/loyalty/tiers/:id`
**Body:** `{ "idToken", "threshold", "multiplier", "benefits" }` → updated `LoyaltyTier`

### `GET /api/loyalty/rewards`
**Query:** `idToken` → array of `{ "id", "name", "description", "pointsCost", "tierRequired", "active", "totalRedeemed" }`

### `POST /api/loyalty/rewards`
**Body:** `{ "idToken", "name", "description", "pointsCost", "tierRequired", "active?" }` → created reward

### `PATCH /api/loyalty/rewards/:id`
**Body:** `{ "idToken", "name?", "description?", "pointsCost?", "tierRequired?", "active?" }` (partial update) → updated reward

### `DELETE /api/loyalty/rewards/:id`
**Body:** `{ "idToken" }` → `{ "ok": true }`

---

## 13. Loyalty (Customer)
Base path: `/api/loyalty-customer`
**Auth:** customer `idToken`

### `GET /api/loyalty-customer/salons`
Lists salons the customer has visited, with their points balance and whether that salon has a loyalty program.
**Query:** `idToken`

### `GET /api/loyalty-customer/summary`
Full loyalty summary for a specific salon: points, current/next tier + progress, available rewards, points history, and rules.
**Query:** `idToken, salonId`
**Errors:** `403` no appointments at this salon

### `POST /api/loyalty-customer/redeem`
Redeems a reward: deducts points and creates a redemption record (transactional).

**Body:** `{ "idToken": "string", "rewardId": "string" }`
**Response `200`:** `{ "ok": true, "message", "pointsSpent", "newBalance" }`
**Errors:** `400` insufficient points or tier requirement not met, `404` reward not found

---

## 14. Inventory (Admin)
Base path: `/api/inventory`
**Auth:** admin `idToken`

### Categories
- `GET /api/inventory/categories?idToken=` → list categories (with item counts)
- `POST /api/inventory/categories` — body `{ idToken, name, description }` → created category
- `PUT /api/inventory/categories/:id` — body `{ idToken, name, description }` → updated category
- `DELETE /api/inventory/categories/:id?idToken=` → `{ "success": true }`

### Items
- `GET /api/inventory/items?idToken=` → list items (with category)
- `POST /api/inventory/items` — body `{ idToken, name, description, categoryId?, currentStock, minStock, unit, notes }` → created item
- `PUT /api/inventory/items/:id` — same body shape → updated item (auto-refreshes `lastRestocked` if stock increased)
- `DELETE /api/inventory/items/:id?idToken=` → `{ "success": true }`

All inventory endpoints return `404` if the category/item doesn't belong to the admin's salon.

---

## 15. Hair Profile
Base path: `/api/hair-profile`

### `GET /api/hair-profile/:userSub`
Fetches the customer's saved hair profile (face shape, hair type/length, style goal, etc.).
**Errors:** `400` no customer profile, `404` no hair profile saved yet

### `PUT /api/hair-profile/:userSub`
Upserts the customer's hair profile.

**Body:** `{ "faceShape?", "hairType?", "hairLength?", "styleGoal?", "previousServices?": [], "detectionMethod?" ("manual" default), "faceLandmarks?" }`
**Response `200`:** saved `UserHairProfile`

---

## 16. Face Photos
Base path: `/api/face-photos`

### `GET /api/face-photos/:userSub`
Returns the customer's stored face photos (front/left/right + any generated try-on images), plus their detected face shape.
**Errors:** `404` no photos saved yet

### `POST /api/face-photos/:userSub`
Upserts the customer's three face-scan photos. Resets `generatedPhotos` to empty.

**Body:** `{ "frontPhoto", "leftPhoto", "rightPhoto" }` (base64 or URLs)
**Response `200`:** saved `UserFacePhotos`

### `PATCH /api/face-photos/:userSub/generated`
Stores a generated virtual try-on result for a given style.

**Body:** `{ "styleId": "string", "views": {...} }` (front/left/right generated images)
**Response `200`:** `{ "ok": true }`

---

## 17. Hair Generate (AI)
Base path: `/api/hair-generate`

### `POST /api/hair-generate/generate-all`
Generates AI hairstyle try-on images for all three face angles using an external image-editing provider. Processes each photo (resize/normalize via `sharp`), uploads it, submits an AI edit request with a style-specific prompt, and polls until the result is ready.

**Body**
```json
{ "photos": { "front": "base64", "left": "base64", "right": "base64" }, "styleId": "string" }
```
Supported `styleId` values: `pixie, bob, lob, layers, male_slickback, male_swept, male_sidepart, male_voluminous` (unknown IDs fall back to a generic prompt).

**Response `200`:** `{ "front": "data:image/png;base64,...", "left": "...", "right": "..." }`
**Errors:** `400` missing photos, `500` upload/generation/timeout failure

> ⚠️ This endpoint can take 15–90+ seconds per call due to polling an external AI provider.

---

## 18. Recommendation (AI)
Mounted at `/recommendation` (**not** under `/api`)

### `POST /recommendation/style`
Forwards the customer's hair profile to the internal Python AI service (`AI_URL`, default `http://localhost:8000`) for style recommendations, then matches recommended style names to real `Service` records available in the system.

**Body:** `{ "faceShape", "hairType", "hairLength", "styleGoal", "previousServices?": [] }`
**Response `200`:** `{ "ai": {...raw AI service response...}, "matchedServices": [...], "servicesByStyle": { "<styleName>": [...] } }`

---

## 19. Trending Styles
Base path: `/api/trending-styles`

### `GET /api/trending-styles` — Public
Returns the 4 most recently created styles, each tagged `New`, `Trending`, or `Popular`.

**Response `200`:** `{ "styles": [{ "id", "name", "category", "description", "styleKey", "tag" }] }`

---

## 20. Health

### `GET /health` — Public
Simple liveness check.
**Response `200`:** `{ "ok": true }`

---

## Notes on Error Format
Almost all endpoints return errors as:
```json
{ "error": "human-readable message" }
```
with an appropriate HTTP status code (`400`, `401`, `403`, `404`, `409`, `500`).

## Notes on Roles
- **admin** — owns a salon; manages services, stylists, hours, inventory, loyalty program, and views salon appointments/reviews.
- **stylist** — manages their own profile, schedule, and views their assigned appointments.
- **customer** — books appointments, leaves reviews, uses hair profile/face scan/virtual try-on, and participates in loyalty programs.
