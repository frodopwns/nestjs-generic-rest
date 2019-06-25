import { Inject, Injectable, NestMiddleware, HttpException, HttpStatus, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { BunyanLogger } from '../logger/extlogger.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BaseControllerMiddleware implements NestMiddleware {
  constructor(
    @Inject('ConfigService') private config: ConfigService,
  ) {}
  use(req: Request, res: Response, next: Function) {
    const resource = req.params.resource;
    const singular = resource.slice(0, resource.length - 1);
    const singularCased = resource.charAt(0).toUpperCase() + singular.slice(1);
    res.locals.resource = resource;
    res.locals.resourceSingular = singular;
    res.locals.resourceSingularCased = singularCased;

    //const schemas = this.config.schemas.filter(item => item.title.toLowerCase() === singular);
    if (!Object.keys(this.config.schemas).includes(singular)) {
        throw new HttpException('Resource Not Found', HttpStatus.NOT_FOUND);
    }

    const schema = this.config.schemas[singular];
    res.locals.schema = schema;
    const body = req.body;

    if (['POST', 'PUT'].includes(req.method)) {

        if (('type' in body) && body.type !== schema.data.title) {
            throw new HttpException('Bad Request: payload type incorrect', HttpStatus.BAD_REQUEST);
        }

        if (!('type' in body)) {
            body.type = singularCased;
        }
        console.log(body);
        const payloadKeys = Object.keys(body);

        schema.fields.forEach(key => {
            // enforce existence of required fields
            const propKeys = Object.keys(schema.data.properties[key]);

            if ('required' in schema.data.properties[key] && schema.data.properties[key].required && !payloadKeys.includes(key)) {
                throw new HttpException('Bad Request: payload missing required field: ' + key, HttpStatus.BAD_REQUEST);
            }

            if ('empty' in schema.data.properties[key] && !schema.data.properties[key].empty && body[key] === '') {
                throw new HttpException('Bad Request: payload field cannot be empty: ' + key, HttpStatus.BAD_REQUEST);
            }

            if ('allowed' in schema.data.properties[key] && !schema.data.properties[key].allowed.includes(body[key])) {
                throw new HttpException('Bad Request: value not allowed for field: ' + key, HttpStatus.BAD_REQUEST);
            }

            if ('minlength' in schema.data.properties[key] && body[key].length < schema.data.properties[key].minlength) {
                throw new HttpException(
                    `Bad Request: field: ${key} has value shorter than required length of ${schema.data.properties[key].minlength}`,
                    HttpStatus.BAD_REQUEST,
                );
            }

            if ('maxlength' in schema.data.properties[key] && body[key].length > schema.data.properties[key].maxlength) {
                throw new HttpException(
                    `Bad Request: field: ${key} has value longer than max length of ${schema.data.properties[key].maxlength}`,
                    HttpStatus.BAD_REQUEST,
                );
            }

        });
    }

    next();
  }
}
