const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Avtojon API running on port ${PORT}`);
});
