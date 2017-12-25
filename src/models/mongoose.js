import { Mongoose } from 'mongoose';

const mongoose = new Mongoose();
mongoose.Promise = Promise;

if (process.env.ENABLE_MONGOOSE_DEBUG) {
  mongoose.set('debug', true);
}

export default mongoose;
