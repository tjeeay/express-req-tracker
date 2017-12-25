export const dbOptions = {
  useMongoClient: true
};

export const schemaOptions = {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  get autoIndex () {
    return process.env.NODE_ENV === 'development' ? true : false;
  }
};
