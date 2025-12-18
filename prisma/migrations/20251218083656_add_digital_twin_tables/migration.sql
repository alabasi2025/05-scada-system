-- CreateTable
CREATE TABLE "geo_locations" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "altitude" DECIMAL(8,2),
    "accuracy_meters" DECIMAL(6,2),
    "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "address_text" TEXT,
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "location_type" VARCHAR(50),
    "notes" TEXT,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_nodes" (
    "id" UUID NOT NULL,
    "station_id" UUID,
    "node_code" VARCHAR(30) NOT NULL,
    "node_name" VARCHAR(100),
    "node_type" VARCHAR(30) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "altitude" DECIMAL(8,2),
    "owner" VARCHAR(50),
    "installation_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "properties" JSONB DEFAULT '{}',
    "last_inspection_date" DATE,
    "condition" VARCHAR(20),
    "asset_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_components" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "component_code" VARCHAR(30),
    "component_type" VARCHAR(50) NOT NULL,
    "manufacturer" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(50),
    "installation_date" DATE,
    "condition" VARCHAR(20) NOT NULL DEFAULT 'good',
    "last_inspection_date" DATE,
    "unit_cost" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_segments" (
    "id" UUID NOT NULL,
    "station_id" UUID,
    "segment_code" VARCHAR(30) NOT NULL,
    "from_node_id" UUID NOT NULL,
    "to_node_id" UUID NOT NULL,
    "cable_type" VARCHAR(50) NOT NULL,
    "cable_size_mm2" DECIMAL(6,2),
    "cable_material" VARCHAR(30),
    "length_meters" DECIMAL(10,2),
    "calculated_length" DECIMAL(10,2),
    "voltage_level" VARCHAR(20),
    "max_current_amps" DECIMAL(8,2),
    "resistance_per_km" DECIMAL(8,4),
    "installation_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "condition" VARCHAR(20) NOT NULL DEFAULT 'good',
    "cost_per_meter" DECIMAL(10,2),
    "asset_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "geo_locations_latitude_longitude_idx" ON "geo_locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "geo_locations_entity_type_entity_id_idx" ON "geo_locations"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "geo_locations_entity_type_entity_id_location_type_key" ON "geo_locations"("entity_type", "entity_id", "location_type");

-- CreateIndex
CREATE UNIQUE INDEX "network_nodes_node_code_key" ON "network_nodes"("node_code");

-- CreateIndex
CREATE INDEX "network_nodes_node_type_idx" ON "network_nodes"("node_type");

-- CreateIndex
CREATE INDEX "network_nodes_station_id_idx" ON "network_nodes"("station_id");

-- CreateIndex
CREATE INDEX "network_nodes_latitude_longitude_idx" ON "network_nodes"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "network_segments_segment_code_key" ON "network_segments"("segment_code");

-- AddForeignKey
ALTER TABLE "node_components" ADD CONSTRAINT "node_components_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "network_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_segments" ADD CONSTRAINT "network_segments_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "network_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_segments" ADD CONSTRAINT "network_segments_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "network_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
