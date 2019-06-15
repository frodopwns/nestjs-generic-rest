import {
  Controller,
  Get,
  Req,
  Inject,
  HttpException,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BunyanLogger } from '../logger/extlogger.service';
import { KeyVaultProvider } from '../secrets/keyvault.service';
import { CosmosDBProvider } from 'src/db/cosmos.service';
import { DocumentQuery, RetrievedDocument } from 'documentdb';
import { DATABASE_NAME, COLLECTION_NAME } from '../db/constants';
import { LoggingInterceptor } from '../logger/logger.interceptor';

@UseInterceptors(LoggingInterceptor)
@Controller('movies')
export class MovieController {
  constructor(
    @Inject('BunyanLogger') private readonly logger: BunyanLogger,
    @Inject('CosmosDBProvider') private readonly db: CosmosDBProvider,
    @Inject('KeyVaultProvider') private readonly kv: KeyVaultProvider,
  ) {}

  @Get()
  async getAll(@Req() request: Request, response: Response) {
    let querySpec: DocumentQuery;

    // Movie name is an optional query param.
    // If not specified, we should query for all movies.
    const movieName: string = request.query.q;
    if (movieName === undefined) {
      querySpec = {
        parameters: [],
        query: `SELECT root.movieId, root.type, root.title, root.year,
            root.runtime, root.genres, root.roles
            FROM root where root.type = 'Movie'`,
      };
    } else {
      // Use StartsWith in the title search since the textSearch property always starts with the title.
      // This avoids selecting movies with titles that also appear as Actor names or Genres.
      // Make the movieName lowercase to match the case in the search.
      querySpec = {
        parameters: [
          {
            name: '@title',
            value: movieName.toLowerCase(),
          },
        ],
        query: `SELECT root.movieId, root.type, root.title, root.year,
            root.runtime, root.genres, root.roles
            FROM root where CONTAINS(root.textSearch, @title) and root.type = 'Movie'`,
      };
    }

    let results: RetrievedDocument[];
    try {
      results = await this.db.queryDocuments(
        DATABASE_NAME,
        COLLECTION_NAME,
        querySpec,
        { enableCrossPartitionQuery: true },
      );
    } catch (err) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR);
      this.logger.Trace(err);
    }

    return results;
  }

  @Get('/:id')
  public async getById(@Req() request: Request, response: Response) {
    const movieId = request.params.id;

    const querySpec: DocumentQuery = {
      parameters: [
        {
          name: '@id',
          value: movieId,
        },
      ],
      query: `SELECT root.id, root.movieId, root.type, root.title, root.year,
          root.runtime, root.genres, root.roles, root.key
          FROM root where root.id = @id and root.type = 'Movie'`,
    };

    // movieId isn't the partition key, so any search on it will require a cross-partition query.
    const resCode = HttpStatus.OK;
    let results: RetrievedDocument[];
    try {
      results = await this.db.queryDocuments(
        DATABASE_NAME,
        COLLECTION_NAME,
        querySpec,
        { enableCrossPartitionQuery: true },
      );
    } catch (err) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!results || !results.length) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    return results;
  }
}
