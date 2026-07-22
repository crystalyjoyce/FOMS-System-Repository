import React from 'react';

// AiHeader is now a no-op stub.
// The global header is rendered at the layout level (App.tsx) via GlobalHeader.
// This stub preserves backward compatibility with all page components
// that still call <AiHeader title="..." />.

interface AiHeaderProps {
  title: string;
}

export const AiHeader: React.FC<AiHeaderProps> = () => null;
