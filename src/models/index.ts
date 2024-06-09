import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Sequelize, Options } from 'sequelize';
import { IntentionalAny } from 'src/types';

dotenv.config();

const sequelizeOpts: Options = {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
};

if (process.env.ENVIRONMENT === 'production') {
  Object.assign(sequelizeOpts, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // https://stackoverflow.com/a/61350416/2554605
      },
    },
  });
}

const sequelize = new Sequelize(process.env.DATABASE_URL!, sequelizeOpts);

fs
  .readdirSync(__dirname)
  .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'movie-notes.ts')
  .map(file => {
    // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    return require(path.join(__dirname, file));
  })
  .map(modelExports => {
    modelExports.default(sequelize);
    return modelExports;
  });
// TODO: Add this code back once the on conflict stuff is figured out
// .forEach(modelExports => {
//   if (modelExports.associate) {
//     modelExports.associate();
//   }
// });

export function syncModels(): Promise<IntentionalAny> {
  // TODO: Add proper migrations instead of allowing the tables to be altered
  return sequelize.sync({ alter: true });
}
