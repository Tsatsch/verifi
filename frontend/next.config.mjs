import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Acknowledge we're using webpack config intentionally
  // Turbopack doesn't fully support all webpack plugins yet
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    // Fixes for Privy/WalletConnect dependencies
    if (!isServer) {
      // Provide fallbacks for Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        util: false,
        buffer: false,
        events: false,
      }
    }

    // Ignore problematic modules and test files
    config.resolve.alias = {
      ...config.resolve.alias,
      'why-is-node-running': false,
      'pino-pretty': false,
    }

    // Ignore specific problematic imports
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /pino-pretty/,
      })
    )

    // Replace the problematic test helper file with empty module
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /thread-stream\/test\/helper\.js/,
        path.resolve(__dirname, 'webpack-empty-module.js')
      )
    )

    return config
  },
}

export default nextConfig
