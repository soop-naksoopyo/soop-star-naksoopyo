# SOOP Live Indicator (Cyan Ring & Dot) Design Spec

## Objective
Display real-time SOOP live broadcast status (`isLive`) on member avatars in the Calmmon Stars dashboard (`/calm`) using SOOP's signature cyan/sky-blue color (`#00C7FF`).

## Scope & Changes
1. **Data Model (`src/lib/calmmonData.ts`)**:
   - Add `isLive?: boolean` to `StreamerStatInput` and `CalmmonMemberRow`.
   - Propagate `isLive` from `statsMap` in `calculateCalmmonStats`.

2. **API Route (`src/app/api/calmmon/route.ts`)**:
   - Extract `isLive: Boolean(item.isLive)` from Trackify API batch items into `stats[soopId]`.

3. **Card Component (`src/components/calm/CalmmonCard.tsx`)**:
   - Wrap streamer profile avatar with a relative container.
   - When `isLive` is true:
     - Avatar gains `ring-2 ring-[#00c7ff] border-white`.
     - A cyan status dot (`w-2 h-2 rounded-full bg-[#00c7ff] ring-1.5 ring-white`) is displayed at the bottom-right corner.
   - Add a legend item for `방송 중 (ON)` in the bottom legend.

4. **Testing & Verification**:
   - Unit test in `src/test/calmmonData.test.ts` checking `isLive` property.
   - Production deployment verification with live screenshot inspection.
