# System Architecture Diagrams

## 1. Complete Booking Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOOKING SYSTEM FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  User        │
│  Service     │
└──────┬───────┘
       │ POST /bookings
       │ {slotId, userId}
       │
       ▼
┌──────────────────────────────────┐
│  Booking Service                 │
│ - Create Booking (pending)       │
│ - Reserve Slot                   │
│ - Publish BOOKING_CREATED Event  │
└──────┬──────────────────────────┘
       │
       ├─────────────────────────┬──────────────────────────┐
       │                         │                          │
       ▼                         ▼                          ▼
   Response:            Database Update:         SQS Event:
   201 Created          Status: pending          BOOKING_CREATED
   (booking object)     Slot: booked   ────────→ Queue: request_queue
                                                 Consumer: Provider Service
                                                 Action: Notify Provider
       │
       │ (Wait for Provider Decision)
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  POST /accept                │  │  POST /reject                │
│  Provider Accepts Booking    │  │  Provider Rejects Booking    │
│                              │  │                              │
│ - Verify booking pending     │  │ - Verify booking pending     │
│ - Update status: confirmed   │  │ - Update status: rejected    │
│ - Publish BOOKING_CONFIRMED  │  │ - (No event published)       │
└──────┬─────────────────────┘  └──────────────────────────────┘
       │                                    │
       ▼                                    ▼
   Response:                           Response:
   200 OK                              200 OK
   Status: confirmed                   Status: rejected
       │
       ▼
   SQS Event:
   BOOKING_CONFIRMED
   Queue: confirmation_queue
   Consumer: User Notification Service
   Action: Send Confirmation Email/SMS
```

## 2. Database Schema Relationship Diagram

```
┌──────────────────┐
│     USERS        │
├──────────────────┤
│ id (PK)          │
│ name             │
│ email            │
│ created_at       │
└────────┬─────────┘
         │
         │ user_id
         │ (FK)
         │
         ▼
┌──────────────────────┐
│    BOOKINGS          │
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)      ──┼──→ USERS
│ provider_id (FK)  ──┼──→ PROVIDERS
│ slot_id (FK)      ──┼──→ AVAILABILITY
│ status               │  (pending/confirmed/rejected)
│ slot_start           │
│ slot_end             │
│ created_at           │
└──────────┬───────────┘
           │
           │ booking_id
           │ (FK)
           │
           ▼
┌──────────────────────────────┐
│  BOOKING_STATUS_HISTORY      │
│  (Optional Audit Trail)      │
├──────────────────────────────┤
│ id (PK)                      │
│ booking_id (FK)              │
│ old_status                   │
│ new_status                   │
│ changed_at                   │
│ changed_by                   │
│ reason                       │
└──────────────────────────────┘

┌──────────────────┐
│   PROVIDERS      │
├──────────────────┤
│ id (PK)          │
│ name             │
│ created_at       │
└────────┬─────────┘
         │
         │ provider_id
         │ (FK)
         │
         ▼
┌──────────────────────┐
│   AVAILABILITY       │
├──────────────────────┤
│ id (PK)              │
│ provider_id (FK)  ───┼──→ PROVIDERS
│ slot_start           │
│ slot_end             │
│ is_booked            │
│ created_at           │
└──────────────────────┘
```

## 3. Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       SQS EVENT ARCHITECTURE                             │
└──────────────────────────────────────────────────────────────────────────┘

USER SERVICE                    BOOKING SERVICE              PROVIDER SERVICE
        │                              │                            │
        ├──POST /bookings─────────────►│                            │
        │                              │                            │
        │                    ┌─── Create Booking ───┐               │
        │                    │ - Reserve Slot       │               │
        │                    │ - Set Status: pending│               │
        │                    └──────────────────────┘               │
        │                              │                            │
        │                     Publish Event:                        │
        │                              │                            │
        │                     ┌────────▼────────┐                  │
        │                     │ BOOKING_CREATED │                  │
        │                     │      EVENT      │                  │
        │                     └────────┬────────┘                  │
        │                              │                            │
        │                              └───SQS QUEUE 1────────────►│
        │                                                           │
        │                                              Process Event
        │                                         Notify Provider
        │                                              │
        │◄─────── Provider Accepts/Rejects ──────────┘
        │
        │ POST /providers/:id/bookings/:id/accept
        │
        ├──────────────────────────────────────────────►│
        │                                               │
        │                              ┌─── Update ───┐
        │                              │ Status →     │
        │                              │ confirmed    │
        │                              └──────────────┘
        │                                      │
        │                             Publish Event:
        │                                      │
        │                             ┌────────▼──────────┐
        │                             │ BOOKING_CONFIRMED │
        │                             │      EVENT        │
        │                             └────────┬──────────┘
        │                                      │
        │                        ─────SQS QUEUE 2────────
        │                       │                       │
        │◄──Process Event────────                       │
        │  Send Confirmation                            │
        │  Email/SMS                                    │
        │
        ▼
   Booking Confirmed
```

## 4. Service Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    SERVICE COMPONENTS                              │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Routes Layer   │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
   /bookings/POST     /providers/.../accept  /providers/.../reject
         │                  │                  │
         └────────┬─────────┴──────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Service Layer   │
         └────────┬────────┘
                  │
         ┌────────┼────────┐
         │        │        │
         ▼        ▼        ▼
    reserveSlot  accept   reject
         │        │        │
         └────────┼────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Repository Layer│
         └────────┬────────┘
                  │
         ┌────────┼────────────┐
         │        │            │
         ▼        ▼            ▼
      Database   findById   update
                            Status
         │
         ▼
    ┌────────────┐
    │ PostgreSQL │
    └────────────┘

            ┌──────────────┐
            │ SQS Layer    │
            └────────┬─────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   Request Queue          Confirmation Queue
   (BOOKING_CREATED)      (BOOKING_CONFIRMED)
```

## 5. Booking State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                    BOOKING STATE MACHINE                         │
└──────────────────────────────────────────────────────────────────┘

                      ┌──────────────┐
                      │   Created    │
                      │  (pending)   │
                      └──────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                │ User Creates Booking    │
                │ POST /bookings          │
                │ Event: BOOKING_CREATED  │
                │                         │
                ▼                         ▼
         ┌─────────────┐          ┌──────────────┐
         │             │          │  Awaiting    │
         │  Confirmed  │◄─────────│  Provider    │
         │             │          │  Decision    │
         └──────┬──────┘          └──────┬───────┘
                │                       │
                │ Event:        │ Accept/
                │ BOOKING_      │ Reject
                │ CONFIRMED     │
                │               │
                │               ▼
                │         ┌──────────────┐
                │         │   Rejected   │
                │         │              │
                │         └──────────────┘
                │
                ▼ (Future)
         ┌──────────────┐
         │  Cancelled   │
         │              │
         └──────────────┘

STATUS SUMMARY:
┌──────────────┬────────────────────────────────────┐
│   Status     │          Description               │
├──────────────┼────────────────────────────────────┤
│ pending      │ Waiting for provider response      │
│ confirmed    │ Provider accepted the booking      │
│ rejected     │ Provider rejected the booking      │
│ cancelled    │ User cancelled (future feature)    │
└──────────────┴────────────────────────────────────┘
```

## 6. API Request/Response Flow

```
CLIENT REQUEST                 SERVER SIDE                    ASYNC EVENTS
    │                              │                              │
    ├─POST /bookings──────────────►│                              │
    │  {slotId, userId}            │                              │
    │                              │◄─ Validate ─────────────────┤
    │                              │◄─ Database ────────────────┤
    │                              │◄─ Transaction ─────────────┤
    │                    ┌─────────┘                             │
    │                    │ Create Booking                        │
    │                    │ Status: pending                       │
    │                    │ Slot: booked                          │
    │                    └─────────┬──────────────────────────┐  │
    │                              │                         │  │
    │◄─201 Created────────────────┤                         │  │
    │  {booking object}            │            ┌───────────▼──▼─────┐
    │                              │            │ Async SQS Publish │
    │                              │            │ BOOKING_CREATED  │
    │                              │            └──────────────────┘
    │                              │                         │
    │                              │                         ▼
    │                              │            ┌────────────────────┐
    │                              │            │ SQS Queue 1 Ready  │
    │                              │            │ For Consumption    │
    │                              │            └────────────────────┘
    │
    ├─POST /providers/.../accept──►│
    │  {providerId, bookingId}      │
    │                              │◄─ Verify provider owner ─────┤
    │                              │◄─ Check status = pending ─────┤
    │                              │◄─ Update to confirmed ────────┤
    │                    ┌─────────┘                             │
    │                    │ Status: confirmed                     │
    │                    └─────────┬──────────────────────────┐  │
    │                              │                         │  │
    │◄─200 OK───────────────────────┤                        │  │
    │  {booking object}              │            ┌───────────▼──▼──┐
    │                              │            │ Async SQS Pub   │
    │                              │            │ BOOKING_       │
    │                              │            │ CONFIRMED      │
    │                              │            └────────────────┘
    │                              │                         │
    │                              │                         ▼
    │                              │            ┌────────────────────┐
    │                              │            │ SQS Queue 2 Ready  │
    │                              │            │ For Consumption    │
    │                              │            └────────────────────┘
```

## 7. Component Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT DEPENDENCIES                        │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │   Express    │
                        │   App        │
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
            ┌─────────────────┐  ┌─────────────────┐
            │ Booking Routes  │  │ Provider Routes │
            └────────┬────────┘  └────────┬────────┘
                     │                    │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │  Booking Service     │
                     │  Provider Service    │
                     └──────────┬───────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │ Booking      │ │ Provider │ │ SQS      │
            │ Repository   │ │ Repo     │ │ Client   │
            └──────┬───────┘ └──────────┘ └────┬─────┘
                   │                           │
                   └──────────┬────────────────┘
                              │
                    ┌─────────┴──────────┬──────────┐
                    │                    │          │
                    ▼                    ▼          ▼
                ┌────────────┐    ┌──────────┐  ┌──────────┐
                │ PostgreSQL │    │   AWS    │  │  Node    │
                │   Client   │    │ SDK v3   │  │  Crypto  │
                └────────────┘    └──────────┘  └──────────┘

DEPENDENCY FLOW:
Routes → Services → Repositories & External Clients
         → Database & SQS
```

---

## Key Points from Diagrams

1. **Booking Flow**: User → Create → Pending → Accept/Reject → Confirmed/Rejected
2. **Events**: Async events published to SQS, non-blocking
3. **Database**: Transactional integrity with row-level locking
4. **Services**: Clear separation between routes, services, and repositories
5. **States**: Well-defined state machine for bookings
6. **Requests**: API calls are synchronous, event publishing is asynchronous

All diagrams use ASCII art for easy viewing in any text editor or terminal.
