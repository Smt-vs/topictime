/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/visione.html", destination: "/", permanent: true },
      { source: "/funziona.html", destination: "/", permanent: true },
      { source: "/esperienza.html", destination: "/wallet", permanent: true },
      { source: "/community.html", destination: "/community", permanent: true },
      { source: "/tecnologia.html", destination: "/radar", permanent: true },
      { source: "/contatti.html", destination: "/support", permanent: true },
      { source: "/roadmap.html", destination: "/community", permanent: true },
    ];
  },
};

export default nextConfig;
