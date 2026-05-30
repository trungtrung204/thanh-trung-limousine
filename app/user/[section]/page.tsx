import CustomerPortalPage from "@/components/CustomerPortalPage";

export default async function UserSectionPage({
  params
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <CustomerPortalPage section={section} />;
}
