import express from 'express';
import { env } from './config/env';
import { pool } from './db/pool';
import { directionsRouter } from './routes/directions';
import { directionsPresenceRouter } from './routes/directions-presence';
import { authRouter } from './routes/auth';
import { feedbackRouter } from './routes/feedback';
import { toiletReviewsRouter } from './routes/toilet-reviews';
import { notificationsRouter } from './routes/notifications';
import { requireAdmin } from './services/auth-service';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (origin && env.frontendOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  if (request.method === 'OPTIONS') {
    response.status(204).send();
    return;
  }
  next();
});

app.use('/api/directions', directionsRouter);
app.use('/api/directions', directionsPresenceRouter);
app.use('/api/directions-presence', directionsPresenceRouter);
app.use('/api/auth', authRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/toilet-reviews', toiletReviewsRouter);
app.use('/api/notifications', notificationsRouter);

type ToiletInput = Record<string, string | number | boolean | null>;
type InputMode = 'create' | 'update';

const maxBigInt = 9_223_372_036_854_775_807n;

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isValidToiletId(id: string): boolean {
  return /^[1-9]\d*$/.test(id) && BigInt(id) <= maxBigInt;
}

function getRouteId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value;
}

function parseToiletInput(
  body: unknown,
  mode: InputMode = 'create'
): { data: ToiletInput } | { error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const input = body as Record<string, unknown>;
  const data: ToiletInput = {};

  for (const column of [
    { name: 'name', maxLength: 100 },
    { name: 'address', maxLength: 255 }
  ] as const) {
    if (!hasOwn(input, column.name)) {
      if (mode === 'create') {
        return { error: 'name and address are required' };
      }
      continue;
    }

    const value = input[column.name];
    if (typeof value !== 'string' || value.trim() === '') {
      return { error: `${column.name} must be a non-empty string` };
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length > column.maxLength) {
      return { error: `${column.name} is too long` };
    }
    data[column.name] = trimmedValue;
  }

  for (const column of [
    { name: 'latitude', min: -90, max: 90 },
    { name: 'longitude', min: -180, max: 180 }
  ] as const) {
    if (!hasOwn(input, column.name)) {
      if (mode === 'create') {
        return { error: `${column.name} is required` };
      }
      continue;
    }

    const value = input[column.name];
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < column.min ||
      value > column.max
    ) {
      return {
        error: `${column.name} must be a number between ${column.min} and ${column.max}`
      };
    }
    data[column.name] = value;
  }
  const booleanColumns = [
    'open_24h',
    'accessible',
    'password_required',
    'male_toilet_available',
    'female_toilet_available',
    'emergency_bell_available',
    'diaper_changing_table_available'
  ];

  for (const column of booleanColumns) {
    if (hasOwn(input, column)) {
      if (typeof input[column] !== 'boolean') {
        return { error: `${column} must be a boolean` };
      }
      data[column] = input[column];
    }
  }

  if (hasOwn(input, 'opening_hours')) {
    if (
      input.opening_hours !== null &&
      (typeof input.opening_hours !== 'string' ||
        input.opening_hours.length > 100)
    ) {
      return { error: 'opening_hours must be a string or null' };
    }
    data.opening_hours = input.opening_hours;
  }

  const integerColumns = [
    { name: 'stairs_count', nullable: false },
    { name: 'male_toilet_count', nullable: true },
    { name: 'female_toilet_count', nullable: true }
  ] as const;

  for (const column of integerColumns) {
    if (!hasOwn(input, column.name)) {
      continue;
    }

    const value = input[column.name];
    if (value === null && column.nullable) {
      data[column.name] = null;
      continue;
    }

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 2_147_483_647
    ) {
      return { error: `${column.name} must be a non-negative integer` };
    }
    data[column.name] = value;
  }

  if (hasOwn(input, 'distance_meters')) {
    const value = input.distance_meters;
    if (
      value !== null &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 99_999_999.99)
    ) {
      return { error: 'distance_meters must be a non-negative number or null' };
    }
    data.distance_meters = value;
  }

  return { data };
}

app.get('/toilets', async (_request, response) => {
  try {
    const result = await pool.query('SELECT * FROM public.toilets;');
    response.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch toilets:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/toilets/:id', async (request, response) => {
  const id = getRouteId(request.params.id);

  if (!isValidToiletId(id)) {
    response.status(400).json({ message: 'Invalid toilet id' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM public.toilets WHERE id = $1;',
      [id]
    );
    const toilet = result.rows[0];

    if (toilet === undefined) {
      response.status(404).json({ message: 'Toilet not found' });
      return;
    }

    response.json(toilet);
  } catch (error) {
    console.error('Failed to fetch toilet:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/toilets', requireAdmin, async (request, response) => {
  const parsedInput = parseToiletInput(request.body);

  if ('error' in parsedInput) {
    response.status(400).json({ message: parsedInput.error });
    return;
  }

  const columns = Object.keys(parsedInput.data);
  const values = Object.values(parsedInput.data);
  const placeholders = values.map((_, index) => `$${index + 1}`);
  const query = `
    INSERT INTO public.toilets (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    response.status(201).json(result.rows[0]);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      response.status(409).json({ message: 'Toilet already exists' });
      return;
    }

    console.error('Failed to create toilet:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/toilets/:id', requireAdmin, async (request, response) => {
  const id = getRouteId(request.params.id);

  if (!isValidToiletId(id)) {
    response.status(400).json({ message: 'Invalid toilet id' });
    return;
  }

  const parsedInput = parseToiletInput(request.body, 'update');

  if ('error' in parsedInput) {
    response.status(400).json({ message: parsedInput.error });
    return;
  }

  const columns = Object.keys(parsedInput.data);

  if (columns.length === 0) {
    response.status(400).json({ message: 'No fields to update' });
    return;
  }

  const values = Object.values(parsedInput.data);
  const assignments = columns.map(
    (column, index) => `${column} = $${index + 1}`
  );
  values.push(id);

  const query = `
    UPDATE public.toilets
    SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    const toilet = result.rows[0];

    if (toilet === undefined) {
      response.status(404).json({ message: 'Toilet not found' });
      return;
    }

    response.json(toilet);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      response.status(409).json({ message: 'Toilet already exists' });
      return;
    }

    console.error('Failed to update toilet:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/toilets/:id', requireAdmin, async (request, response) => {
  const id = getRouteId(request.params.id);

  if (!isValidToiletId(id)) {
    response.status(400).json({ message: 'Invalid toilet id' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM public.toilets WHERE id = $1 RETURNING id;',
      [id]
    );

    if (result.rows[0] === undefined) {
      response.status(404).json({ message: 'Toilet not found' });
      return;
    }

    response.status(204).send();
  } catch (error) {
    console.error('Failed to delete toilet:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    response.status(400).json({ message: 'Invalid JSON body' });
    return;
  }

  next(error);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
