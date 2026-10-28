import mongoose, { Schema, type Model } from 'mongoose';

// Numeric ids continue the MySQL auto-increment sequences, so order numbers,
// product ids and links from the old site keep working after the move.
interface CounterDoc {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDoc>({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });

export const Counter: Model<CounterDoc> =
  (mongoose.models.Counter as Model<CounterDoc>) || mongoose.model<CounterDoc>('Counter', CounterSchema, 'counters');

export async function nextId(sequence: string, session?: mongoose.ClientSession): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: sequence },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session },
  ).lean();
  return doc!.seq;
}

/** Reserve `count` consecutive ids at once (used when saving several variants or images). */
export async function nextIds(sequence: string, count: number, session?: mongoose.ClientSession): Promise<number[]> {
  if (count <= 0) return [];
  const doc = await Counter.findOneAndUpdate(
    { _id: sequence },
    { $inc: { seq: count } },
    { upsert: true, returnDocument: 'after', session },
  ).lean();
  const last = doc!.seq;
  return Array.from({ length: count }, (_, i) => last - count + 1 + i);
}
