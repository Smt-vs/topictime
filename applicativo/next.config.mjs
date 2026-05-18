/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/rooms", destination: "/applicativo", permanent: true },
      { source: "/wallet", destination: "/applicativo/wallet", permanent: true },
      { source: "/community", destination: "/applicativo/community", permanent: true },
      { source: "/profile", destination: "/applicativo/profile", permanent: true },
      { source: "/radar", destination: "/applicativo/radar", permanent: true },
      { source: "/support", destination: "/applicativo/support", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/visione.html", destination: "/", permanent: true },
      { source: "/funziona.html", destination: "/", permanent: true },
      { source: "/esperienza.html", destination: "/applicativo/wallet", permanent: true },
      { source: "/community.html", destination: "/applicativo/community", permanent: true },
      { source: "/tecnologia.html", destination: "/applicativo/radar", permanent: true },
      { source: "/contatti.html", destination: "/applicativo/support", permanent: true },
      { source: "/roadmap.html", destination: "/applicativo/community", permanent: true },
    ];
  },
};

export default nextConfig;
