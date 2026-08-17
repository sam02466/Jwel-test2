-- Adds real live-location tracking for the assigned delivery agent,
-- separate from the order's destination (Order.latitude/longitude,
-- which is now geocoded from the real address — see lib/geocode.ts —
-- instead of a random nearby coordinate).

ALTER TABLE "Order" ADD COLUMN "agentLatitude" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "agentLongitude" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "agentLocationUpdatedAt" TIMESTAMP(3);
