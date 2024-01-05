const mongoose = require('mongoose');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.dbUrl);

        console.log('Mongodb is connected');
    } catch (err) {
        console.log(err);
        process.exit(1)
    }
}

module.exports = connectDb;
