import { notFound } from "next/navigation";
import { getArtifactBySlug } from "@/lib/artifacts";
import { getTagsForArtifact } from "@/lib/tags";
import { isAuthenticated } from "@/lib/auth";
import { ArtifactView } from "./ArtifactView";

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artifact = getArtifactBySlug(slug);

  if (!artifact) {
    notFound();
  }

  const authed = await isAuthenticated();

  if (artifact.visibility === "private" && !authed) {
    notFound();
  }

  const tags = getTagsForArtifact(artifact.id);
  return <ArtifactView artifact={{ ...artifact, tags }} isLoggedIn={authed} />;
}
