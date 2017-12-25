import { Mongoose } from 'mongoose';

const mongoose = new Mongoose();
mongoose.Promise = Promise;

if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

export default mongoose;
