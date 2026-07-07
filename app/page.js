import PageClient from './page.client';

export const generateMetadata = () => ({
  title: {
    default: 'Best Time to Fly and Book',
    template: '%s — Flight Price History',
  },
  description: 'Track flight prices to decide when to book. Find the best time to book and monitor price trends for any route.',
  alternates: {
    canonical: '/',
  },
});

export default function Page() {
  return <PageClient />;
}
