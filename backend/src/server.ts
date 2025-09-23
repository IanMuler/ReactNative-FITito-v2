import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env['PORT'] || '3000');
const HOST = process.env['HOST'] || '0.0.0.0';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`\n🚀 FITito API Server is running!`);
  console.log(`📍 Server: http://${HOST}:${PORT}`);
  console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  console.log(`💪 Exercises API: http://${HOST}:${PORT}/api/v1/exercises`);
  console.log(`🗄️  Database: PostgreSQL (${process.env['DB_HOST'] || 'localhost'}:${process.env['DB_PORT'] || 5432})`);
  console.log(`📅 Started: ${new Date().toISOString()}\n`);
});