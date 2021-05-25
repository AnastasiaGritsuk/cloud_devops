import express from 'express';
import path  from 'path';
import 'dotenv/config';
import cors from 'cors';
import indexRouter from './app/routes/index';
import quotesRouter from './app/routes/quotes';

const app = express();
const port = process.env.APP_PORT || '5000';
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '..', 'static')));
app.use('/', indexRouter);
app.use('/api/', quotesRouter);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});