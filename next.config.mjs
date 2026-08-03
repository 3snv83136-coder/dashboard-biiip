/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "biiipcomedyclub.fr" },
      { protocol: "https", hostname: "dashboard-biiip.vercel.app" },
    ],
  },
};

export default nextConfig;
