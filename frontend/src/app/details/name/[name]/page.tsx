// app/details/name/[name]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NameDetails = ({ params }: { params: { name: string } }) => {
  const { name } = params;

  useEffect(() => {
    // Fetch name-specific details if needed
  }, [name]);

  return (
    <div>
      <h1>Package Name Details</h1>
      <p><strong>Name:</strong> {name}</p>
      {/* Additional package details */}
    </div>
  );
};

export default NameDetails;
