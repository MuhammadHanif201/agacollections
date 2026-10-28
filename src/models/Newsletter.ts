// Newsletter campaigns and their per-subscriber deliveries (admin side)
import mongoose, { Schema, type Model } from 'mongoose';

export interface NewsletterCampaignDoc {
  _id: number;
  subject: string;
  body_html?: string | null;
  status: string; // draft | sent
  sent_at?: Date | null;
  product_id?: number | null;
  created_at: Date;
  updated_at: Date;
}
export const NewsletterCampaign: Model<NewsletterCampaignDoc> =
  (mongoose.models.NewsletterCampaign as Model<NewsletterCampaignDoc>) ||
  mongoose.model<NewsletterCampaignDoc>('NewsletterCampaign', new Schema<NewsletterCampaignDoc>({
    _id: Number,
    subject: { type: String, required: true },
    body_html: String,
    status: { type: String, default: 'draft' },
    sent_at: Date,
    product_id: Number,
    created_at: Date,
    updated_at: Date,
  }, { versionKey: false }), 'newsletter_campaigns');

export interface NewsletterDeliveryDoc {
  _id: number;
  campaign_id: number;
  subscriber_id: number;
  status: 'queued' | 'sent' | 'failed';
  error?: string | null;
  sent_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
const DeliverySchema = new Schema<NewsletterDeliveryDoc>({
  _id: Number,
  campaign_id: { type: Number, required: true },
  subscriber_id: { type: Number, required: true },
  status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
  error: String,
  sent_at: Date,
  created_at: Date,
  updated_at: Date,
}, { versionKey: false });
DeliverySchema.index({ campaign_id: 1, subscriber_id: 1 }, { unique: true });
export const NewsletterDelivery: Model<NewsletterDeliveryDoc> =
  (mongoose.models.NewsletterDelivery as Model<NewsletterDeliveryDoc>) ||
  mongoose.model<NewsletterDeliveryDoc>('NewsletterDelivery', DeliverySchema, 'newsletter_deliveries');
