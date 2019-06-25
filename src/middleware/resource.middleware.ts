import { 
    Inject,
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler, 
    HttpException,
    HttpStatus,
    Body,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { BunyanLogger } from '../logger/extlogger.service';
import { ConfigService } from '../config/config.service';
import * as hooks from '../hooks';

@Injectable()
export class ResourceMiddleware implements NestInterceptor {
  constructor(
    @Inject('ConfigService') private config: ConfigService,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.getArgByIndex(0);
    const res = context.getArgByIndex(1);
    console.log('------------------------------ RESOUCE MIDDLEWARE ----------------------------');
    const resource = req.params.resource;
    const singular = resource.slice(0, resource.length - 1);
    const singularCased = resource.charAt(0).toUpperCase() + singular.slice(1);
    res.locals.resource = resource;
    res.locals.resourceSingular = singular;
    res.locals.resourceSingularCased = singularCased;

    const hookNames = Object.keys(hooks);
    if (hookNames.length === 0) {
        return;
    }

    const prehooks = hookNames.filter(name => name.includes(resource) && name.includes('pre') && name.includes(req.method));
    const posthooks = hookNames.filter(name => name.includes(resource) && name.includes('post') && name.includes(req.method));

    prehooks.forEach(name => {
        console.log(name);
        hooks[name][0](req, res);
    });

    return next.handle().pipe(
        tap(() => {
            console.log('in the tap')

            posthooks.forEach(name => {
                console.log(name);
                hooks[name][0](req, res);
            });

        }),
      );

  }
}
