import mongoose from './mongoose';
import { schemaOptions } from './_options';

const appSchemaDefinition = {
  name: { type: String, required: true },
  description: String,
  icon: String
};

const appSchema = new mongoose.Schema(appSchemaDefinition, schemaOptions);

// declare indexes
appSchema.index('name', { unique: true, background: true });

const App = mongoose.model('App', appSchema, 'tracker_apps');

export default App;
