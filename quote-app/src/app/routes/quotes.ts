import express from 'express';
import Quote from './models/quote';

const router = express.Router();

let quotes: Quote[] = [
  { id: '1', author: 'Nastya', text: 'first quote', isDeleted: false },
  { id: '2', author: 'Nastya', text: 'second quote', isDeleted: false }
]

router.get('/quotes', (req, res) => {
  return res.status(200).json({
    data: quotes
  });
});

router.get('/quotes/random', (req, res) => {
  return res.status(200).json(
    quotes[Math.floor(Math.random() * quotes.length)]
  );
});

router.get('/quotes/random?tag={tag}', (req, res) => {
  const tag = req.query.tag as string;
  return res.status(200).json({
    data: quotes.filter(item => item.text.includes(tag) || item.tags?.includes(tag))
  });
});

router.post('/quotes', (req, res) => {
  const quote = req.body;
  quotes.push(quote);

  return res.status(200).json({
    message: 'Quote has been saved successfully'
  });
});

router.get('/quotes/:id', (req, res) => {
  const id = req.params.id;

  return res.status(200).json({
    data: quotes.filter(item => item.id === id)
  });
});

router.put('/quotes/:id', (req, res) => {
  const id = req.params.id;
  const updatedQuote = req.body;
  const index = quotes.findIndex(item => item.id === id);
  quotes[index] = updatedQuote;

  return res.status(200).json({
    message: 'Quote has been updated successfully'
  });
});

router.delete('/quotes/:id', (req, res) => {
  const id = req.params.id;
  const index = quotes.findIndex(item => item.id === id);
  quotes.splice(index, 1);

  return res.status(200).json({
    message: 'Quote has been deleted successfully'
  });
});

export default router;