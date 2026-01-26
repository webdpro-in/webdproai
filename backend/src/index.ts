import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
   res.send('Backend API is running');
});

// Future API routes here

app.listen(PORT, () => {
   console.log(`Backend Service running on port ${PORT}`);
});
