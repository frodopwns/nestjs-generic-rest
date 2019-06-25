import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Req,
  Res,
  Inject,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BunyanLogger } from '../logger/extlogger.service';
import { CosmosDBProvider } from 'src/db/cosmos.service';
import { DocumentQuery, RetrievedDocument } from 'documentdb';
import { ConfigService } from '../config/config.service';

const getAllQuery = `SELECT * FROM root where root.type = @type`;
const getAllFilterQuery = `SELECT * FROM root where CONTAINS(root.textSearch, @title) and root.type = @type`;
const getByIdQuery = `SELECT * FROM root where root.id = @id and root.type = @type`;

@Controller('api/:resource')
export class ResourceController {
  constructor(
    @Inject('BunyanLogger') private readonly logger: BunyanLogger,
    @Inject('CosmosDBProvider') private readonly db: CosmosDBProvider,
    @Inject('ConfigService') private config: ConfigService,
  ) {}

  @Get()
  async getAll(@Req() request: Request, @Res() response: Response) {

    console.log();
    const fields = response.locals.schema.selectors;
    const singularCased = response.locals.resourceSingularCased;
    let querySpec: DocumentQuery = {
      parameters: [
        {
          name: '@type',
          value: singularCased,
        },
      ],
      query: getAllQuery.replace('*', fields),
    };

    const filterString: string = request.query.q;
    if (filterString !== undefined) {
      querySpec.parameters.push({
        name: '@title',
        value: filterString.toLowerCase(),
      });

      querySpec.query = getAllFilterQuery.replace('*', fields);
    }

    let results: RetrievedDocument[];
    try {
      results = await this.db.queryDocuments(
        this.config.getVarErr('DATABASE_NAME'),
        this.config.getVarErr('DATABASE_COLLECTION'),
        querySpec,
        { enableCrossPartitionQuery: true },
      );
    } catch (err) {
      this.logger.Trace(err);
    }

    response.status(HttpStatus.OK).json(results);
  }

  @Get('/:id')
  public async getById(@Req() request: Request, @Res() response: Response) {
    const fields = response.locals.schema.selectors;
    const resourceId = request.params.id;
    const singularCased = response.locals.resourceSingularCased;

    const querySpec: DocumentQuery = {
      parameters: [
        {
          name: '@id',
          value: resourceId,
        },
        {
          name: '@type',
          value: singularCased,
        },
      ],
      query: getByIdQuery.replace('*', fields),
    };

    let results: RetrievedDocument[];
    try {
      results = await this.db.queryDocuments(
        this.config.getVarErr('DATABASE_NAME'),
        this.config.getVarErr('DATABASE_COLLECTION'),
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

    response.status(HttpStatus.OK).json(results[0]);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() pbody: any) {

    let result: RetrievedDocument;
    try {
        result = await this.db.upsertDocument(
          this.config.getVarErr('DATABASE_NAME'),
          this.config.getVarErr('DATABASE_COLLECTION'),
          pbody,
        );
    } catch (err) {
        throw new HttpException('Failed to create object', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result;
  }

  @Put("/:id")
  public async updateResource(@Body() pbody: any) {

    let result: RetrievedDocument;
    try {
        result = await this.db.upsertDocument(
          this.config.getVarErr('DATABASE_NAME'),
          this.config.getVarErr('DATABASE_COLLECTION'),
            pbody,
        );
    } catch (err) {
      throw new HttpException('Failed to update resource', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result;
  }

  @Delete('/:id')
  public async deleteMovieById(@Req() request: Request, @Res() response: Response) {
    const resourceId = request.params.id;
    const singularCased = response.locals.resourceSingularCased;

    let result: string;
    try {
        await this.db.deleteDocument(
          this.config.getVarErr('DATABASE_NAME'),
          this.config.getVarErr('DATABASE_COLLECTION'),
          resourceId,
        );
        result = 'deleted';
    } catch (err) {
        let resCode: number;
        if (err.toString().includes("NotFound")) {
            resCode = HttpStatus.NOT_FOUND;
            result = 'A Movie with that ID does not exist';
        } else {
            resCode = HttpStatus.INTERNAL_SERVER_ERROR;
            result = err.toString();
        }
        throw new HttpException(result, resCode);
    }

    response.status(HttpStatus.NO_CONTENT).json(result);
  }
}
