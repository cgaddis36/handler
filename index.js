import express from 'express';
import logger from 'morgan';
import Handler from './handler/index.js';

const port = process.env.PORT || 8000;
const app = express();

app.use(logger('common'));

app.listen(port, () => {
    console.log("Server started at port 2400");
    Handler();
  });
