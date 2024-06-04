import Sequelize, {
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import type { ModelDefinition } from 'src/types';

export class Movies extends Model<
  InferAttributes<Movies>, InferCreationAttributes<Movies>
> {
  declare guild_id: string;
  declare title: string;
  declare is_favorite: boolean;
  declare was_watched: boolean;
  declare length: number | null; // in minutes
  declare actors: string | null; // comma-separated
  declare director: string | null;
  declare genre: string | null; // comma-separated
  declare year: number | null;
  declare imdb_id: string | null;
  declare imdb_rating: number | null; // 0-100
  declare metacritic_rating: number | null; // 0-100
  declare rotten_tomatoes_rating: number | null; // 0-100
  declare rating: string | null;
  declare language: string | null;
}

const MoviesDefinition: ModelDefinition = sequelize => {
  const tableName = 'movies';
  Movies.init({
    guild_id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    is_favorite: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    was_watched: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    length: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    actors: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    director: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    genre: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    imdb_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    imdb_rating: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    metacritic_rating: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    rotten_tomatoes_rating: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    rating: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    language: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    tableName,
    freezeTableName: true,
  });
};

export default MoviesDefinition;
