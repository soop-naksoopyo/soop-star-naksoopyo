const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.env.BUILDING_NEXT) {
  // Inside vercel build -> run actual next build
  console.log('⚡ Running Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
} else {
  // Entry point from Cloudflare / npm run build
  console.log('⚡ Running Cloudflare Next-on-Pages pipeline...');
  const env = { ...process.env, BUILDING_NEXT: '1' };
  execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit', env });

  const assetsIgnorePath = path.join('.vercel', 'output', 'static', '.assetsignore');
  fs.writeFileSync(assetsIgnorePath, '_worker.js\n');
  console.log('✅ Generated .assetsignore for Cloudflare Workers Static Assets');

  const headersPath = path.join('.vercel', 'output', 'static', '_headers');
  const customHeaders = `
/avatars/*
  Cache-Control: public, max-age=31536000, immutable
/crests/*
  Cache-Control: public, max-age=31536000, immutable
`;
  if (fs.existsSync(headersPath)) {
    fs.appendFileSync(headersPath, customHeaders);
  } else {
    fs.writeFileSync(headersPath, customHeaders.trim() + '\n');
  }
  console.log('✅ Injected immutable Cache-Control headers for avatars and crests');
}
