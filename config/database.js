const mongoose = require('mongoose');

// Connect to MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

// Verify open connection and log any connection errors
const db = mongoose.connection;
db.once('open', () => console.log('Successfully connected to MongoDB'));
db.on('error', (error) => console.error(error));

module.exports = mongoose;
