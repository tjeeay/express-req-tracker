import { join } from 'path';
import { static as serveStatic, Router } from 'express';
import config from './config';
import Builder from './controllers/builder';
import ctrls from './controllers';

const router = Router();

export default function configRouter(manager, baseUrl) {
  baseUrl = join('/', baseUrl).replace(/\\/g, '/');

  Builder.setManager(manager);

  for(let ctrl of ctrls) {
    const path = join(baseUrl, ctrl.prefix).replace(/\\/g, '/');
    router.use(path, ctrl.router);
  }
  // trace request
  router.use(RegExp(`^(?!${baseUrl})`), manager.handle.bind(manager));
  // config static path
  router.use(baseUrl, serveStatic(config.rootPath));

  return router;
}
