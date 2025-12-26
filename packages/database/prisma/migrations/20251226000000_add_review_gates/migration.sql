-- Add review gate status values to BuildStatus enum
ALTER TYPE "BuildStatus" ADD VALUE IF NOT EXISTS 'AWAITING_DESIGN_REVIEW';
ALTER TYPE "BuildStatus" ADD VALUE IF NOT EXISTS 'AWAITING_FEATURE_REVIEW';

-- Add review gate fields to builds table
ALTER TABLE "builds" ADD COLUMN IF NOT EXISTS "reviewGatesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "builds" ADD COLUMN IF NOT EXISTS "designApprovedAt" TIMESTAMP(3);
ALTER TABLE "builds" ADD COLUMN IF NOT EXISTS "featuresApprovedAt" TIMESTAMP(3);

