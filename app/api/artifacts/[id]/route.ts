import { NextResponse } from 'next/server';
import { artifactService } from '@/app/services/artifact.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artifact = await artifactService.getArtifact(id);

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load artifact' },
      { status: 500 },
    );
  }
}
