import { Suspense } from "react";
import { TenantsView } from "./TenantsView";

// TenantsView reads ?property= from the URL, so it renders on the client inside Suspense.
export default function TenantsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading tenants…</p>}>
      <TenantsView />
    </Suspense>
  );
}
