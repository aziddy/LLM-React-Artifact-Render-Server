import { prisma } from "./db";
import type { ArtifactVersion as PrismaVersion } from "@/generated/prisma/client";

export interface ArtifactVersion {
  id: number;
  artifact_id: number;
  version_number: number;
  title: string;
  description: string;
  code: string;
  created_at: string;
}

export type ArtifactVersionListItem = Omit<ArtifactVersion, "code">;

function toVersion(p: PrismaVersion): ArtifactVersion {
  return {
    id: p.id,
    artifact_id: p.artifactId,
    version_number: p.versionNumber,
    title: p.title,
    description: p.description ?? "",
    code: p.code,
    created_at: p.createdAt,
  };
}

function toVersionListItem(p: {
  id: number;
  artifactId: number;
  versionNumber: number;
  title: string;
  description: string | null;
  createdAt: string;
}): ArtifactVersionListItem {
  return {
    id: p.id,
    artifact_id: p.artifactId,
    version_number: p.versionNumber,
    title: p.title,
    description: p.description ?? "",
    created_at: p.createdAt,
  };
}

export async function getVersionsForArtifact(
  artifactId: number
): Promise<ArtifactVersionListItem[]> {
  const rows = await prisma.artifactVersion.findMany({
    where: { artifactId },
    select: {
      id: true,
      artifactId: true,
      versionNumber: true,
      title: true,
      description: true,
      createdAt: true,
    },
    orderBy: { versionNumber: "desc" },
  });
  return rows.map(toVersionListItem);
}

export async function getVersion(
  artifactId: number,
  versionNumber: number
): Promise<ArtifactVersion | undefined> {
  const row = await prisma.artifactVersion.findUnique({
    where: { artifactId_versionNumber: { artifactId, versionNumber } },
  });
  return row ? toVersion(row) : undefined;
}

export async function getVersionById(
  id: number
): Promise<ArtifactVersion | undefined> {
  const row = await prisma.artifactVersion.findUnique({ where: { id } });
  return row ? toVersion(row) : undefined;
}

export async function createVersion(
  artifactId: number,
  title: string,
  description: string,
  code: string
): Promise<ArtifactVersion> {
  const maxResult = await prisma.artifactVersion.aggregate({
    where: { artifactId },
    _max: { versionNumber: true },
  });
  const nextVersion = (maxResult._max.versionNumber ?? 0) + 1;

  const row = await prisma.artifactVersion.create({
    data: { artifactId, versionNumber: nextVersion, title, description, code },
  });
  return toVersion(row);
}

export async function updateVersion(
  artifactId: number,
  versionNumber: number,
  input: { title?: string; description?: string; code?: string }
): Promise<ArtifactVersion | undefined> {
  const version = await prisma.artifactVersion.findUnique({
    where: { artifactId_versionNumber: { artifactId, versionNumber } },
  });
  if (!version) return undefined;

  const data: { title?: string; description?: string; code?: string } = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.code !== undefined) data.code = input.code;

  if (Object.keys(data).length === 0) return toVersion(version);

  const updated = await prisma.$transaction(async (tx) => {
    const ver = await tx.artifactVersion.update({
      where: { artifactId_versionNumber: { artifactId, versionNumber } },
      data,
    });

    // Auto-sync to artifacts table if this is the live version
    const artifact = await tx.artifact.findUnique({
      where: { id: artifactId },
      select: { liveVersion: true },
    });

    if (artifact && artifact.liveVersion === versionNumber) {
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      await tx.artifact.update({
        where: { id: artifactId },
        data: {
          title: ver.title,
          description: ver.description,
          code: ver.code,
          updatedAt: now,
        },
      });
    }

    return ver;
  });

  return toVersion(updated);
}

export async function setLiveVersion(
  artifactId: number,
  versionNumber: number
): Promise<boolean> {
  const version = await prisma.artifactVersion.findUnique({
    where: { artifactId_versionNumber: { artifactId, versionNumber } },
  });
  if (!version) return false;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  await prisma.artifact.update({
    where: { id: artifactId },
    data: {
      title: version.title,
      description: version.description,
      code: version.code,
      liveVersion: versionNumber,
      updatedAt: now,
    },
  });

  return true;
}
