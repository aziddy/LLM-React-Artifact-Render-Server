-- CreateTable
CREATE TABLE "artifacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "code" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_at" TEXT NOT NULL DEFAULT 'datetime(''now'')',
    "updated_at" TEXT NOT NULL DEFAULT 'datetime(''now'')',
    "live_version" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "parent_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT 'datetime(''now'')',
    "updated_at" TEXT NOT NULL DEFAULT 'datetime(''now'')',
    CONSTRAINT "tags_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tags" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "artifact_tags" (
    "artifact_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("artifact_id", "tag_id"),
    CONSTRAINT "artifact_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "artifact_tags_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "artifact_versions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artifact_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "code" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT 'datetime(''now'')',
    CONSTRAINT "artifact_versions_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_artifacts_1" ON "artifacts"("slug");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_artifacts_created_at" ON "artifacts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_artifacts_visibility" ON "artifacts"("visibility");

-- CreateIndex
CREATE INDEX "idx_artifacts_slug" ON "artifacts"("slug");

-- CreateIndex
CREATE INDEX "idx_tags_sort_order" ON "tags"("sort_order");

-- CreateIndex
CREATE INDEX "idx_tags_parent_id" ON "tags"("parent_id");

-- CreateIndex
CREATE INDEX "idx_artifact_tags_tag_id" ON "artifact_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_artifact_versions_lookup" ON "artifact_versions"("artifact_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_artifact_versions_artifact_id" ON "artifact_versions"("artifact_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_artifact_versions_1" ON "artifact_versions"("artifact_id", "version_number");
Pragma writable_schema=0;

