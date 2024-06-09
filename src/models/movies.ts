import Sequelize, {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Op,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyRemoveAssociationsMixin,
  NonAttribute,
} from 'sequelize';
import type { ModelDefinition } from 'src/types';
// import { MovieNotes } from './movie-notes';

// type MovieNotePrimaryKeyType = MovieNotes['id'];

export class Movies extends Model<
  InferAttributes<Movies>, InferCreationAttributes<Movies>
> {
  // https://sequelize.org/docs/v6/other-topics/typescript/
  // declare getMovieNotes: HasManyGetAssociationsMixin<MovieNotes>;
  // declare addMovieNote: HasManyAddAssociationMixin<MovieNotes, MovieNotePrimaryKeyType>;
  // declare removeMovieNote: HasManyRemoveAssociationsMixin<MovieNotes, MovieNotePrimaryKeyType>;
  // declare notes?: NonAttribute<MovieNotes[]>;

  declare id: CreationOptional<string>;
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

const COMMA_SEPARATED_VALIDATION_REGEX = /^([^,]+,\s*)*[^,]+$/;

const MoviesDefinition: ModelDefinition = sequelize => {
  const tableName = 'movies';
  Movies.init({
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    guild_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
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
      validate: {
        is: COMMA_SEPARATED_VALIDATION_REGEX,
      },
    },
    director: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    genre: {
      type: Sequelize.TEXT,
      allowNull: true,
      validate: {
        is: COMMA_SEPARATED_VALIDATION_REGEX,
      },
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
    indexes: [
      {
        unique: true,
        fields: ['guild_id', 'imdb_id'],
        where: {
          imdb_id: {
            [Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ['guild_id', 'title'],
      },
    ],
  });
};

// export function associate(): void {
//   Movies.hasMany(MovieNotes, {
//     as: 'movieNotes',
//     foreignKey: {
//       name: 'movie_id',
//     },
//   });
// }

export default MoviesDefinition;
