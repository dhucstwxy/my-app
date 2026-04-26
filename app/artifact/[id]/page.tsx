import { artifactService } from '@/app/services/artifact.service';
import { ArtifactNotFound } from './ArtifactNotFound';
import { ArtifactView } from './ArtifactView';

export default async function ArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await artifactService.getArtifact(id);

  if (!artifact) {
    return <ArtifactNotFound artifactId={id} />;
  }

  return <ArtifactView artifact={artifact} />;
}

export const dynamic = 'force-dynamic';
