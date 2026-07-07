import ExplorePage from './page.client';

export const generateMetadata = () => ({
  title: {
    default: 'Cheapest Day to Fly — Route Price History',
    template: '%s — Flight Price History',
  },
  description: 'Compare average flight prices across departure dates to find the cheapest day to fly on your route.',
  alternates: {
    canonical: '/explore',
  },
});

export default function Page() {
  return <ExplorePage />;
}
