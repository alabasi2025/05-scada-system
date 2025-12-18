/*
  Warnings:

  - You are about to drop the column `install_date` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `last_reading_at` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `rated_capacity` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `rated_current` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `rated_voltage` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `serial_no` on the `scada_devices` table. All the data in the column will be lost.
  - You are about to drop the column `commission_date` on the `scada_stations` table. All the data in the column will be lost.
  - You are about to drop the column `voltage` on the `scada_stations` table. All the data in the column will be lost.
  - You are about to alter the column `code` on the `scada_stations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to alter the column `address` on the `scada_stations` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to drop the `scada_alarm_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_alarms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_commands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_connections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_data_points` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_event_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_readings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_readings_daily` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_readings_hourly` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scada_settings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `protocol` to the `scada_devices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_alarm_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_data_point_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_device_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_alarms" DROP CONSTRAINT "scada_alarms_station_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_commands" DROP CONSTRAINT "scada_commands_device_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_connections" DROP CONSTRAINT "scada_connections_station_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_data_points" DROP CONSTRAINT "scada_data_points_device_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_devices" DROP CONSTRAINT "scada_devices_station_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_readings" DROP CONSTRAINT "scada_readings_data_point_id_fkey";

-- DropForeignKey
ALTER TABLE "scada_readings" DROP CONSTRAINT "scada_readings_device_id_fkey";

-- DropIndex
DROP INDEX "scada_devices_station_id_idx";

-- AlterTable
ALTER TABLE "scada_devices" DROP COLUMN "install_date",
DROP COLUMN "last_reading_at",
DROP COLUMN "rated_capacity",
DROP COLUMN "rated_current",
DROP COLUMN "rated_voltage",
DROP COLUMN "serial_no",
ADD COLUMN     "ip_address" VARCHAR(50),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_read_at" TIMESTAMP(3),
ADD COLUMN     "name_en" VARCHAR(200),
ADD COLUMN     "port" INTEGER,
ADD COLUMN     "protocol" VARCHAR(50) NOT NULL,
ADD COLUMN     "serial_number" VARCHAR(100),
ADD COLUMN     "slave_id" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'online';

-- AlterTable
ALTER TABLE "scada_stations" DROP COLUMN "commission_date",
DROP COLUMN "voltage",
ADD COLUMN     "business_id" UUID,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "voltage_level" VARCHAR(20),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "capacity" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(500);

-- DropTable
DROP TABLE "scada_alarm_rules";

-- DropTable
DROP TABLE "scada_alarms";

-- DropTable
DROP TABLE "scada_commands";

-- DropTable
DROP TABLE "scada_connections";

-- DropTable
DROP TABLE "scada_data_points";

-- DropTable
DROP TABLE "scada_event_logs";

-- DropTable
DROP TABLE "scada_notifications";

-- DropTable
DROP TABLE "scada_readings";

-- DropTable
DROP TABLE "scada_readings_daily";

-- DropTable
DROP TABLE "scada_readings_hourly";

-- DropTable
DROP TABLE "scada_settings";

-- CreateTable
CREATE TABLE "monitoring_points" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "device_id" UUID,
    "point_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "point_type" VARCHAR(20) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(20),
    "source_type" VARCHAR(50),
    "source_id" UUID,
    "min_value" DECIMAL(15,4),
    "max_value" DECIMAL(15,4),
    "warning_low" DECIMAL(15,4),
    "warning_high" DECIMAL(15,4),
    "alarm_low" DECIMAL(15,4),
    "alarm_high" DECIMAL(15,4),
    "modbus_address" VARCHAR(50),
    "scale_factor" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "scan_interval" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_readings" (
    "id" UUID NOT NULL,
    "point_id" UUID NOT NULL,
    "reading_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(15,4) NOT NULL,
    "quality" VARCHAR(20) NOT NULL DEFAULT 'good',
    "status" VARCHAR(20) NOT NULL DEFAULT 'normal',

    CONSTRAINT "live_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings_history" (
    "id" UUID NOT NULL,
    "point_id" UUID NOT NULL,
    "reading_time" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "quality" VARCHAR(20) NOT NULL DEFAULT 'good',
    "aggregation_type" VARCHAR(20) NOT NULL DEFAULT 'raw',

    CONSTRAINT "readings_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "point_id" UUID,
    "alert_code" VARCHAR(50) NOT NULL,
    "alert_type" VARCHAR(20) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "source_type" VARCHAR(50),
    "source_id" UUID,
    "value" DECIMAL(15,4),
    "threshold" DECIMAL(15,4),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "work_order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "rule_type" VARCHAR(50) NOT NULL,
    "condition" JSONB NOT NULL DEFAULT '{}',
    "alert_type" VARCHAR(20) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "message_template" TEXT,
    "notification_channels" JSONB NOT NULL DEFAULT '[]',
    "escalation_rules" JSONB,
    "auto_create_work_order" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_commands" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "device_id" UUID,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "command_type" VARCHAR(50) NOT NULL,
    "command_value" VARCHAR(255),
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "issued_by" UUID NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),
    "result" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_summary" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "summary_date" DATE NOT NULL,
    "summary_type" VARCHAR(20) NOT NULL,
    "total_generation" DECIMAL(15,4),
    "diesel_generation" DECIMAL(15,4),
    "solar_generation" DECIMAL(15,4),
    "total_consumption" DECIMAL(15,4),
    "grid_losses" DECIMAL(15,4),
    "loss_percentage" DECIMAL(5,2),
    "peak_demand" DECIMAL(15,4),
    "peak_time" TIME,
    "min_demand" DECIMAL(15,4),
    "average_demand" DECIMAL(15,4),
    "power_factor" DECIMAL(4,3),
    "fuel_consumed" DECIMAL(15,4),
    "fuel_efficiency" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_analysis" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "analysis_date" DATE NOT NULL,
    "analysis_type" VARCHAR(50) NOT NULL,
    "group_key" VARCHAR(255) NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "consumption" DECIMAL(15,4) NOT NULL,
    "percentage" DECIMAL(5,2),
    "customer_count" INTEGER,
    "average_per_customer" DECIMAL(15,4),
    "comparison_previous" DECIMAL(15,4),
    "growth_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecast" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "forecast_date" DATE NOT NULL,
    "forecast_hour" INTEGER NOT NULL,
    "predicted_demand" DECIMAL(15,4) NOT NULL,
    "confidence_level" DECIMAL(5,2),
    "model_used" VARCHAR(100),
    "actual_demand" DECIMAL(15,4),
    "accuracy" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_metrics" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "metric_date" DATE NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "average_value" DECIMAL(15,4),
    "min_value" DECIMAL(15,4),
    "max_value" DECIMAL(15,4),
    "violations_count" INTEGER,
    "compliance_rate" DECIMAL(5,2),
    "standard_reference" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reliability_metrics" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "saifi" DECIMAL(10,4),
    "saidi" DECIMAL(10,4),
    "caidi" DECIMAL(10,4),
    "asai" DECIMAL(10,6),
    "total_outages" INTEGER,
    "planned_outages" INTEGER,
    "unplanned_outages" INTEGER,
    "total_duration_minutes" INTEGER,
    "customers_affected" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reliability_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "incident_number" VARCHAR(20) NOT NULL,
    "incident_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "detected_at" TIMESTAMP(3),
    "reported_by" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "root_cause" TEXT,
    "corrective_actions" TEXT,
    "preventive_actions" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_inspections" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "inspection_number" VARCHAR(20) NOT NULL,
    "inspection_type" VARCHAR(50) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "performed_date" DATE,
    "inspector_id" UUID,
    "checklist_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "overall_result" VARCHAR(20),
    "findings_count" INTEGER,
    "critical_findings" INTEGER,
    "report" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_points" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "point_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "point_type" VARCHAR(20) NOT NULL,
    "location" VARCHAR(255),
    "access_method" VARCHAR(20) NOT NULL,
    "is_monitored" BOOLEAN NOT NULL DEFAULT true,
    "camera_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log" (
    "id" UUID NOT NULL,
    "access_point_id" UUID NOT NULL,
    "user_id" UUID,
    "access_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_type" VARCHAR(10) NOT NULL,
    "access_method" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "card_number" VARCHAR(50),
    "notes" TEXT,

    CONSTRAINT "access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "camera_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255),
    "camera_type" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(50),
    "stream_url" VARCHAR(500),
    "recording_enabled" BOOLEAN NOT NULL DEFAULT true,
    "motion_detection" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'online',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "source_type" VARCHAR(50),
    "source_id" UUID,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "video_clip" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrated_devices" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID NOT NULL,
    "device_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "device_type" VARCHAR(50) NOT NULL,
    "manufacturer" VARCHAR(255),
    "model" VARCHAR(255),
    "serial_number" VARCHAR(100),
    "ip_address" VARCHAR(50),
    "port" INTEGER,
    "protocol" VARCHAR(50) NOT NULL,
    "connection_params" JSONB,
    "polling_interval" INTEGER NOT NULL DEFAULT 60,
    "last_communication" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'offline',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrated_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_communication_log" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "communication_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" VARCHAR(10) NOT NULL,
    "message_type" VARCHAR(100),
    "request" TEXT,
    "response" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "duration_ms" INTEGER,

    CONSTRAINT "device_communication_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_tasks" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "task_name" VARCHAR(255) NOT NULL,
    "task_type" VARCHAR(50) NOT NULL,
    "source_system" VARCHAR(100),
    "target_system" VARCHAR(100),
    "schedule" VARCHAR(100),
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_result" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meter_control_log" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "customer_id" UUID,
    "meter_id" UUID NOT NULL,
    "action_type" VARCHAR(20) NOT NULL,
    "trigger_type" VARCHAR(50) NOT NULL,
    "invoice_id" UUID,
    "payment_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "acrel_response" JSONB,
    "executed_at" TIMESTAMP(3),
    "executed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_control_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB DEFAULT '{}',
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_points_station_id_point_code_key" ON "monitoring_points"("station_id", "point_code");

-- CreateIndex
CREATE INDEX "live_readings_point_id_reading_time_idx" ON "live_readings"("point_id", "reading_time");

-- CreateIndex
CREATE INDEX "readings_history_point_id_reading_time_idx" ON "readings_history"("point_id", "reading_time");

-- CreateIndex
CREATE INDEX "readings_history_aggregation_type_reading_time_idx" ON "readings_history"("aggregation_type", "reading_time");

-- CreateIndex
CREATE INDEX "alerts_station_id_idx" ON "alerts"("station_id");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "control_commands_station_id_idx" ON "control_commands"("station_id");

-- CreateIndex
CREATE INDEX "control_commands_status_idx" ON "control_commands"("status");

-- CreateIndex
CREATE INDEX "energy_summary_summary_date_idx" ON "energy_summary"("summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "energy_summary_station_id_summary_date_summary_type_key" ON "energy_summary"("station_id", "summary_date", "summary_type");

-- CreateIndex
CREATE INDEX "consumption_analysis_analysis_date_idx" ON "consumption_analysis"("analysis_date");

-- CreateIndex
CREATE INDEX "demand_forecast_forecast_date_idx" ON "demand_forecast"("forecast_date");

-- CreateIndex
CREATE INDEX "quality_metrics_metric_date_idx" ON "quality_metrics"("metric_date");

-- CreateIndex
CREATE INDEX "reliability_metrics_period_start_period_end_idx" ON "reliability_metrics"("period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_incident_number_key" ON "incidents"("incident_number");

-- CreateIndex
CREATE INDEX "incidents_incident_type_idx" ON "incidents"("incident_type");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "safety_inspections_inspection_number_key" ON "safety_inspections"("inspection_number");

-- CreateIndex
CREATE INDEX "safety_inspections_scheduled_date_idx" ON "safety_inspections"("scheduled_date");

-- CreateIndex
CREATE INDEX "safety_inspections_status_idx" ON "safety_inspections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "access_points_station_id_point_code_key" ON "access_points"("station_id", "point_code");

-- CreateIndex
CREATE INDEX "access_log_access_time_idx" ON "access_log"("access_time");

-- CreateIndex
CREATE UNIQUE INDEX "cameras_station_id_camera_code_key" ON "cameras"("station_id", "camera_code");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_status_idx" ON "security_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "integrated_devices_device_code_key" ON "integrated_devices"("device_code");

-- CreateIndex
CREATE INDEX "device_communication_log_communication_time_idx" ON "device_communication_log"("communication_time");

-- CreateIndex
CREATE INDEX "meter_control_log_meter_id_idx" ON "meter_control_log"("meter_id");

-- CreateIndex
CREATE INDEX "meter_control_log_action_type_idx" ON "meter_control_log"("action_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "event_logs_event_type_idx" ON "event_logs"("event_type");

-- CreateIndex
CREATE INDEX "event_logs_entity_type_entity_id_idx" ON "event_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "event_logs_created_at_idx" ON "event_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- AddForeignKey
ALTER TABLE "scada_devices" ADD CONSTRAINT "scada_devices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_points" ADD CONSTRAINT "monitoring_points_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_points" ADD CONSTRAINT "monitoring_points_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_readings" ADD CONSTRAINT "live_readings_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "monitoring_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings_history" ADD CONSTRAINT "readings_history_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "monitoring_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "monitoring_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_commands" ADD CONSTRAINT "control_commands_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_commands" ADD CONSTRAINT "control_commands_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_summary" ADD CONSTRAINT "energy_summary_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_metrics" ADD CONSTRAINT "quality_metrics_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reliability_metrics" ADD CONSTRAINT "reliability_metrics_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_points" ADD CONSTRAINT "access_points_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_access_point_id_fkey" FOREIGN KEY ("access_point_id") REFERENCES "access_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrated_devices" ADD CONSTRAINT "integrated_devices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_communication_log" ADD CONSTRAINT "device_communication_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "integrated_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
