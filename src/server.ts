import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import {
  addMessage,
  getMessages,
  TMessage,
} from './services/message-board.service';
import { addNumber, getCalculatedNumbers } from './services/number.service';

const VIEW_ROUTES = [
  {
    path: '/',
    title: 'Home',
    view: 'home',
  },
  {
    path: '/message-board',
    title: 'Message board',
    view: 'message-board',
  },
  {
    path: '/average-number',
    title: 'Average number',
    view: 'average-number',
  },
];

const viewsDir = path.resolve(__dirname, 'views');
const publicDir = path.resolve(__dirname, 'public');
const server = express()
  .engine(
    '.hbs',
    engine({
      extname: '.hbs',
      layoutsDir: path.resolve(viewsDir, 'layouts'),
      partialsDir: path.resolve(viewsDir, 'partials'),
      defaultLayout: 'default',
      helpers: {
        isActiveRoute: <T extends (typeof VIEW_ROUTES)[0]>(a: T, b: T) => {
          return a.path == b.path;
        },
      },
    })
  )
  .set('view engine', '.hbs')
  .set('views', viewsDir)
  .use(express.static(publicDir))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .post('/message-board', (req, res) => {
    if (req.body && req.body['author'] && req.body['message']) {
      addMessage(req.body['author'], req.body['message']);
    }

    res.redirect(req.path);
  })
  .post('/add-number', async (req, res) => {
    if (req.body && req.body['number']) {
      const lastNumber = parseInt(req.body['number'], 10) || 0;
      const updatedNumbers = await addNumber(lastNumber);
      const prevNumber = updatedNumbers.at(1) || 0;
      const avgNumber = (lastNumber + prevNumber) / 2;

      res.send({ lastNumber, prevNumber, avgNumber });
    }
  })
  .get('/numbers', async (_, res) => {
    const calculatedNumbers = await getCalculatedNumbers();

    res.send(calculatedNumbers);
  })
  .use(async (req, res, next) => {
    const foundViewRoute = VIEW_ROUTES.find((viewRoute) => {
      return viewRoute.path === req.path;
    });

    let messages: TMessage[] = [];

    if (foundViewRoute) {
      if (foundViewRoute.path === '/message-board') {
        messages = await getMessages();
      }

      res.render(foundViewRoute.view, {
        routes: VIEW_ROUTES,
        activeRoute: foundViewRoute,
        messages,
      });
      return;
    }

    next();
  });

server.listen(3000, () => {
  console.log('🚀 Server has been started: http://localhost:3000');
});
