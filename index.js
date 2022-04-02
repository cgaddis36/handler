import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import logger from 'morgan';
import Handler from './handler/index.js';

const port = process.env.PORT || 8000;
const app = express();

app.use(helmet());

// app.use(cors({ origin: environment_config.get('APP_URL'), credentials: true }));

app.use(logger('common'));

//Adding this to limit body size to 50kb thereby preventing large data based DOS attacks
app.use(express.json({ limit: '50mb' }));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000,
  })
);

app.use(logger('common'));

app.listen(port, () => {
    console.log(`App running on port ${port}`);
    Handler();
  });

app.get(['/', '/health'], async (request, response) => {
  response.status(200).send('Success');
});