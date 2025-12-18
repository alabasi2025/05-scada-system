/*
  Warnings:

  - You are about to drop the column `rule_id` on the `scada_alarms` table. All the data in the column will be lost.
  - Made the column `device_id` on table `scada_alarms` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_device_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_rule_id_fkey";

-- AlterTable
ALTER TABLE "scada_alarms" DROP COLUMN "rule_id",
ADD COLUMN     "alarm_rule_id" UUID,
ALTER COLUMN "alarm_no" DROP NOT NULL,
ALTER COLUMN "station_id" DROP NOT NULL,
ALTER COLUMN "device_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "scada_notifications" (
    "id" UUID NOT NULL,
    "alarm_id" UUID,
    "user_id" UUID,
    "type" VARCHAR(30) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scada_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scada_notifications_user_id_is_read_idx" ON "scada_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "scada_notifications_sent_at_idx" ON "scada_notifications"("sent_at");

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_alarm_rule_id_fkey" FOREIGN KEY ("alarm_rule_id") REFERENCES "scada_alarm_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
