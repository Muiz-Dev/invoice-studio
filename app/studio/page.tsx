import { Suspense } from "react";
import StudioClient from "../components/invoice/StudioClient";

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioClient />
    </Suspense>
  );
}
