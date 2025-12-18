-- CreateTable
CREATE TABLE "scada_stations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "type" VARCHAR(50) NOT NULL,
    "voltage" VARCHAR(20) NOT NULL,
    "capacity" DECIMAL(10,2),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "address" TEXT,
    "commission_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'online',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_devices" (
    "id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "manufacturer" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_no" VARCHAR(100),
    "rated_capacity" DECIMAL(10,2),
    "rated_voltage" DECIMAL(10,2),
    "rated_current" DECIMAL(10,2),
    "install_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_reading_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_data_points" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "data_type" VARCHAR(20) NOT NULL,
    "min_value" DECIMAL(15,4),
    "max_value" DECIMAL(15,4),
    "warning_low" DECIMAL(15,4),
    "warning_high" DECIMAL(15,4),
    "alarm_low" DECIMAL(15,4),
    "alarm_high" DECIMAL(15,4),
    "scale_factor" DECIMAL(10,6) NOT NULL DEFAULT 1,
    "modbus_address" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_data_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_readings" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "data_point_id" UUID NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "quality" VARCHAR(20) NOT NULL DEFAULT 'good',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scada_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_readings_hourly" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "data_point_id" UUID NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "min_value" DECIMAL(15,4) NOT NULL,
    "max_value" DECIMAL(15,4) NOT NULL,
    "avg_value" DECIMAL(15,4) NOT NULL,
    "sum_value" DECIMAL(15,4),
    "reading_count" INTEGER NOT NULL,

    CONSTRAINT "scada_readings_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_readings_daily" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "data_point_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "min_value" DECIMAL(15,4) NOT NULL,
    "max_value" DECIMAL(15,4) NOT NULL,
    "avg_value" DECIMAL(15,4) NOT NULL,
    "sum_value" DECIMAL(15,4),
    "reading_count" INTEGER NOT NULL,

    CONSTRAINT "scada_readings_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_alarm_rules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "data_point_id" UUID,
    "device_id" UUID,
    "station_id" UUID,
    "condition" VARCHAR(20) NOT NULL,
    "threshold1" DECIMAL(15,4) NOT NULL,
    "threshold2" DECIMAL(15,4),
    "severity" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_alarm_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_alarms" (
    "id" UUID NOT NULL,
    "alarm_no" VARCHAR(50) NOT NULL,
    "rule_id" UUID,
    "station_id" UUID NOT NULL,
    "device_id" UUID,
    "data_point_id" UUID,
    "severity" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "value" DECIMAL(15,4),
    "threshold" DECIMAL(15,4),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMP(3),
    "cleared_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "scada_alarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_commands" (
    "id" UUID NOT NULL,
    "command_no" VARCHAR(50) NOT NULL,
    "device_id" UUID NOT NULL,
    "command_type" VARCHAR(30) NOT NULL,
    "target_value" VARCHAR(100),
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "response" TEXT,

    CONSTRAINT "scada_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_connections" (
    "id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "protocol" VARCHAR(30) NOT NULL,
    "ip_address" VARCHAR(50),
    "port" INTEGER,
    "slave_id" INTEGER,
    "com_port" VARCHAR(20),
    "baud_rate" INTEGER,
    "poll_interval" INTEGER NOT NULL DEFAULT 5,
    "timeout" INTEGER NOT NULL DEFAULT 3000,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_connect_at" TIMESTAMP(3),
    "connection_status" VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_event_logs" (
    "id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "user_id" UUID,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scada_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scada_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scada_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scada_stations_code_key" ON "scada_stations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scada_devices_code_key" ON "scada_devices"("code");

-- CreateIndex
CREATE INDEX "scada_devices_station_id_idx" ON "scada_devices"("station_id");

-- CreateIndex
CREATE INDEX "scada_data_points_device_id_idx" ON "scada_data_points"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "scada_data_points_device_id_code_key" ON "scada_data_points"("device_id", "code");

-- CreateIndex
CREATE INDEX "scada_readings_device_id_timestamp_idx" ON "scada_readings"("device_id", "timestamp");

-- CreateIndex
CREATE INDEX "scada_readings_data_point_id_timestamp_idx" ON "scada_readings"("data_point_id", "timestamp");

-- CreateIndex
CREATE INDEX "scada_readings_hourly_device_id_hour_idx" ON "scada_readings_hourly"("device_id", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "scada_readings_hourly_data_point_id_hour_key" ON "scada_readings_hourly"("data_point_id", "hour");

-- CreateIndex
CREATE INDEX "scada_readings_daily_device_id_date_idx" ON "scada_readings_daily"("device_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "scada_readings_daily_data_point_id_date_key" ON "scada_readings_daily"("data_point_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "scada_alarms_alarm_no_key" ON "scada_alarms"("alarm_no");

-- CreateIndex
CREATE INDEX "scada_alarms_station_id_status_idx" ON "scada_alarms"("station_id", "status");

-- CreateIndex
CREATE INDEX "scada_alarms_triggered_at_idx" ON "scada_alarms"("triggered_at");

-- CreateIndex
CREATE INDEX "scada_alarms_severity_status_idx" ON "scada_alarms"("severity", "status");

-- CreateIndex
CREATE UNIQUE INDEX "scada_commands_command_no_key" ON "scada_commands"("command_no");

-- CreateIndex
CREATE INDEX "scada_commands_device_id_idx" ON "scada_commands"("device_id");

-- CreateIndex
CREATE INDEX "scada_commands_status_idx" ON "scada_commands"("status");

-- CreateIndex
CREATE INDEX "scada_commands_requested_at_idx" ON "scada_commands"("requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "scada_connections_station_id_key" ON "scada_connections"("station_id");

-- CreateIndex
CREATE INDEX "scada_event_logs_event_type_created_at_idx" ON "scada_event_logs"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "scada_event_logs_entity_type_entity_id_idx" ON "scada_event_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "scada_settings_key_key" ON "scada_settings"("key");

-- AddForeignKey
ALTER TABLE "scada_devices" ADD CONSTRAINT "scada_devices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_data_points" ADD CONSTRAINT "scada_data_points_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_readings" ADD CONSTRAINT "scada_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_readings" ADD CONSTRAINT "scada_readings_data_point_id_fkey" FOREIGN KEY ("data_point_id") REFERENCES "scada_data_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "scada_alarm_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_alarms" ADD CONSTRAINT "scada_alarms_data_point_id_fkey" FOREIGN KEY ("data_point_id") REFERENCES "scada_data_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_commands" ADD CONSTRAINT "scada_commands_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scada_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scada_connections" ADD CONSTRAINT "scada_connections_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "scada_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
