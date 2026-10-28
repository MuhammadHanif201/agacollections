import mongoose, { Schema, type Model } from 'mongoose';

// Paths present in the media store (Vercel Blob), so pages can check whether an
// optional file exists (Storage::disk('public')->exists()) without a network call.
export interface MediaFileDoc {
  _id: string; // relative path, e.g. "banners/zq-jeans-m.jpg"
  url: string;
  size?: number;
  created_at: Date;
}

const MediaFileSchema = new Schema<MediaFileDoc>(
  { _id: String, url: { type: String, required: true }, size: Number, created_at: { type: Date, default: () => new Date() } },
  { versionKey: false },
);

export const MediaFile: Model<MediaFileDoc> =
  (mongoose.models.MediaFile as Model<MediaFileDoc>) || mongoose.model<MediaFileDoc>('MediaFile', MediaFileSchema, 'media_files');
