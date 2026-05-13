import { TopicTimeApp } from "@/components/topic-time-app";

type RoomsPageProps = {
  searchParams?: Promise<{
    demo?: string;
  }>;
};

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;

  return <TopicTimeApp initialDemo={params?.demo === "1"} />;
}
