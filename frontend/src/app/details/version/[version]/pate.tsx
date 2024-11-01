// app/details/version/[version]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const VersionDetails = ({ params }: { params: { version: string } }) => {
  const { version } = params;

  useEffect(() => {
    // Fetch version-specific details if needed
  }, [version]);

  return (
    <div>
      <h1>Package Version Details</h1>
      <p><strong>Version:</strong> {version}</p>
      {/* Additional package details */}
    </div>
  );
};

export default VersionDetails;
