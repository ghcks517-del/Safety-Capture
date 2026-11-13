export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-serverless',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
}
