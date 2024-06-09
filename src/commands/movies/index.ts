import type { Command, IntentionalAny, AnyInteraction, CommandOrModalRunMethod } from 'src/types';

import axios from 'axios';
import dotenv from 'dotenv';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } from '@discordjs/builders';

import { Movies } from 'src/models/movies';
import { MovieNotes } from 'src/models/movie-notes';
import { MOVIE_DATABASE_API_ROOT } from 'src/constants';
import { parseInput, getSubcommand, replyWithEmbeds } from 'src/discord-utils';
import { log, error } from 'src/logging';
import { getRandomElement } from 'src/utils';
import { listenForButtons, removeButtons } from '../utils';

dotenv.config();

type Movie = Movies;

/**
 * TODOs for later:
 * - Add notes
 *  - Movies to Notes should be a one to many relationship in the database,
 *    so table associations need to be added, which is the blocker for this.
 *  - Listing movies should include user notes
 *  - TODOs:
 *    - add note
 *    - list notes with movies embeds
 *    - edit notes
 *    - delete notes
 * - Add lists
 *   - Support custom movie (ordered) lists. Again, need database associations, so blocked on that.
 *   - TODO: Come up with database schema for maintaining list order
 */

/**
 * TODOs:
 * - Add "title" and "imdb_id" as list option
 * - start movie
 *  - create a thread in configured movie channel
 *  - create a message that mentions role
 *  - marks movie as watched
 *  - add a "start" button to the movie picker command response
 *    which lets you just start the movie without having
 *    to use the /movie start command
 * - ?? Auto complete movie entries for user
 * - Toon adds ChatGPT recommendations
 */

/**
 * Done and needs testing:
 * - TODO
 */

function getMovieEmbed(movie: Movie): EmbedBuilder {
  return new EmbedBuilder({
    title: `${movie.title} (${movie.year})`,
    url: `https://imdb.com/title/${movie.imdb_id}`,
    fields: [
      {
        name: 'Director',
        value: movie.director || '',
        inline: false,
      },
      {
        name: 'Actor',
        value: movie.actors || '',
        inline: false,
      },
      {
        name: 'Ratings',
        value: '',
        inline: false,
      },
      {
        name: 'IMDb',
        value: String(movie.imdb_rating),
        inline: true,
      },
      {
        name: 'Metacritic',
        value: String(movie.metacritic_rating),
        inline: true,
      },
      {
        name: 'Rotten Tomatoes',
        value: String(movie.rotten_tomatoes_rating),
        inline: true,
      },
    ],
    footer: movie.imdb_id ? {
      text: `IMDb ID: ${movie.imdb_id}`,
    } : undefined,
  });
}
const commandBuilder = new SlashCommandBuilder();
commandBuilder
  .setName('movies')
  .setDescription('Managing movie list');

commandBuilder.addSubcommand(subcommand => {
  subcommand
    .setName('create')
    .setDescription('Create a movie.')
    .addStringOption(option => option
      .setName('title')
      .setDescription('Title of the movie')
      .setRequired(false))
    .addStringOption(option => option
      .setName('imdb_id')
      .setDescription('Part of the URL. Ex: tt8801880')
      .setRequired(false))
    .addBooleanOption(option => option
      .setName('favorite')
      .setDescription('Whether this is favorited')
      .setRequired(false));
  return subcommand;
});

commandBuilder.addSubcommand(subcommand => {
  subcommand
    .setName('edit')
    .setDescription('Edit a movie.')
    .addStringOption(option => option
      .setName('imdb_id')
      .setDescription('Part of the URL. Ex: tt8801880')
      .setRequired(false))
    .addStringOption(option => option
      .setName('title')
      .setDescription('Title of the movie')
      .setRequired(false))
    .addBooleanOption(option => option
      .setName('favorite')
      .setDescription('Whether this is favorited')
      .setRequired(false))
    .addBooleanOption(option => option
      .setName('watched')
      .setDescription('Whether this has been watched')
      .setRequired(false))
    .addStringOption(option => option
      .setName('actors')
      .setDescription('Actors (comma-separated)')
      .setRequired(false))
    .addStringOption(option => option
      .setName('genre')
      .setDescription('Genre (comma-separated)')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('year')
      .setDescription('Year of release')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('imdb_rating')
      .setDescription('IMDB rating (0-100)')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('metacritic_rating')
      .setDescription('Metacritic rating (0-100)')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('rotten_tomatoes_rating')
      .setDescription('Rotten Tomatoes rating (0-100)')
      .setRequired(false))
    .addStringOption(option => option
      .setName('language')
      .setDescription('Language')
      .setRequired(false));
  return subcommand;
});

commandBuilder.addSubcommand(subcommand => {
  subcommand
    .setName('delete')
    .setDescription('Delete a movie.')
    .addStringOption(option => option
      .setName('title')
      .setDescription('Title of the movie (must be exact)')
      .setRequired(false))
    .addStringOption(option => option
      .setName('imdb_id')
      .setDescription('Part of the URL. Ex: tt8801880')
      .setRequired(false));
  return subcommand;
});

// TODO:
// - Directors
// - Other ratings
// - Minimum and maximum values for ratings and length
function applyFilterOptions(subcommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder {
  return subcommand
    .addStringOption(option => option
      .setName('genre')
      .setDescription('Picks movie based on genre')
      .setRequired(false))
    .addStringOption(option => option
      .setName('rating')
      .setDescription('Picks movie based on rating')
      .setRequired(false))
    .addStringOption(option => option
      .setName('actor')
      .setDescription('Picks movie based on actor chosen')
      .setRequired(false))
    .addStringOption(option => option
      .setName('director')
      .setDescription('Person who directed the movie')
      .setRequired(false))
    .addBooleanOption(option => option
      .setName('is_favorite')
      .setDescription('Picks from list of favorited movies')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('movie_length_max')
      .setDescription('Max length of the movie in minutes')
      .setRequired(false))
    .addNumberOption(option => option
      .setName('imdb_rating')
      .setDescription('IMDb rating of movie')
      .setRequired(false));
}

commandBuilder.addSubcommand(subcommand => {
  subcommand
    .setName('pick')
    .setDescription('Picks movies based on given parameters');
  return applyFilterOptions(subcommand);
});

commandBuilder.addSubcommand(subcommand => {
  subcommand
    .setName('list')
    .setDescription('Filters a list of movies.');
  return applyFilterOptions(subcommand);
});

// TODO: Uncomment
const movieApiKey = ''; // process.env.OMBD_API_KEY;

function isMovieApiSetUp(): boolean {
  return Boolean(movieApiKey);
}

function getDeleteButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>({
    components: [
      new ButtonBuilder({
        customId: 'delete',
        label: 'Delete',
        style: ButtonStyle.Danger,
      }),
    ],
  });
}

// TODO: Separate create and edit. This is too coupled for no reason
async function handleUpsert(
  interaction: AnyInteraction,
  subcommand: 'edit' | 'create',
): Promise<IntentionalAny> {
  const isEditing = subcommand === 'edit';

  const inputs = await parseInput({
    slashCommandData: commandBuilder,
    interaction,
  }) as {
    imdb_id?: string,
    title?: string,
    favorite?: boolean,
    watched?: boolean
    actors?: string,
    genre?: string,
    year?: number,
    imdb_rating?: number,
    metacritic_rating?: number,
    rotten_tomatoes_rating?: number,
    language?: string,
  };

  if (!inputs.imdb_id && !inputs.title) {
    throw new Error('You must provide IMDb code or title');
  }

  function listenForDeleteButton(message: Message<boolean>, movie: Movie) {
    listenForButtons({
      interaction,
      message,
      handlers: {
        delete: async () => {
          await movie.destroy();
        },
      },
      cleanupCb: async () => {
        await interaction.editReply({
          content: 'Movie was created, but then deleted.',
          embeds: [],
          components: [],
        });
      },
    });
  }

  if (movieApiKey && !isEditing) {
    const url = new URL(MOVIE_DATABASE_API_ROOT);
    url.searchParams.append('apiKey', movieApiKey);
    url.searchParams.append('type', 'movie');
    if (inputs.imdb_id) {
      url.searchParams.append('i', inputs.imdb_id);
    } else if (inputs.title) {
      url.searchParams.append('t', inputs.title);
    }

    try {
      const res = await axios.get(url.href);
      if (res.data.Response === 'False') {
        // {"Response":"False","Error":"Movie not found!"}
        // Movie is not found
        throw new Error('Movie not found');
      }
      if (res.data.Response === 'True') {
        // Found the movie
        // TODO: Handle this movie creation better. This is very error prone
        // eslint-disable-next-line
        // {"Title":"Batman v Superman","Year":"2013","Rated":"N/A","Released":"20 Nov 2013","Runtime":"N/A","Genre":"Short, Comedy","Director":"Flober, Adrien Ménielle","Writer":"Adrien Ménielle","Actors":"Nicolas Berno, Kevin Eaton, Adrien Ménielle, Valentin Vincent","Plot":"N/A","Language":"French","Country":"France","Awards":"N/A","Poster":"N/A","Ratings":[{"Source":"Internet Movie Database","Value":"8.1/10"}],"Metascore":"N/A","imdbRating":"8.1","imdbVotes":"23","imdbID":"tt6130880","Type":"movie","DVD":"N/A","BoxOffice":"N/A","Production":"N/A","Website":"N/A","Response":"True"}
        // The search is really bad tbh. It returns this for "Batman v Superman": https://www.imdb.com/title/tt6130880/
        // so we should prefer imdb ID
        const [movie] = await Movies.upsert({
          guild_id: interaction.guildId!,
          title: res.data.Title,
          is_favorite: inputs.favorite || false,
          was_watched: false,
          length: Number(res.data.Runtime.replace(/[^\d]/g, '')),
          actors: res.data.Actors,
          director: res.data.Director,
          genre: res.data.Genre,
          year: Number(res.data.Year),
          imdb_id: res.data.imdbID,
          imdb_rating: Number(res.data.imdbRating) * 10,
          metacritic_rating: Number(res.data.Metascore),
          rotten_tomatoes_rating: Number(res.data.Ratings.find((r: IntentionalAny) => r.Source === 'Rotten Tomatoes').Value.replace('%', '')),
          rating: res.data.Rated,
          language: res.data.Language,
        }, {
          returning: true,
        });
        const embed = getMovieEmbed(movie);
        // TODO: We should add a delete button to this response so someone can quickly undo this addition if it finds the wrong movie
        const message = await interaction.editReply({
          content: 'Movie created!',
          embeds: [embed],
          components: [getDeleteButton()],
        });
        listenForDeleteButton(message, movie);
        return;
      }
    } catch (err) {
      error(err);
    }
  } else if (isEditing) {
    if (!inputs.title && !inputs.imdb_id) {
      throw new Error('Must provide title or imdb_id to edit movie');
    }
    const query: Partial<Movie> = {
      guild_id: interaction.guildId!,
    };
    if (inputs.title) query.title = inputs.title;
    if (inputs.imdb_id) query.imdb_id = inputs.imdb_id;
    const movie = await Movies.findOne({
      where: query,
    });
    if (!movie) throw new Error('Movie not found');
    const updateObject: Partial<Movie> = {
      guild_id: interaction.guildId!,
    };
    // TODO: Fix this cringe
    if (inputs.favorite != null) updateObject.is_favorite = inputs.favorite;
    if (inputs.watched != null) updateObject.was_watched = inputs.watched;
    if (inputs.actors != null) updateObject.actors = inputs.actors;
    if (inputs.genre != null) updateObject.genre = inputs.genre;
    if (inputs.year != null) updateObject.year = inputs.year;
    if (inputs.imdb_rating != null) updateObject.imdb_rating = inputs.imdb_rating;
    if (inputs.metacritic_rating != null) updateObject.metacritic_rating = inputs.metacritic_rating;
    if (inputs.rotten_tomatoes_rating != null) updateObject.rotten_tomatoes_rating = inputs.rotten_tomatoes_rating;
    if (inputs.language != null) updateObject.language = inputs.language;
    await movie.update(updateObject);
    const embed = getMovieEmbed(movie);
    await interaction.editReply({
      content: 'Movie updated',
      embeds: [embed],
    });
  } else if (inputs.title) {
    // Upsert the movie
    const [movie] = await Movies.upsert({
      guild_id: interaction.guildId!,
      title: inputs.title,
      is_favorite: inputs.favorite || false,
      was_watched: false,
      length: null,
      actors: null,
      director: null,
      genre: null,
      year: null,
      imdb_id: null,
      imdb_rating: null,
      metacritic_rating: null,
      rotten_tomatoes_rating: null,
      rating: null,
      language: null,
    }, {
      returning: true,
    });

    // TODO: Remove
    // await movie.addMovieNote(new MovieNotes({
    //   guild_id: interaction.guildId!,
    //   author_id: interaction.user.id,
    //   note: 'TODO',
    // }));

    const embed = getMovieEmbed(movie);
    const message = await interaction.editReply({
      content: 'Movie created, but additional data could not be fetched for the title',
      embeds: [embed],
      components: [getDeleteButton()],
    });
    listenForDeleteButton(message, movie);
  } else {
    throw new Error('Movie not created. Title was not provided and the movie data could not be fetched.');
  }
}

type FilterInputs = {
  search_term?: string,
  genre?: string,
  movie_length_max?: number,
  actors?: string,
  director?: string,
  imdb_rating?: number,
  is_favorite?: boolean,
};

function filterMovie(movie: Movie, inputs: FilterInputs): boolean {
  let isMatch = true;
  if (inputs.search_term) {
    if (!movie.title.toLowerCase().includes(inputs.search_term.toLowerCase())) {
      isMatch = false;
    }
  }
  if (inputs.genre) {
    if (!movie.genre || !movie.genre.toLowerCase().includes(inputs.genre.toLowerCase())) {
      isMatch = false;
    }
  }
  if (inputs.movie_length_max) {
    if (!movie.length || movie.length > inputs.movie_length_max) {
      isMatch = false;
    }
  }
  if (inputs.actors) {
    if (!movie.actors || !movie.actors.toLowerCase().includes(inputs.actors.toLowerCase())) {
      isMatch = false;
    }
  }
  if (inputs.director) {
    if (!movie.director || !movie.director.toLowerCase().includes(inputs.director.toLowerCase())) {
      isMatch = false;
    }
  }
  if (inputs.imdb_rating) {
    if (!movie.imdb_rating || movie.imdb_rating <= inputs.imdb_rating) {
      isMatch = false;
    }
  }
  if (inputs.is_favorite) {
    if (!movie.is_favorite) {
      isMatch = false;
    }
  }
  return isMatch;
}

async function handleList(interaction: AnyInteraction): Promise<IntentionalAny> {
  const inputs = await parseInput({
    slashCommandData: commandBuilder,
    interaction,
  }) as FilterInputs;
  const movies = await Movies.findAll({
    // include: MovieNotes,
  });
  const filteredMovies = movies.filter(movie => filterMovie(movie, inputs));

  // TODO: Remove
  // const notes = await filteredMovies[0]?.getMovieNotes();
  // console.log('Notes', notes);

  const embeds = filteredMovies.map(movie => getMovieEmbed(movie));
  await replyWithEmbeds({
    interaction,
    embeds,
    ephemeral: true,
  });
}

async function handlePick(interaction: AnyInteraction): Promise<IntentionalAny> {
  const inputs = await parseInput({
    slashCommandData: commandBuilder,
    interaction,
  }) as FilterInputs;

  const movies = await Movies.findAll({});
  const filteredMovies = movies.filter(movie => filterMovie(movie, inputs));
  const pickedMovie = getRandomElement(filteredMovies);
  const movieEmbed = getMovieEmbed(pickedMovie);
  // TODO: Extract this button stuff to a utility function. Too much boilerplate
  const message = await interaction.editReply({
    embeds: [movieEmbed],
    components: [
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({
            customId: 'start',
            label: 'Start',
            style: ButtonStyle.Primary,
          }),
        ],
      }),
    ],
  });
  listenForButtons({
    interaction,
    message,
    handlers: {
      start: async () => {
        // TODO: Create thread, mention roles and mark the movie as watched
        console.log('TODO start', pickedMovie);
      },
    },
    cleanupCb: async () => {
      await interaction.editReply({
        components: [],
      });
      await interaction.followUp({
        content: 'La pelicula comenzo!',
      });
    },
  });
}

async function handleDelete(interaction: AnyInteraction): Promise<IntentionalAny> {
  const inputs = await parseInput({
    slashCommandData: commandBuilder,
    interaction,
  }) as {
    title?: string,
    imdb_id?: string,
  };

  const { title, imdb_id: imdbId } = inputs;

  if (imdbId) {
    await Movies.destroy({
      where: {
        guild_id: interaction.guildId!,
        imdb_id: imdbId,
      },
    });
  } else if (title) {
    await Movies.destroy({
      where: {
        guild_id: interaction.guildId!,
        title,
      },
    });
  } else {
    throw new Error('title or imdb_id is required');
  }

  await interaction.editReply('Movie deleted.');
}

const run: CommandOrModalRunMethod = async interaction => {
  await interaction.deferReply({ ephemeral: false });

  if (!isMovieApiSetUp()) {
    log('OMDb API is not configured');
  }

  const subcommand = getSubcommand(interaction);
  switch (subcommand) {
    case 'list': {
      return handleList(interaction);
    }
    case 'edit':
    case 'create': {
      return handleUpsert(interaction, subcommand);
    }
    case 'delete': {
      return handleDelete(interaction);
    }
    case 'pick': {
      return handlePick(interaction);
    }
    default: {
      return interaction.editReply('What??');
    }
  }
};

const MovieCommand: Command = {
  guildOnly: true,
  slashCommandData: commandBuilder,
  showModalWithNoArgs: true,
  runCommand: run,
  runModal: run,
  modalPlaceholders: {
    favorite: 'yes/no',
  },
};

export default MovieCommand;
