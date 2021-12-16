import express from 'express';

const router = express.Router();

router.get('/ping', (req, res) => {
  return res.status(200).json({
    message: "OK",
    time: new Date().toISOString()
  });
})

export default router;