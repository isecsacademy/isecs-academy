import { getArrears } from "./actions";
import { ArrearsClient } from "./arrears-client";

export const dynamic = "force-dynamic";

export default async function ArrearsPage() {
  const arrears = await getArrears();
  return <ArrearsClient initialArrears={arrears as any} />;
}
