import { Request, Response } from 'express';

export const pre_POST_movies = [
    (req: Request, res: Response) => {
        console.log('pre post movies!');
    },
];

export const post_POST_movies = [
    (req: Request, res: Response) => {
        console.log('post post movies!');
    },
];
