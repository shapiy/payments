/*
  Warnings:

  - Added the required column `type` to the `system_config` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConfigValueType" AS ENUM ('DECIMAL', 'STRING', 'BOOLEAN', 'INTEGER');

-- AlterTable
ALTER TABLE "system_config" ADD COLUMN     "type" "ConfigValueType" NOT NULL;
