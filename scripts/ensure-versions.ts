import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Find artifacts with no versions
  const missing = await prisma.artifact.findMany({
    where: { versions: { none: {} } },
    select: {
      id: true,
      title: true,
      description: true,
      code: true,
      createdAt: true,
    },
  });

  // 2. Insert v1 for each, set live_version = 1
  for (const a of missing) {
    await prisma.$transaction([
      prisma.artifactVersion.create({
        data: {
          artifactId: a.id,
          versionNumber: 1,
          title: a.title,
          description: a.description ?? "",
          code: a.code,
          createdAt: a.createdAt,
        },
      }),
      prisma.artifact.update({
        where: { id: a.id },
        data: { liveVersion: 1 },
      }),
    ]);
  }

  // 3. Fix artifacts that have versions but live_version = 0
  const fixedCount = await prisma.artifact.updateMany({
    where: {
      liveVersion: 0,
      versions: { some: {} },
    },
    data: { liveVersion: 1 },
  });

  console.log(`Created v1 for ${missing.length} artifact(s)`);
  console.log(`Fixed live_version on ${fixedCount.count} additional artifact(s)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
